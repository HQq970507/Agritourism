/**
 * AgentTool interface
 * Every tool must implement this interface to be registered in the ToolRegistry.
 */
export interface AgentTool {
  /** Unique tool name, must match intent names from IntentClassifier */
  name: string;

  /** Human-readable description of what this tool does */
  description: string;

  /** JSON Schema describing the parameters this tool accepts */
  parameters: Record<string, any>;

  /**
   * Execute the tool with the given parameters and user context.
   * @param params - Tool parameters extracted from intent classification
   * @param userId - The authenticated user's ID
   * @returns Result data that will be passed to the LLM for response generation
   */
  execute(params: any, userId: number): Promise<any>;
}
