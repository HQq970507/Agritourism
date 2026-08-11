import { adminTokenStore } from '@/stores/token'
import { BaseUrl } from '../BaseUrl'

// 文旅线路与设施接口

// 获取线路列表
const getAdminRoutesConfig = (category) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/travel/routes`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: category ? { category } : {}
  }
}

// 新建线路
const createRouteConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'post',
    url: `${BaseUrl}/admin/travel/routes`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 修改线路
const updateRouteConfig = (id, data) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/travel/routes/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 删除线路
const deleteRouteConfig = (id) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/travel/routes/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    }
  }
}

// 获取设施列表
const getAdminFacilitiesConfig = (type) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/travel/facilities`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: type ? { type } : {}
  }
}

// 新建设施
const createFacilityConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'post',
    url: `${BaseUrl}/admin/travel/facilities`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 修改设施
const updateFacilityConfig = (id, data) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/travel/facilities/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 删除设施
const deleteFacilityConfig = (id) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/travel/facilities/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    }
  }
}

// 获取预约列表
const getAdminReservationsConfig = () => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/travel/reservations`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    }
  }
}

// 更新预约状态
const updateReservationStatusConfig = (id, status) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/travel/reservations/${id}/status`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: { status: status }
  }
}

export {
  getAdminRoutesConfig,
  createRouteConfig,
  updateRouteConfig,
  deleteRouteConfig,
  getAdminFacilitiesConfig,
  createFacilityConfig,
  updateFacilityConfig,
  deleteFacilityConfig,
  getAdminReservationsConfig,
  updateReservationStatusConfig
}
