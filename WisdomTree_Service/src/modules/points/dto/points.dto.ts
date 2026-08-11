import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// 分页查询
export class PaginateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 10;
}

// 每日签到响应
export class CheckInResponseDto {
  points: number;
  streak: number;
  total: number;
}

// 积分记录
export class PointsRecordDto {
  id: number;
  points: number;
  receivedPoints: number;
  source: string;
  date: string;
  finish: boolean;
}

// 积分历史响应
export class PointsHistoryResponseDto {
  records: PointsRecordDto[];
  total: number;
  page: number;
  pageSize: number;
}

// 排行榜条目
export class LeaderboardEntryDto {
  id: number;
  username: string;
  avatar: string;
  energy: number;
  rank: number;
}

// 积分概览响应
export class PointsSummaryResponseDto {
  total: number;
  todayEarned: number;
  checkInDone: boolean;
  streak: number;
}
