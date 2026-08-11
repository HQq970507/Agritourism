import { Injectable, Logger } from '@nestjs/common';
import { AgentTool } from './tools/base.tool';

@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private readonly tools = new Map<string, AgentTool>();

  /**
   * Register a tool in the registry.
   */
  register(tool: AgentTool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool "${tool.name}" is already registered, overwriting.`);
    }
    this.tools.set(tool.name, tool);
    this.logger.log(`Tool registered: ${tool.name}`);
  }

  /**
   * Get a tool by name.
   * @throws Error if tool is not found
   */
  getTool(name: string): AgentTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry`);
    }
    return tool;
  }

  /**
   * Check if a tool exists in the registry.
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools.
   */
  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool descriptions formatted for the LLM prompt.
   */
  getToolsDescription(): string {
    return this.getAllTools()
      .map(
        (t) =>
          `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`,
      )
      .join('\n\n');
  }
}
