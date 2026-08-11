import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Chat request DTO */
export class AgentChatDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

/** Agent response DTO */
export interface AgentResponse {
  reply: string;
  sessionId: string;
  intent: string;
  confidence: number;
  toolResult?: any;
}

/** Conversation message context */
export interface MessageContext {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/** Intent classification result */
export interface IntentResult {
  intent: string;
  confidence: number;
  params: Record<string, any>;
}

/** Conversation session */
export interface ConversationSession {
  sessionId: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageContext[];
}
