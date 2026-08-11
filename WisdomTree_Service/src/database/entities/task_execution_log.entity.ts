import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutomationTaskEntity } from './automation_task.entity';

/**
 * 任务执行日志实体
 *
 * 映射数据库中的 task_execution_logs 表。
 * 记录每次自动化任务的执行结果（成功/失败/跳过）。
 */
@Entity('task_execution_logs')
export class TaskExecutionLogEntity {
  /** 日志ID，自增长主键 */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /** 所属的自动化任务（多对一） */
  @ManyToOne(() => AutomationTaskEntity, (task) => task.logs)
  @JoinColumn({ name: 'task_id' })
  task: AutomationTaskEntity;

  /** 执行时间 */
  @Column({ type: 'timestamp' })
  executed_at: Date;

  /** 执行状态: success | failed | skipped */
  @Column({ type: 'varchar', length: 20 })
  status: string;

  /** 执行结果摘要 */
  @Column({ type: 'text', nullable: true })
  result: string;

  /** 执行失败时的错误信息 */
  @Column({ type: 'text', nullable: true })
  error: string;
}
