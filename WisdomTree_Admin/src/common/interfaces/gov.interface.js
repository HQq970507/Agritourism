import { BaseUrl } from '../BaseUrl'
import { adminTokenStore } from '@/stores/token'

// 政府端接口

// 带 token 的请求头
const govHeader = () => {
  const token = adminTokenStore()
  return {
    authorization: `Bearer ${token.Accesstoken}`
  }
}

// 数据驾驶舱总览（统计卡 + 7 天认领趋势）
const getGovOverviewConfig = () => {
  return {
    url: BaseUrl + '/government/report/overview',
    method: 'get',
    headers: govHeader()
  }
}

// 区域报告（各市认领统计）
const getGovRegionConfig = () => {
  return {
    url: BaseUrl + '/government/report/region',
    method: 'get',
    headers: govHeader()
  }
}

// 商户监管-农户列表（可按状态筛选）
const getGovFarmersConfig = (status) => {
  return {
    url: BaseUrl + '/government/farmers',
    method: 'get',
    headers: govHeader(),
    params: status ? { status } : {}
  }
}

// 农户审核/封禁
const updateGovFarmerStatusConfig = (id, status) => {
  return {
    url: BaseUrl + `/government/farmers/${id}/status`,
    method: 'put',
    headers: govHeader(),
    data: { status }
  }
}

// 商户监管-产品列表（可按农户筛选）
const getGovProductsConfig = (farmerId) => {
  return {
    url: BaseUrl + '/government/products',
    method: 'get',
    headers: govHeader(),
    params: farmerId ? { farmerId } : {}
  }
}

// 产品下架
const offShelfGovProductConfig = (id) => {
  return {
    url: BaseUrl + `/government/products/${id}/off-shelf`,
    method: 'post',
    headers: govHeader(),
    data: {}
  }
}

// 活动统筹-活动列表（复用现有管理端接口）
const getGovActivityListConfig = (page, pagesize) => {
  return {
    url: BaseUrl + '/activity/adminlist',
    method: 'get',
    headers: govHeader(),
    params: { page, pageSize: pagesize }
  }
}

export {
  getGovOverviewConfig,
  getGovRegionConfig,
  getGovFarmersConfig,
  updateGovFarmerStatusConfig,
  getGovProductsConfig,
  offShelfGovProductConfig,
  getGovActivityListConfig
}
