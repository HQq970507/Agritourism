import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// 分页获取产品分类列表
class PaginateQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  pageSize: number;

  // 可选关键字筛选（display_name 模糊匹配）
  @IsOptional()
  @IsString()
  keyword?: string;
}

// 获取某订单详情
class GetProductDetailDto {
  @IsNotEmpty({ message: '订单ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '请输入正确的订单ID' })
  orderId: number;
}

class GetCategoryDetailDto {
  @IsNotEmpty({ message: '分类ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '请输入正确的分类ID' })
  categoryId: number;
}

// 创建订单
class CreateOrderDto {
  @IsNotEmpty({ message: '分类ID不能为空' })
  @IsInt({ message: '请输入正确的分类ID' })
  categoryId: number;

  @IsNotEmpty({ message: '购买者姓名不能为空' })
  @IsString({ message: '请输入正确的姓名' })
  buyerName: string;

  @IsNotEmpty({ message: '联系方式不能为空' })
  @IsString({ message: '请输入正确的联系方式' })
  contact: string;

  @IsString({ message: '请输入正确的地址' })
  address: string;

  @IsNotEmpty({ message: '区域不能为空' })
  @IsString({ message: '请输入正确的区域' })
  area: string;

  @IsNotEmpty({ message: '产品名称不能为空' })
  @IsString({ message: '请输入正确的产品名称' })
  productName: string;

  @IsNotEmpty({ message: '数量不能为空' })
  @IsInt({ message: '请输入正确的数量' })
  @Min(1, { message: '数量至少为1' })
  quantity: number;

  @IsString({ message: '请输入正确的备注' })
  remark: string;
}

export {
  GetProductDetailDto,
  CreateOrderDto,
  GetCategoryDetailDto,
  PaginateQueryDto,
};
