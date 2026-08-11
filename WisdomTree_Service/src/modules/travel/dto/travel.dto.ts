import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

// 创建线路预约
export class CreateReservationDto {
  @IsNotEmpty({ message: '线路ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '请输入正确的线路ID' })
  routeId: number;

  @IsNotEmpty({ message: '游玩日期不能为空' })
  @IsString({ message: '请输入正确的游玩日期' })
  visitDate: string;

  @IsNotEmpty({ message: '游玩人数不能为空' })
  @Type(() => Number)
  @IsInt({ message: '请输入正确的人数' })
  @Min(1, { message: '游玩人数至少为1' })
  partySize: number;

  @IsNotEmpty({ message: '联系人姓名不能为空' })
  @IsString({ message: '请输入正确的联系人姓名' })
  contactName: string;

  @IsNotEmpty({ message: '联系电话不能为空' })
  @IsString({ message: '请输入正确的联系电话' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  contactPhone: string;

  @IsOptional()
  @IsString({ message: '请输入正确的备注' })
  remark?: string;
}

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

// 旅程站点
export class JourneyStopDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '请输入正确的站点ID' })
  id?: number;

  @IsNotEmpty({ message: '站点名称不能为空' })
  @IsString({ message: '请输入正确的站点名称' })
  name: string;

  @IsNotEmpty({ message: '站点类型不能为空' })
  @IsString({ message: '请输入正确的站点类型' })
  type: string;

  @IsOptional()
  @IsString({ message: '请输入正确的时间段' })
  timeSlot?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '请输入正确的停留时长' })
  durationMinutes?: number;

  @IsOptional()
  @IsString({ message: '请输入正确的站点介绍' })
  description?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的站点地点' })
  location?: string;
}

// 保存旅程
export class SaveJourneyDto {
  @IsNotEmpty({ message: '旅程名称不能为空' })
  @IsString({ message: '请输入正确的旅程名称' })
  name: string;

  @IsOptional()
  @IsString({ message: '请输入正确的展示标题' })
  title?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的分类' })
  category?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的介绍' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '请输入正确的行程时长' })
  durationHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '请输入正确的里程' })
  distanceKm?: number;

  @IsOptional()
  @IsString({ message: '请输入正确的难度' })
  difficulty?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的最佳季节' })
  bestSeason?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的封面图' })
  coverImage?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的来源' })
  source?: string;

  @IsOptional()
  @IsArray({ message: '站点列表格式错误' })
  @ValidateNested({ each: true })
  @Type(() => JourneyStopDto)
  stops?: JourneyStopDto[];
}

// 手动调整旅程
export class AdjustJourneyDto {
  @IsOptional()
  @IsArray({ message: '站点列表格式错误' })
  @ValidateNested({ each: true })
  @Type(() => JourneyStopDto)
  stops?: JourneyStopDto[];
}

// AI 生成旅程的 schedule 项（对应 TripTool 输出结构）
export class AgentScheduleItemDto {
  @IsOptional()
  @IsString({ message: '请输入正确的时间' })
  time?: string;

  @IsNotEmpty({ message: '活动名称不能为空' })
  @IsString({ message: '请输入正确的活动名称' })
  activity: string;

  @IsOptional()
  @IsString({ message: '请输入正确的地点' })
  location?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的介绍' })
  description?: string;

  @IsOptional()
  @IsString({ message: '请输入正确的时长' })
  duration?: string;
}

// 从 AI 生成结果保存旅程
export class AgentSaveJourneyDto {
  @IsOptional()
  @IsArray({ message: '行程列表格式错误' })
  @ValidateNested({ each: true })
  @Type(() => AgentScheduleItemDto)
  schedule?: AgentScheduleItemDto[];
}

// 旅程站点（响应契约，驼峰命名）
export interface JourneyStopOut {
  id: number;
  orderIndex: number;
  name: string;
  type: string;
  timeSlot: string;
  durationMinutes: number;
  description: string;
  location: string | null;
}

// 设施地图标记（响应契约，含经纬度）
export interface FacilityMapOut {
  id: number;
  name: string;
  type: string;
  city: string | null;
  longitude: string | null;
  latitude: string | null;
  description: string;
  opening_hours: string;
  contact: string | null;
  cover_image: string | null;
}
