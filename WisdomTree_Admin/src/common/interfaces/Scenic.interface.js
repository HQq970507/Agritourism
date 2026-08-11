import { adminTokenStore } from '@/stores/token'
import { BaseUrl } from '../BaseUrl'

// 景区中心接口

// 获取景区列表
const getAdminScenicListConfig = (page, pageSize) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/scenic/list`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: {
      page: page || 1,
      pageSize: pageSize || 10
    }
  }
}

// 新建景区
const createScenicConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'post',
    url: `${BaseUrl}/admin/scenic/create`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 修改景区
const updateScenicConfig = (id, data) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/scenic/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 删除景区
const deleteScenicConfig = (id) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/scenic/${id}`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    }
  }
}

export {
  getAdminScenicListConfig,
  createScenicConfig,
  updateScenicConfig,
  deleteScenicConfig
}
