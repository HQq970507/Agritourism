<script setup>
import BreadCrumb from '@/components/BreadCrumb.vue'
import ProductTable from '@/components/product/ProductTable.vue'
import { ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import PaginationEl from '@/components/PaginationEl.vue'
import { getProductListConfig } from '@/common/interfaces/Product.interface'
import { getProductFilterConfig } from '@/common/interfaces/Product.interface'

const ProductListData = ref([])

// 数据量总数（给分页子组件）
const total = ref(0)

// 筛选的分类值（给表格子组件）
const categoryFilter = ref([])

// 获取产品列表
const getProductList = async (e) => {
  const { page, pagesize } = e || { page: 1, pagesize: 10 }
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    // 请求接口
    const res = await requestWithRetry(getProductListConfig(page, pagesize))
    ProductListData.value = res.data.data.productList
    total.value = res.data.data.total
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取产品列表失败')
  }
}

// 获取筛选条件分类列表
const getProductFilter = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getProductFilterConfig())
    const data = res.data.data
    categoryFilter.value = (data && Array.isArray(data.categoryList) ? data.categoryList : []).map(
      (item) => item.name
    )
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
  }
}

getProductFilter()

getProductList()
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 产品中心 </template>
    <template #two> 产品管理 </template>
  </BreadCrumb>
  <!-- 表格组件 -->
  <ProductTable
    :productlist="ProductListData"
    :category-filter-father="categoryFilter"
    @handle-delete="getProductList"
  />
  <!-- 分页组件 -->
  <PaginationEl @pagechange="(e) => getProductList(e)" :total-father="total" />
</template>

<style scoped></style>
