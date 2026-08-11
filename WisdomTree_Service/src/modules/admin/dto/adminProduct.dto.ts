import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsNotEmpty, IsOptional } from 'class-validator';

// 管理员创建产品
class AdminCreateProductDto {
  @IsString()
  categoryName: string;

  @IsArray()
  @IsString({ each: true })
  mediaUrls: Array<string>;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  unit: string;
}

// 管理员获取产品列表（分页）
class AdminGetProductListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  pageSize: number;
}

// 管理员获取某产品详情
class AdminGetProductDetailDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;
}

// 管理员修改产品
class AdminUpdateProductDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsString()
  categoryName: string;

  @IsArray()
  @IsString({ each: true })
  mediaUrls: Array<string>;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  unit: string;
}

// 管理员删除产品
class AdminDeleteProductDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;
}

export {
  AdminCreateProductDto,
  AdminGetProductListDto,
  AdminGetProductDetailDto,
  AdminUpdateProductDto,
  AdminDeleteProductDto,
};
