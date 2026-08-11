import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// 记录追溯事件请求
export class RecordTraceEventDto {
  @IsNotEmpty()
  @IsString()
  trace_code: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order_id?: number;

  @IsOptional()
  @IsNumber()
  product_id?: number;
}

// 追溯查询参数
export class TraceQueryDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

// 追溯事件响应
export class TraceEventResponseDto {
  id: number;
  trace_code: string;
  order_id: number;
  product_id: number;
  stage: string;
  location: string;
  operator: string;
  media_urls: string[];
  description: string;
  recorded_at: Date;
}

// 追溯时间线响应
export class TraceTimelineResponseDto {
  trace_code: string;
  events: TraceEventResponseDto[];
}
