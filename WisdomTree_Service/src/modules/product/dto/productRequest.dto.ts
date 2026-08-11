// 获取产品分类列表
interface GetProductListRequestDto {
  status: number;
  code: number;
  message: string;
  data: GetProductListRequestDataDto;
}

interface GetProductListRequestDataDto {
  userPoints: number;
  total: number;
  page: number;
  pageSize: number;
  categories: Array<GetProductCategoryDataDto>;
}

interface GetProductCategoryDataDto {
  id: number;
  avatar: string;
  name: string;
  display_name?: string;
  total: number;
  remaining: number;
  points_required: number;
  price: number;
  unit: string;
}

// 获取某产品分类详情信息
interface GetProductDetailRequestDto {
  status: number;
  code: number;
  message: string;
  data: GetProductDetailDataRequestDto;
}

interface GetProductDetailDataRequestDto {
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
  userPoints: number;
}

// 创建订单
interface CreateOrderRequestDto {
  status: number;
  code: number;
  message: string;
  data: CreateOrderDataRequestDto;
}

interface CreateOrderDataRequestDto {
  orderNo: string;
  buyerName: string;
  productName: string;
}

// 获取用户订单信息
interface GetUserOrdersRequestDto {
  status: number;
  code: number;
  message: string;
  data: Array<GetUserOrderDataRequestDto>;
}

interface GetUserOrderDataRequestDto {
  id: number;
  product_name: string;
  avatar: string;
  name: string;
}

// 获取用户订单详情
interface GetUserOrderDetailRequestDto {
  status: number;
  code: number;
  message: string;
  data: GetUserOrderDetailDataRequestDto;
}

interface GetUserOrderDetailDataRequestDto {
  id: number;
  order_no: string;
  buyer_name: string;
  product_name: string;
  ordered_at: string;
  avatar: string;
  name: string;
  display_name: string;
  description: string;
  total: number;
  remark: string;
  remaining: number;
  area: string;
  contact: string;
  address: string;
  quantity: number;
  total_amount: number;
  status: string;
  mediaUrl: Array<string>;
}

export {
  GetProductListRequestDto,
  GetProductDetailRequestDto,
  CreateOrderRequestDto,
  GetUserOrdersRequestDto,
  GetUserOrderDetailRequestDto,
};
