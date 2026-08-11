import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 管理员添加产品分类
class AdminAddProductCategoryDto {
  @IsString()
  avatar: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  display_name: string;

  @IsString()
  description: string;

  @IsNumber()
  total: number;

  @IsNumber()
  points_required: number;

  @IsNumber()
  price: number;

  @IsString()
  unit: string;
}

// 管理员获取产品分类信息
class AdminGetProductCategoryInfoDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoryId: number;
}

// 管理员修改产品分类信息
class AdminUpdateProductCategoryDto extends AdminAddProductCategoryDto {
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsNumber()
  remaining: number;
}

// 管理员删除产品分类
class AdminDeleteProductCategoryDto extends AdminGetProductCategoryInfoDto {}

// 管理员获取产品分类列表
class AdminGetProductCategoryListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  pageSize: number;
}

export {
  AdminAddProductCategoryDto,
  AdminUpdateProductCategoryDto,
  AdminDeleteProductCategoryDto,
  AdminGetProductCategoryListDto,
  AdminGetProductCategoryInfoDto,
};
