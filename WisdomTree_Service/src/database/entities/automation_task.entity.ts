import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { TaskExecutionLogEntity } from './task_execution_log.entity';

/**
 * 自动化任务实体
 *
 * 映射数据库中的 automation_tasks 表。
 * 表示一条用户创建的定时/循环自动化任务（如"每天早上9点提醒浇水"、
 * "库存低于阈值时通知"），由后台调度器按 cron 表达式或固定间隔执行。
 */
@Entity('automation_tasks')
export class AutomationTaskEntity {
  /** 任务ID，自增长主键 */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /** 任务名称，如"智能灌溉任务" */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** 任务描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 任务类型: irrigation | reminder | report | notification | custom */
  @Column({ type: 'varchar', length: 50 })
  task_type: string;

  /** 触发类型: schedule(定时) | interval(间隔) | condition(条件) */
  @Column({ type: 'varchar', length: 30 })
  trigger_type: string;

  /** 定时 cron 表达式，如 "0 9 * * *" 表示每天早上9点 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  cron_expr: string;

  /** 间隔触发的分钟数 */
  @Column({ type: 'int', nullable: true })
  interval_minutes: number;

  /** 任务参数 JSON，如 { device, duration, message } */
  @Column({ type: 'json', nullable: true })
  params: Record<string, any>;

  /** 任务状态: active | paused */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  /** 上次执行时间 */
  @Column({ type: 'timestamp', nullable: true })
  last_run_at: Date;

  /** 下次执行时间 */
  @Column({ type: 'timestamp', nullable: true })
  next_run_at: Date;

  /** 创建任务的用户（多对一） */
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /** 该任务的所有执行日志（一对多） */
  @OneToMany(() => TaskExecutionLogEntity, (log) => log.task)
  logs: TaskExecutionLogEntity[];

  /** 创建时间 */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /** 更新时间 */
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
