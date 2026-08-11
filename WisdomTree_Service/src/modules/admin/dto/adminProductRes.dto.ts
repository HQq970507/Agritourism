// 管理员获取产品列表
interface AdminGetProductResDto {
  status: number;
  code: number;
  message: string;
  data: {
    page: number;
    pageSize: number;
    total: number;
    productList: Array<GetProductItemDataDto>;
  };
}

interface GetProductItemDataDto {
  id: number;
  categoryName: string;
  is_sold: boolean;
  price: number;
  unit: string;
  mediaUrls: Array<string>;
}

// 管理员创建/更新/删除产品响应
interface AdminProductActionResDto {
  status: number;
  code: number;
  message: string;
}

export { AdminGetProductResDto, AdminProductActionResDto, GetProductItemDataDto };
