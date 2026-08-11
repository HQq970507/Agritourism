import { adminTokenStore } from '@/stores/token'
import { BaseUrl } from '../BaseUrl'

// 产品接口

// 获取产品列表
const getProductListConfig = (page, pageSize) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductList`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { page, pageSize }
  }
}

// 获取产品筛选值（后端无 getProductFilter 接口，改为获取全部分类列表作为筛选选项）
const getProductFilterConfig = () => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductCategoryList`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { page: 1, pageSize: 100 }
  }
}

// 删除产品
const deleteProductConfig = (productId) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/deleteProduct`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { productId }
  }
}

// 新建产品
const addProductConfig = (data) => {
  const token = adminTokenStore()
  return {
    method: 'post',
    url: `${BaseUrl}/admin/addProduct`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: data
  }
}

// 搜索获取匹配分类值（后端无 searchCategory 接口，改为获取全部分类后在前端按名称筛选）
const searchProductCategoryConfig = (categoryInput) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductCategoryList`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { page: 1, pageSize: 100 }
  }
}

// 获取产品详情信息
const getProductDetailConfig = (productId) => {
  const token = adminTokenStore()
  return {
    method: 'get',
    url: `${BaseUrl}/admin/getProductDetail`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { productId }
  }
}

// 修改产品详情
const updateProductConfig = (productId, productInfo) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/updateProduct`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: {
      productId,
      categoryName: productInfo.categoryName,
      mediaUrls: productInfo.mediaUrls,
      price: productInfo.price,
      unit: productInfo.unit
    }
  }
}

// 批量更新产品（价格/单位/上下架）
const batchUpdateProductsConfig = (productIds, updateInfo) => {
  const token = adminTokenStore()
  return {
    method: 'put',
    url: `${BaseUrl}/admin/batchUpdateProducts`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    data: { productIds, ...updateInfo }
  }
}

// 批量删除产品
const batchDeleteProductsConfig = (productIds) => {
  const token = adminTokenStore()
  return {
    method: 'delete',
    url: `${BaseUrl}/admin/batchDeleteProducts`,
    headers: {
      authorization: `Bearer ${token.Accesstoken}`
    },
    params: { productIds: productIds.join(',') }
  }
}

export {
  getProductListConfig,
  getProductFilterConfig,
  deleteProductConfig,
  addProductConfig,
  searchProductCategoryConfig,
  getProductDetailConfig,
  updateProductConfig,
  batchUpdateProductsConfig,
  batchDeleteProductsConfig
}
