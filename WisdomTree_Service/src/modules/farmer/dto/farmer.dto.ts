import { IsIn, IsOptional, IsString } from 'class-validator';

// 农户更新资料
class UpdateFarmerProfileDto {
  @IsOptional()
  @IsString()
  farmName?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

// 空请求体（确认/完成认领单）
class FarmerEmptyBodyDto {}

// 认领单状态筛选（含 confirmed：农户确认种植后状态）
class FarmerStatusQueryDto {
  @IsOptional()
  @IsIn(['growing', 'harvesting', 'completed', 'confirmed'])
  status?: string;
}

export { UpdateFarmerProfileDto, FarmerEmptyBodyDto, FarmerStatusQueryDto };
