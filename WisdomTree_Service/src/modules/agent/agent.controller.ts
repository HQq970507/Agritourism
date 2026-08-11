import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { AgentChatDto } from './dto/agent.dto';
import { ReqDto } from '../token/dto/token.dto';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /agent/chat
   * Process a chat message through the AI agent pipeline.
   */
  @Post('chat')
  async chat(
    @Body() body: AgentChatDto,
    @Request() req: ReqDto,
  ) {
    const result = await this.agentService.processMessage(
      req.user.id,
      body.message,
      body.sessionId,
    );

    return {
      status: 200,
      code: 0,
      message: 'success',
      data: result,
    };
  }

  /**
   * GET /agent/sessions
   * List the current user's conversation sessions.
   */
  @Get('sessions')
  async getSessions(@Request() req: ReqDto) {
    const sessions = this.agentService.getUserSessions(req.user.id);

    return {
      status: 200,
      code: 0,
      message: 'success',
      data: sessions.map((s) => ({
        sessionId: s.sessionId,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        preview: s.messages.length > 0
          ? s.messages[s.messages.length - 1]?.content?.substring(0, 100)
          : '',
      })),
    };
  }
}
