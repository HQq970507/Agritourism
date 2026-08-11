// 管理员获取订单列表
interface AdminGetOrderResDto {
  status: number;
  code: number;
  message: string;
  data: {
    page: number;
    pageSize: number;
    total: number;
    orderList: Array<AdminGetOrderItemDataDto>;
  };
}

interface AdminGetOrderItemDataDto {
  id: number;
  orderNo: string;
  buyerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  orderedAt: Date;
  username: string;
}

// 管理员获取订单详情
interface AdminGetOrderDetailResDto {
  status: number;
  code: number;
  message: string;
  data: AdminGetOrderDetailDataDto;
}

interface AdminGetOrderDetailDataDto {
  id: number;
  orderNo: string;
  buyerName: string;
  contact: string;
  address: string;
  area: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  remark: string;
  username: string;
}

// 管理员操作订单响应
interface AdminOrderActionResDto {
  status: number;
  code: number;
  message: string;
}

export {
  AdminGetOrderResDto,
  AdminGetOrderDetailResDto,
  AdminOrderActionResDto,
};
