import { BaseUrl } from '../BaseUrl'
import { adminTokenStore } from '@/stores/token'

// 农户端接口

// 带 token 的请求头
const farmerHeader = () => {
  const token = adminTokenStore()
  return {
    authorization: `Bearer ${token.Accesstoken}`
  }
}

// 农户注册（无需登录）
const farmerRegisterConfig = (data) => {
  return {
    url: BaseUrl + '/admin/farmer/register',
    method: 'post',
    data
  }
}

// 获取农户个人资料
const getFarmerProfileConfig = () => {
  return {
    url: BaseUrl + '/farmer/profile',
    method: 'get',
    headers: farmerHeader()
  }
}

// 修改农户个人资料
const updateFarmerProfileConfig = (data) => {
  return {
    url: BaseUrl + '/farmer/profile',
    method: 'put',
    headers: farmerHeader(),
    data
  }
}

// 获取农户名下产品列表
const getFarmerProductsConfig = () => {
  return {
    url: BaseUrl + '/farmer/products',
    method: 'get',
    headers: farmerHeader()
  }
}

// 获取认领订单列表（可按状态筛选）
const getFarmerAdoptionsConfig = (status) => {
  return {
    url: BaseUrl + '/farmer/adoptions',
    method: 'get',
    headers: farmerHeader(),
    params: status ? { status } : {}
  }
}

// 确认种植
const confirmFarmerAdoptionConfig = (id) => {
  return {
    url: BaseUrl + `/farmer/adoptions/${id}/confirm`,
    method: 'post',
    headers: farmerHeader(),
    data: {}
  }
}

// 履约完成
const completeFarmerAdoptionConfig = (id) => {
  return {
    url: BaseUrl + `/farmer/adoptions/${id}/complete`,
    method: 'post',
    headers: farmerHeader(),
    data: {}
  }
}

// 获取收益汇总
const getFarmerRevenueConfig = () => {
  return {
    url: BaseUrl + '/farmer/revenue',
    method: 'get',
    headers: farmerHeader()
  }
}

// 获取数据看板统计
const getFarmerDashboardConfig = () => {
  return {
    url: BaseUrl + '/farmer/dashboard',
    method: 'get',
    headers: farmerHeader()
  }
}

export {
  farmerRegisterConfig,
  getFarmerProfileConfig,
  updateFarmerProfileConfig,
  getFarmerProductsConfig,
  getFarmerAdoptionsConfig,
  confirmFarmerAdoptionConfig,
  completeFarmerAdoptionConfig,
  getFarmerRevenueConfig,
  getFarmerDashboardConfig
}
