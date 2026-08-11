import { IsIn, IsOptional } from 'class-validator';

// 农户列表筛选（?status=active|pending|banned）
class FarmerListQueryDto {
  @IsOptional()
  @IsIn(['active', 'pending', 'banned'])
  status?: string;
}

// 审核/封禁农户
class UpdateFarmerStatusDto {
  @IsIn(['active', 'banned'])
  status: 'active' | 'banned';
}

// 空请求体（下架产品）
class GovernmentEmptyBodyDto {}

export {
  FarmerListQueryDto,
  UpdateFarmerStatusDto,
  GovernmentEmptyBodyDto,
};
