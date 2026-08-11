import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * 认领下单
 * body: { categoryId 或 productId, wish?, area?, nickname? }
 * categoryId：按分类认领（前端产品列表传分类 id，后端自动选该分类下可认领产品实例）
 * productId：直接指定产品实例
 */
export class CreateAdoptionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '请输入正确的分类ID' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '请输入正确的产品ID' })
  @Min(1, { message: '产品ID必须大于0' })
  productId?: number;

  @IsOptional()
  @IsString({ message: '心愿格式错误' })
  wish?: string;

  @IsOptional()
  @IsString({ message: '区域格式错误' })
  area?: string;

  @IsOptional()
  @IsString({ message: '昵称格式错误' })
  nickname?: string;
}

/**
 * 认养生长日记
 * body: { stage, description, temperature?, humidity?, mediaUrl? }
 */
export class CreateDiaryDto {
  @IsNotEmpty({ message: '生长阶段不能为空' })
  @IsIn(['seedling', 'growing', 'flowering', 'fruiting', 'harvest'], {
    message: '生长阶段不合法（seedling/growing/flowering/fruiting/harvest）',
  })
  stage: string;

  @IsNotEmpty({ message: '日记内容不能为空' })
  @IsString({ message: '日记内容格式错误' })
  description: string;

  @IsOptional()
  @IsString({ message: '温度格式错误' })
  temperature?: string;

  @IsOptional()
  @IsString({ message: '湿度格式错误' })
  humidity?: string;

  @IsOptional()
  @IsString({ message: '媒体地址格式错误' })
  mediaUrl?: string;
}

/**
 * 预约采摘
 * body: { pickupDate, pickupTime?, partySize?, contactName?, contactPhone? }
 */
export class PickupHarvestDto {
  @IsNotEmpty({ message: '采摘日期不能为空' })
  @IsString({ message: '采摘日期格式错误' })
  pickupDate: string;

  @IsOptional()
  @IsString({ message: '采摘时间段格式错误' })
  pickupTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '人数格式错误' })
  @Min(1, { message: '人数至少为1' })
  partySize?: number;

  @IsOptional()
  @IsString({ message: '联系人姓名格式错误' })
  contactName?: string;

  @IsOptional()
  @IsString({ message: '联系电话格式错误' })
  contactPhone?: string;
}

/**
 * 邮寄到家
 * body: { address, receiverName, receiverPhone?, shipMethod?, remark? }
 */
export class ShipHarvestDto {
  @IsNotEmpty({ message: '收货地址不能为空' })
  @IsString({ message: '收货地址格式错误' })
  address: string;

  @IsNotEmpty({ message: '收货人姓名不能为空' })
  @IsString({ message: '收货人姓名格式错误' })
  receiverName: string;

  @IsOptional()
  @IsString({ message: '收货人电话格式错误' })
  receiverPhone?: string;

  @IsOptional()
  @IsIn(['顺丰', '京东', '普通快递'], {
    message: '快递方式不合法（顺丰/京东/普通快递）',
  })
  shipMethod?: string;

  @IsOptional()
  @IsString({ message: '备注格式错误' })
  remark?: string;
}
