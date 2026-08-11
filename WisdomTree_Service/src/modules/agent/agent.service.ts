import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IntentClassifier } from './intent.classifier';
import { ToolRegistry } from './tool.registry';
import { MemoryService } from './memory.service';
import { KnowledgeService } from './knowledge/knowledge.service';
import { ProductTool } from './tools/product.tool';
import { OrderTool } from './tools/order.tool';
import { ActivityTool } from './tools/activity.tool';
import { DiagnoseTool } from './tools/diagnose.tool';
import { TripTool } from './tools/trip.tool';
import {
  AgentResponse,
  MessageContext,
  IntentResult,
} from './dto/agent.dto';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private readonly openai: OpenAI;

  // Tools that don't require tool execution (purely conversational)
  private readonly noToolIntents = new Set([
    'general_chat',
    'product_recommend',
  ]);

  constructor(
    private readonly intentClassifier: IntentClassifier,
    private readonly toolRegistry: ToolRegistry,
    private readonly memoryService: MemoryService,
    private readonly configService: ConfigService,
    private readonly knowledgeService: KnowledgeService,
    private readonly productTool: ProductTool,
    private readonly orderTool: OrderTool,
    private readonly activityTool: ActivityTool,
    private readonly diagnoseTool: DiagnoseTool,
    private readonly tripTool: TripTool,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('DASHSCOPE_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  /**
   * Register all tools on module init.
   */
  onModuleInit() {
    this.toolRegistry.register(this.productTool);
    this.toolRegistry.register(this.orderTool);
    this.toolRegistry.register(this.activityTool);
    this.toolRegistry.register(this.diagnoseTool);
    this.toolRegistry.register(this.tripTool);
    this.logger.log(
      `AgentService initialized with ${this.toolRegistry.getAllTools().length} tools`,
    );
  }

  /**
   * Process a user message through the agent pipeline:
   * 1. Get/create conversation memory
   * 2. Classify intent
   * 3. Route to appropriate tool (if applicable)
   * 4. Generate response via LLM with context and tool data
   * 5. Save to memory
   * 6. Return response
   */
  async processMessage(
    userId: number,
    message: string,
    sessionId?: string,
  ): Promise<AgentResponse> {
    // 1. Get or create conversation memory
    const session = this.memoryService.getOrCreateSession(
      sessionId || `session_${userId}_${Date.now()}`,
      userId,
    );

    // 2. Add user message to memory
    this.memoryService.addMessage(session.sessionId, 'user', message);

    // 3. Get conversation context (last 6 exchanges for relevance but not too much noise)
    const context = this.memoryService.getContext(session.sessionId, 6);

    // 4. Classify intent
    const intentResult = await this.intentClassifier.classify(message, context);

    // 5. Execute tool if applicable
    let toolResult = null;
    if (!this.noToolIntents.has(intentResult.intent)) {
      toolResult = await this.executeTool(intentResult, userId);
    }

    // 6. Retrieve relevant knowledge from the knowledge base
    // Search for relevant context for product_query, diagnose, and general_chat intents
    let knowledgeContext = '';
    if (['product_query', 'diagnose', 'general_chat', 'product_recommend', 'trip_planning'].includes(intentResult.intent)) {
      try {
        const knowledgeChunks = await this.knowledgeService.search(message, 4);
        if (knowledgeChunks.length > 0) {
          knowledgeContext = this.knowledgeService.formatContext(knowledgeChunks);
          this.logger.debug(`Retrieved ${knowledgeChunks.length} knowledge chunks for intent: ${intentResult.intent}`);
        }
      } catch (error) {
        this.logger.warn(`Knowledge retrieval error: ${error.message}`);
      }
    }

    // 7. Generate response via LLM with context
    const reply = await this.generateResponse(
      message,
      context,
      intentResult,
      toolResult,
      knowledgeContext,
    );

    // 8. Add assistant response to memory
    this.memoryService.addMessage(session.sessionId, 'assistant', reply);

    this.logger.log(
      `[Session: ${session.sessionId}] Intent: ${intentResult.intent} | User: ${userId}`,
    );

    // 9. Return response
    return {
      reply,
      sessionId: session.sessionId,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      // 携带工具执行的结构化结果（如 trip_planning 的 schedule/products/scenic/tips），供前端渲染/保存
      toolResult: toolResult ?? undefined,
    };
  }

  /**
   * Execute the appropriate tool based on classified intent.
   */
  private async executeTool(
    intent: IntentResult,
    userId: number,
  ): Promise<any> {
    try {
      if (this.toolRegistry.hasTool(intent.intent)) {
        const tool = this.toolRegistry.getTool(intent.intent);
        this.logger.debug(`Executing tool: ${tool.name}`);
        return await tool.execute(intent.params, userId);
      }
      this.logger.debug(`No tool found for intent: ${intent.intent}`);
      return null;
    } catch (error) {
      this.logger.error(`Tool execution error: ${error.message}`);
      return {
        error: true,
        message: '工具执行出错，请稍后再试',
      };
    }
  }

  /**
   * Generate a natural language response using Qwen with full context.
   */
  private async generateResponse(
    message: string,
    context: MessageContext[],
    intent: IntentResult,
    toolResult: any,
    knowledgeContext: string = '',
  ): Promise<string> {
    const systemPrompt = this.buildResponseSystemPrompt(intent, toolResult, knowledgeContext);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 4 exchanges for context relevance)
    const recentHistory = context.slice(-4);
    for (const msg of recentHistory) {
      if (msg.role === 'system') continue;
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      return (
        response.choices[0]?.message?.content ||
        '抱歉，我暂时无法回答这个问题，请稍后再试。'
      );
    } catch (error) {
      this.logger.error(`Response generation error: ${error.message}`);
      return '抱歉，我遇到了技术问题，请稍后再试。';
    }
  }

  /**
   * Build the system prompt for response generation, dynamically including tool data.
   */
  private buildResponseSystemPrompt(
    intent: IntentResult,
    toolResult: any,
    knowledgeContext: string = '',
  ): string {
    let prompt = `你叫"智农助手"，是智慧农业旅游平台的AI助手。
 你的任务是根据用户问题、意图识别结果和查询数据，生成自然、友好、有用的中文回复。

## 回复风格
- 使用亲切自然的语气，像经验丰富的农业专家和朋友
- 回复简洁明了，重点突出
- 适当使用emoji让回复更生动（🌱🍓🌾🌸）
- 在合适的时候给出后续建议或引导

## 当前用户意图
意图: ${intent.intent}
参数: ${JSON.stringify(intent.params, null, 2)}
`;

    // Add knowledge base context if available
    if (knowledgeContext) {
      prompt += `\n## 知识库参考信息\n${knowledgeContext}\n`;
    }

    // Add tool result data if available
    if (toolResult) {
      prompt += `\n## 查询结果数据\n${JSON.stringify(toolResult, null, 2)}\n\n`;
      prompt += `请基于以上查询结果回答用户问题。如果数据为空或未找到相关信息，请友好地告知用户并建议其他可行方案。`;
    }

    // Intent-specific guidelines
    switch (intent.intent) {
      case 'product_query':
        prompt += `\n回答要点：列出产品名称、特点、成熟期（如果有）、认养所需能量。如果用户问特定产品，给出详细信息。`;
        break;
      case 'order_query':
        prompt += `\n回答要点：列出用户的认养记录，包括认养编号、树木名称、认养时间、认养区域。如果用户没有认养记录，引导用户去认养。`;
        break;
      case 'product_recommend':
        prompt += `\n回答要点：根据用户的场合和偏好推荐合适的农产品/认养方案，解释推荐理由。`;
        break;
      case 'trip_planning':
        prompt += `\n回答要点：推荐适合的农场活动和游玩项目，提醒用户查看近期活动，给出行程建议。`;
        break;
      case 'diagnose':
        prompt += `\n回答要点：用通俗易懂的语言分析问题原因，给出具体的解决方案和预防建议。语气要专业且亲切。`;
        break;
      case 'activity_query':
        prompt += `\n回答要点：列出近期活动的时间、地点、报名情况。鼓励用户参与并询问是否需要了解更多。`;
        break;
      default:
        prompt += `\n回答要点：自然友好地回应，如果是问候则问候回去，如果是闲聊则友好互动。可以顺势介绍平台功能。`;
    }

    return prompt;
  }

  /**
   * Get all sessions for a user (admin use).
   */
  getUserSessions(userId: number) {
    return this.memoryService.getUserSessions(userId);
  }
}
