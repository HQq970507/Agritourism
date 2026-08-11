import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * 创建自动化任务 DTO
 */
export class CreateAutomationTaskDto {
  /** 任务名称，如"智能灌溉任务" */
  @IsString()
  name: string;

  /** 任务类型: irrigation | reminder | report | notification | custom */
  @IsString()
  @IsIn(['irrigation', 'reminder', 'report', 'notification', 'custom'])
  taskType: string;

  /** 触发类型: schedule | interval | condition */
  @IsString()
  @IsIn(['schedule', 'interval', 'condition'])
  triggerType: string;

  /** 定时 cron 表达式，如 "0 9 * * *" 表示每天早上9点 */
  @IsOptional()
  @IsString()
  cronExpr?: string;

  /** 间隔触发的分钟数 */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  intervalMinutes?: number;

  /** 任务参数，如 { device, duration, message } */
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  /** 任务描述 */
  @IsOptional()
  @IsString()
  description?: string;
}
