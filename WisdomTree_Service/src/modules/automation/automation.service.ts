import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { AutomationTaskEntity } from 'src/database/entities/automation_task.entity';
import { TaskExecutionLogEntity } from 'src/database/entities/task_execution_log.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { CreateAutomationTaskDto } from './dto/automation.dto';

/**
 * 自动化任务编排服务
 *
 * 提供自动化任务(定时/间隔/条件)的创建、查询、暂停、恢复、删除，
 * 并通过 setInterval 驱动的后台调度器每 30 秒检查一次到期任务并执行。
 */
@Injectable()
export class AutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationService.name);

  /** 调度器定时器句柄 */
  private schedulerTimer: NodeJS.Timeout | null = null;

  /** 正在执行中的任务ID集合，防止并发重复执行 */
  private readonly processing = new Set<number>();

  constructor(
    @InjectRepository(AutomationTaskEntity)
    private readonly taskRepo: Repository<AutomationTaskEntity>,
    @InjectRepository(TaskExecutionLogEntity)
    private readonly logRepo: Repository<TaskExecutionLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /** 模块初始化后启动后台调度器，每 30 秒检查一次到期任务 */
  onModuleInit() {
    this.schedulerTimer = setInterval(() => {
      this.checkDueTasks().catch((error) =>
        this.logger.error(`checkDueTasks error: ${error.message}`),
      );
    }, 30000);
    this.logger.log('自动化任务调度器已启动（每 30 秒检查一次到期任务）');
  }

  /** 模块销毁时清理定时器 */
  onModuleDestroy() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * 检查并执行所有到期任务。
   * 到期条件：状态 active 且 next_run_at 为空（首次尚未排期）或已到时间。
   */
  async checkDueTasks(): Promise<void> {
    const now = new Date();
    const dueTasks = await this.taskRepo.find({
      where: [
        { status: 'active', next_run_at: IsNull() },
        { status: 'active', next_run_at: LessThanOrEqual(now) },
      ],
    });

    for (const task of dueTasks) {
      // 跳过正在执行中的任务，避免重复执行
      if (this.processing.has(task.id)) {
        continue;
      }
      this.processing.add(task.id);
      try {
        await this.executeTask(task);
      } finally {
        this.processing.delete(task.id);
      }
    }
  }

  /**
   * 创建自动化任务
   */
  async createTask(
    userId: number,
    dto: CreateAutomationTaskDto,
  ): Promise<ApiResponse> {
    try {
      // 校验用户存在（不加载完整用户实体，避免密码等敏感信息随响应返回）
      const userExists = await this.userRepo.exists({ where: { id: userId } });
      if (!userExists) {
        throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
      }

      const task = this.taskRepo.create({
        name: dto.name,
        description: dto.description ?? null,
        task_type: dto.taskType,
        trigger_type: dto.triggerType,
        cron_expr: dto.cronExpr ?? null,
        interval_minutes: dto.intervalMinutes ?? null,
        params: dto.params ?? null,
        status: 'active',
        user: { id: userId },
      });
      // 计算首次执行时间
      task.next_run_at = this.computeNextRun(task);

      const saved = await this.taskRepo.save(task);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '创建成功',
        data: saved,
      };
    } catch (error) {
      this.logger.error(`createTask error: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 查询用户的任务列表（含最近 5 条执行日志）
   */
  async getMyTasks(userId: number): Promise<ApiResponse> {
    try {
      const tasks = await this.taskRepo.find({
        where: { user: { id: userId } },
        relations: ['logs'],
        order: { created_at: 'DESC' },
      });

      const data = tasks.map((task) => ({
        ...task,
        logs: (task.logs || [])
          .sort(
            (a, b) =>
              new Date(b.executed_at).getTime() -
              new Date(a.executed_at).getTime(),
          )
          .slice(0, 5),
      }));

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '查询成功',
        data,
      };
    } catch (error) {
      this.logger.error(`getMyTasks error: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 查询某任务的全部执行日志
   */
  async getTaskLogs(
    taskId: number,
    userId: number,
  ): Promise<ApiResponse> {
    try {
      const task = await this.taskRepo.findOne({
        where: { id: taskId, user: { id: userId } },
      });
      if (!task) {
        throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
      }

      const logs = await this.logRepo.find({
        where: { task: { id: taskId } },
        order: { executed_at: 'DESC' },
      });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '查询成功',
        data: { task, logs },
      };
    } catch (error) {
      this.logger.error(`getTaskLogs error: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: number, userId: number): Promise<ApiResponse> {
    try {
      const task = await this.taskRepo.findOne({
        where: { id: taskId, user: { id: userId } },
      });
      if (!task) {
        throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
      }
      if (task.status === 'paused') {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '任务已处于暂停状态',
        };
      }
      task.status = 'paused';
      task.next_run_at = null;
      await this.taskRepo.save(task);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '暂停成功',
      };
    } catch (error) {
      this.logger.error(`pauseTask error: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 恢复任务（重新计算下次执行时间）
   */
  async resumeTask(taskId: number, userId: number): Promise<ApiResponse> {
    try {
      const task = await this.taskRepo.findOne({
        where: { id: taskId, user: { id: userId } },
      });
      if (!task) {
        throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
      }
      if (task.status === 'active') {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '任务已处于激活状态',
        };
      }
      task.status = 'active';
      task.next_run_at = this.computeNextRun(task);
      await this.taskRepo.save(task);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '恢复成功',
      };
    } catch (error) {
      this.logger.error(`resumeTask error: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 删除任务（先删除其执行日志，避免外键约束冲突）
   */
  async deleteTask(taskId: number, userId: number): Promise<ApiResponse> {
    try {
      const task = await this.taskRepo.findOne({
        where: { id: taskId, user: { id: userId } },
      });
      if (!task) {
        throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
      }
      await this.logRepo.delete({ task: { id: taskId } });
      await this.taskRepo.delete(taskId);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '删除成功',
      };
    } catch (error) {
      this.logger.error(`deleteTask error: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 执行单个任务：写入执行日志并更新 last_run_at / next_run_at。
   * 此处为演示实现，根据 task_type 模拟执行结果。
   */
  async executeTask(task: AutomationTaskEntity): Promise<void> {
    const now = new Date();
    try {
      // 模拟执行：按任务类型生成结果
      const result = this.simulateExecution(task);

      await this.logRepo.save({
        task: { id: task.id },
        executed_at: now,
        status: 'success',
        result: JSON.stringify(result),
      });

      task.last_run_at = now;
      const next = this.computeNextRun(task);
      if (next) {
        task.next_run_at = next;
      } else {
        // 没有后续排期（如条件型任务），暂停避免无限循环执行
        task.next_run_at = null;
        task.status = 'paused';
      }
      await this.taskRepo.save(task);
      this.logger.log(
        `任务 #${task.id}「${task.name}」执行成功，下次执行：${task.next_run_at || '无'}`,
      );
    } catch (error) {
      // 执行失败：记录失败日志
      await this.logRepo.save({
        task: { id: task.id },
        executed_at: now,
        status: 'failed',
        error: error.message,
      });
      this.logger.error(`任务 #${task.id}「${task.name}」执行失败：${error.message}`);
    }
  }

  /**
   * 根据任务类型模拟执行结果
   */
  private simulateExecution(task: AutomationTaskEntity): Record<string, any> {
    const params = task.params || {};
    switch (task.task_type) {
      case 'irrigation':
        return {
          action: 'open_valve',
          device: params.device || '未知设备',
          duration: params.duration || 10,
        };
      case 'reminder':
        return { message: params.message || `提醒：${task.name}` };
      case 'report':
        return { generated: true };
      case 'notification':
        return {
          notified: true,
          message: params.message || `通知：${task.name}`,
        };
      default:
        return { success: true };
    }
  }

  /**
   * 计算任务的下次执行时间。
   * - interval: now（或上次执行时间）+ interval_minutes 分钟
   * - schedule: 基于 cron 表达式（"分钟 小时 * * *" 每日格式）计算下一次
   * - 其他/无法解析: 返回 null（表示无自动排期）
   */
  private computeNextRun(task: AutomationTaskEntity): Date | null {
    // 间隔触发
    if (
      task.trigger_type === 'interval' &&
      task.interval_minutes &&
      task.interval_minutes > 0
    ) {
      const base = task.last_run_at
        ? new Date(task.last_run_at)
        : new Date();
      return new Date(base.getTime() + task.interval_minutes * 60 * 1000);
    }

    // 定时触发（cron）
    if (task.trigger_type === 'schedule' && task.cron_expr) {
      return this.computeNextFromCron(task.cron_expr, new Date());
    }

    // 条件触发等其他类型：暂无自动排期
    return null;
  }

  /**
   * 简单 cron 解析，仅支持每日格式 "minute hour * * *"。
   * 返回下一个触发时刻：今天该时刻若已过去则顺延到明天。
   * 解析失败返回 null。
   */
  private computeNextFromCron(cronExpr: string, from: Date): Date | null {
    if (!cronExpr) {
      return null;
    }
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 2) {
      return null;
    }
    const minute = parseInt(parts[0], 10);
    const hour = parseInt(parts[1], 10);
    if (
      isNaN(minute) ||
      isNaN(hour) ||
      minute < 0 ||
      minute > 59 ||
      hour < 0 ||
      hour > 23
    ) {
      return null;
    }

    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= from.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }
}
