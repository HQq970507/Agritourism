import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 管理员获取订单列表
class AdminGetOrderListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  pageSize: number;
}

// 管理员获取订单详情
class AdminGetOrderDetailDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  orderId: number;
}

// 管理员更新订单
class AdminUpdateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsString()
  buyerName: string;

  @IsString()
  contact: string;

  @IsString()
  address: string;

  @IsString()
  area: string;

  @IsString()
  productName: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsString()
  remark: string;
}

// 管理员删除订单
class AdminDeleteOrderDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  orderId: number;
}

export {
  AdminGetOrderListDto,
  AdminGetOrderDetailDto,
  AdminUpdateOrderDto,
  AdminDeleteOrderDto,
};
