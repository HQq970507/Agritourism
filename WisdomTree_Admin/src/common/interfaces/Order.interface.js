import { BaseUrl } from '../BaseUrl'
import { adminTokenStore } from '@/stores/token'

// 获取订单列表
const getOrderListConfig = (page, pageSize) => {
  const token = adminTokenStore()
  return {
    url: BaseUrl + '/admin/getNewOrderList',
    method: 'get',
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { page, pageSize }
  }
}

// 删除订单
const deleteOrderConfig = (orderId) => {
  const token = adminTokenStore()
  return {
    url: BaseUrl + '/admin/deleteNewOrder',
    method: 'delete',
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { orderId }
  }
}

// 获取订单详情
const getOrderDetailConfig = (orderId) => {
  const token = adminTokenStore()
  return {
    url: BaseUrl + '/admin/getNewOrderDetail',
    method: 'get',
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { orderId }
  }
}

// 修改订单信息
const updateOrderConfig = (data) => {
  const token = adminTokenStore()
  return {
    url: BaseUrl + '/admin/updateNewOrder',
    method: 'put',
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data
  }
}

// 获取订单状态筛选值（后端无 getOrderStatusFilter 接口，改为前端静态列表）
const getOrderStatusFilterConfig = () => [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

export { getOrderListConfig, deleteOrderConfig, getOrderDetailConfig, updateOrderConfig, getOrderStatusFilterConfig }
