import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConversationSession, MessageContext } from './dto/agent.dto';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly sessions = new Map<string, ConversationSession>();

  /** Maximum messages kept per session to limit context window */
  private readonly MAX_MESSAGES = 20;

  /** Session idle TTL: 30 minutes */
  private readonly SESSION_TTL_MS = 30 * 60 * 1000;

  /**
   * Get an existing session or create a new one.
   */
  getOrCreateSession(sessionId: string, userId?: number): ConversationSession {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.updatedAt = new Date();
      return existing;
    }

    const session: ConversationSession = {
      sessionId,
      userId: userId || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    };
    this.sessions.set(sessionId, session);
    this.logger.log(`Created new session: ${sessionId}`);
    return session;
  }

  /**
   * Add a message to the session's history.
   * Trims oldest messages when exceeding MAX_MESSAGES.
   */
  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Session ${sessionId} not found, creating new one.`);
      const newSession = this.getOrCreateSession(sessionId);
      newSession.messages.push({ role, content, timestamp: new Date() });
      return;
    }

    session.messages.push({ role, content, timestamp: new Date() });
    session.updatedAt = new Date();

    // Trim oldest messages if exceeding limit
    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }
  }

  /**
   * Get conversation context for LLM prompt.
   * Returns the last N messages.
   */
  getContext(sessionId: string, limit: number = 10): MessageContext[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return session.messages.slice(-limit);
  }

  /**
   * Get all sessions for a specific user.
   */
  getUserSessions(userId: number): ConversationSession[] {
    const userSessions: ConversationSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  /**
   * Delete a session.
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions (internal maintenance).
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.updatedAt.getTime() > this.SESSION_TTL_MS) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}
