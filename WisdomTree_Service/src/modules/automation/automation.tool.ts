/**
 * AutomationTool — Agent 集成骨架（未接线）
 *
 * 说明：
 * 本文件是 AI Agent 集成自动化任务能力的接入点文档。
 * 由于 agent/ 模块由并行 agent 负责，本文件当前【不会】被注册到
 * AgentService / ToolRegistry 中。
 *
 * 接线方式（由 agent 模块负责人完成）：
 * 1. 在 AgentModule 中注册本工具（或将其改为 @Injectable 并注入 AutomationService）；
 * 2. 在 ToolRegistry 中注册 `automation` 名称；
 * 3. 在 IntentClassifier 中增加匹配该工具意图的规则（如"创建定时任务"、"查询我的自动化任务"）。
 *
 * 接口约定遵循 agent/tools/base.tool.ts 中的 AgentTool 接口
 * （name / description / parameters / execute(params, userId)）。
 */
export class AutomationTool {
  /** 工具名称，需与 IntentClassifier 的意图名称一致 */
  readonly name = 'automation';

  /** 工具描述，用于 LLM 识别何时调用本工具 */
  readonly description = '自动化任务管理：创建定时任务、查询任务状态';

  /** JSON Schema 参数定义 */
  readonly parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'list', 'logs', 'pause', 'resume', 'delete'],
        description: '操作类型：创建/查询任务列表/查询日志/暂停/恢复/删除',
      },
      name: {
        type: 'string',
        description: '任务名称（create 时必填）',
      },
      taskType: {
        type: 'string',
        enum: ['irrigation', 'reminder', 'report', 'notification', 'custom'],
        description: '任务类型（create 时必填）',
      },
      triggerType: {
        type: 'string',
        enum: ['schedule', 'interval', 'condition'],
        description: '触发类型（create 时必填）',
      },
      cronExpr: {
        type: 'string',
        description: 'cron 表达式，如 "0 9 * * *"（schedule 时使用）',
      },
      intervalMinutes: {
        type: 'number',
        description: '间隔分钟数（interval 时使用）',
      },
      params: {
        type: 'object',
        description: '任务参数，如 { device, duration, message }',
      },
      taskId: {
        type: 'number',
        description: '任务 ID（logs/pause/resume/delete 时使用）',
      },
    },
    required: ['action'],
  };

  /**
   * 执行自动化任务相关操作。
   *
   * 注意：当前未接线到 AgentService。实现时可将本类改为 @Injectable 并注入
   * AutomationService，然后按 action 分发到 createTask / getMyTasks /
   * getTaskLogs / pauseTask / resumeTask / deleteTask 等方法。
   *
   * @param params - 意图分类提取的参数
   * @param userId - 认证用户 ID
   */
  async execute(params: any, userId: number): Promise<any> {
    // TODO(agent 模块负责人)：接入 AutomationService 后实现真正的分发逻辑。
    // 当前为骨架占位，未被 AgentService 调用。
    return {
      status: 'not_implemented',
      message:
        '自动化任务工具尚未接入 AgentService，请等待 agent 模块完成接线。',
      hint: {
        action: params?.action,
        taskId: params?.taskId,
        userId,
      },
    };
  }
}
