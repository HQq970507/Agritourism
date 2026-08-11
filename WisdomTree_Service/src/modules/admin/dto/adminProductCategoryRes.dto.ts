// 管理员获取产品分类列表
interface AdminProductCategoryListResDto {
  status: number;
  code: number;
  message: string;
  data: {
    page: number;
    pageSize: number;
    total: number;
    categoryList: Array<AdminProductCategoryListItemDto>;
  };
}

interface AdminProductCategoryListItemDto {
  id: number;
  avatar: string;
  name: string;
  display_name: string;
  description: string;
  total: number;
  remaining: number;
  points_required: number;
  price: number;
  unit: string;
}

// 管理员操作产品分类响应
interface AdminProductCategoryActionResDto {
  status: number;
  code: number;
  message: string;
}

// 管理员获取产品分类信息
interface AdminProductCategoryInfoResDto extends AdminProductCategoryActionResDto {
  data: AdminProductCategoryListItemDto;
}

export {
  AdminProductCategoryListResDto,
  AdminProductCategoryActionResDto,
  AdminProductCategoryInfoResDto,
};
