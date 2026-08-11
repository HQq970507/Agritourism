import { adminTokenStore } from '@/stores/token'
import { BaseUrl } from '../BaseUrl'
// 产品分类接口

// 获取分类列表
const getCategoryListConfig = (page, pageSize) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductCategoryList`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { page, pageSize }
  }
}

// 添加新的分类
const addCategoryConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'post',
    url: `${BaseUrl}/admin/addProductCategory`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data
  }
}

// 删除分类
const deleteCategoryConfig = (categoryId) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/deleteProductCategory`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { categoryId }
  }
}

// 获取某分类详情
const getCategoryDetailConfig = (categoryId) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductCategoryInfo`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { categoryId }
  }
}

// 修改分类信息
const updateCategoryConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/updateProductCategory`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data
  }
}

export {
  BaseUrl,
  getCategoryListConfig,
  addCategoryConfig,
  deleteCategoryConfig,
  getCategoryDetailConfig,
  updateCategoryConfig
}
