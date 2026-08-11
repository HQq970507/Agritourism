<script setup>
import BreadCrumb from '@/components/BreadCrumb.vue'
import CategoryTable from '@/components/category/CategoryTable.vue'
import { ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getCategoryListConfig } from '@/common/interfaces/Category.interface'
import PaginationEl from '@/components/PaginationEl.vue'

const CategoryListData = ref([])

const total = ref(0)

// 获取分类列表
const getCategoryList = async (e) => {
  const { page, pagesize } = e || { page: 1, pagesize: 10 }

  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    // 请求接口
    const res = await requestWithRetry(getCategoryListConfig(page, pagesize))
    total.value = res.data.data.total
    CategoryListData.value = res.data.data.categoryList
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取分类列表失败')
  }
}

getCategoryList()
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 分类中心 </template>
    <template #two> 分类管理 </template>
  </BreadCrumb>
  <!-- 表格组件 -->
  <CategoryTable :categorylist="CategoryListData" @handle-delete="getCategoryList" />
  <!-- 分页组件 -->
  <PaginationEl @pagechange="(e) => getCategoryList(e)" :total-father="total" />
</template>

<style scoped></style>
