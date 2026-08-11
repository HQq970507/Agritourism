import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IntentResult, MessageContext } from './dto/agent.dto';

@Injectable()
export class IntentClassifier {
  private readonly logger = new Logger(IntentClassifier.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('DASHSCOPE_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  /**
   * Classify user message intent using DeepSeek.
   * @param message - The user's current message
   * @param context - Recent conversation history
   * @returns Intent classification result with parameters
   */
  async classify(message: string, context: MessageContext[] = []): Promise<IntentResult> {
    const systemPrompt = this.buildSystemPrompt();
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent context (last 4 exchanges)
    const recentContext = context.slice(-8);
    for (const msg of recentContext) {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    try {
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.1, // Low temperature for consistent classification
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      // Validate result has required fields
      const intent: IntentResult = {
        intent: result.intent || 'general_chat',
        confidence: Math.min(Math.max(result.confidence || 0, 0), 1),
        params: result.params || {},
      };

      this.logger.debug(
        `Classified intent: ${intent.intent} (confidence: ${intent.confidence})`,
      );

      return intent;
    } catch (error) {
      this.logger.error(`Intent classification failed: ${error.message}`);
      // Fallback to general_chat on error
      return {
        intent: 'general_chat',
        confidence: 0,
        params: { originalMessage: message },
      };
    }
  }

  /**
   * Build the system prompt for intent classification.
   */
  private buildSystemPrompt(): string {
    return `你是一个智能农业旅游平台的意图分类器。请分析用户的消息并返回JSON格式的意图识别结果。

支持以下意图：

1. **product_query** - 用户询问农产品信息（水果成熟期、农产品品种、价格等）
   - 示例: "草莓什么时候熟?", "有什么农产品?", "桃子多少钱一斤?"
   
2. **order_query** - 用户查询自己的订单/认养记录
   - 示例: "我的订单到哪了?", "我认养了几棵树?", "查一下我的认养记录"

3. **product_recommend** - 用户需要产品推荐
   - 示例: "适合送人的农产品推荐", "带孩子适合认养什么?", "有什么好吃的推荐?"

4. **trip_planning** - 用户询问旅游/采摘/游玩相关信息
   - 示例: "周末带孩子去哪玩?", "什么时候去采摘好?", "农场有什么好玩的?"

5. **diagnose** - 用户询问植物养护/病虫害问题
   - 示例: "这个叶子怎么黄了?", "树苗蔫了怎么办?", "怎么给果树施肥?"

6. **activity_query** - 用户查询近期活动
   - 示例: "最近有什么活动?", "这周末有采摘活动吗?", "怎么报名参加活动?"

7. **general_chat** - 问候、闲聊或其他不在上述类别的内容
   - 示例: "你好", "谢谢", "再见"

JSON格式要求：
{
  "intent": "意图名称",
  "confidence": 0-1之间的置信度数值,
  "params": {
    // 根据意图提取关键参数
    // product_query: { product: "草莓", aspect: "season/price/品种" }
    // order_query: { orderId: "订单号" } 或 {}
    // product_recommend: { occasion: "送人", preference: "甜" }
    // trip_planning: { time: "周末", participants: "孩子", preference: "采摘" }
    // diagnose: { plant: "植物名", symptom: "叶子发黄" }
    // activity_query: { time: "近期", type: "采摘/体验" }
    // general_chat: { topic: "问候/感谢" }
  }
}

请严格按JSON格式返回，不要包含其他文字。请确保返回的是纯净的JSON对象，不要用markdown代码块包裹。`;
  }
}
