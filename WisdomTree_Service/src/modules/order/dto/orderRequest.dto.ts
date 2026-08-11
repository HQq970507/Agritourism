// 获取订单列表
interface GetOrderListRequestDto {
  status: number;
  code: number;
  message: string;
  data: GetOrderListDataDto;
}

interface GetOrderListDataDto {
  page: number;
  pageSize: number;
  total: number;
  orders: Array<GetOrderItemDto>;
}

interface GetOrderItemDto {
  id: number;
  order_no: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  ordered_at: Date;
  username: string;
}

// 获取订单详情
interface GetOrderDetailRequestDto {
  status: number;
  code: number;
  message: string;
  data: GetOrderDetailDataDto;
}

interface GetOrderDetailDataDto {
  id: number;
  order_no: string;
  buyer_name: string;
  contact: string;
  address: string;
  area: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  remark: string;
  ordered_at: Date;
  username: string;
}

// 更新订单状态
interface UpdateOrderStatusRequestDto {
  status: number;
  code: number;
  message: string;
}

export {
  GetOrderListRequestDto,
  GetOrderDetailRequestDto,
  UpdateOrderStatusRequestDto,
};
