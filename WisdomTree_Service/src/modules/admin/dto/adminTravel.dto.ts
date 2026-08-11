import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// 线路站点DTO（嵌套在线路DTO的 stops 数组中）
class RouteStopDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order_index: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  time_slot: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_minutes: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location: string;
}

// 管理员新增线路
class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_hours: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance_km: number;

  @IsOptional()
  @IsString()
  difficulty: string;

  @IsOptional()
  @IsString()
  best_season: string;

  @IsOptional()
  @IsBoolean()
  is_featured: boolean;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  cover_image: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops: RouteStopDto[];
}

// 管理员修改线路（id 从路径参数获取）
class UpdateRouteDto extends CreateRouteDto {}

// 管理员新增设施
class CreateFacilityDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  opening_hours: string;

  @IsOptional()
  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  cover_image: string;

  @IsOptional()
  @IsString()
  status: string;
}

// 管理员修改设施（id 从路径参数获取）
class UpdateFacilityDto extends CreateFacilityDto {}

// 管理员修改预约状态
class UpdateReservationStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['confirmed', 'completed', 'cancelled'])
  status: string;
}

export {
  RouteStopDto,
  CreateRouteDto,
  UpdateRouteDto,
  CreateFacilityDto,
  UpdateFacilityDto,
  UpdateReservationStatusDto,
};
