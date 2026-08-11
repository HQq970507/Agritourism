import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AgentTool } from './base.tool';

@Injectable()
export class DiagnoseTool implements AgentTool {
  readonly name = 'diagnose';
  readonly description =
    '植物病虫害诊断和养护建议，回答植物健康、施肥、浇水、光照等问题';
  readonly parameters = {
    type: 'object',
    properties: {
      plant: { type: 'string', description: '植物名称' },
      symptom: { type: 'string', description: '症状描述，如叶子发黄、枯萎等' },
    },
  };

  private readonly logger = new Logger(DiagnoseTool.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('DASHSCOPE_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async execute(params: any, _userId: number): Promise<any> {
    try {
      const plant = params?.plant || '';
      const symptom = params?.symptom || '';

      const systemPrompt = `你是一名经验丰富的农业园艺专家，专门解答植物种植、养护、病虫害防治等问题。
请根据用户描述给出专业、实用的建议。回答应该：
1. 分析可能的原因
2. 提供具体的解决方案
3. 给出预防建议
4. 用中文回答，通俗易懂`;

      const userPrompt = plant && symptom
        ? `我的${plant}出现了以下问题：${symptom}。请帮我分析原因并给出解决方案。`
        : symptom
          ? `我的植物出现了以下问题：${symptom}。请帮我分析原因并给出解决方案。`
          : plant
            ? `请介绍一下${plant}的养护方法和注意事项。`
            : '请分享一些植物养护的通用建议。';

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      const advice = response.choices[0]?.message?.content || '暂时无法提供诊断建议，请稍后再试。';

      return {
        success: true,
        plant: plant || '未知植物',
        symptom: symptom || '一般咨询',
        advice,
      };
    } catch (error) {
      this.logger.error(`DiagnoseTool error: ${error.message}`);
      return {
        success: false,
        plant: params?.plant || '未知植物',
        symptom: params?.symptom || '',
        advice: '诊断服务暂时不可用，请稍后再试。如情况紧急，建议咨询当地农业技术人员。',
        error: error.message,
      };
    }
  }
}
