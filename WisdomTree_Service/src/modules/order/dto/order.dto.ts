import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 获取订单列表（分页）
class GetOrderListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  pageSize: number;
}

// 获取订单详情
class GetOrderDetailDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  orderId: number;
}

// 更新订单状态
class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsString()
  status: string;
}

export { GetOrderListDto, GetOrderDetailDto, UpdateOrderStatusDto };
