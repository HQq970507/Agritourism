<script setup>
import { ref } from 'vue'
import BreadCrumb from '@/components/BreadCrumb.vue'
import { useRoute } from 'vue-router'
import { ElLoading, ElMessage } from 'element-plus'
import CategoryForm from '@/components/category/CategoryForm.vue'
import { requestWithRetry } from '@/common/interfaces/request'
import { getCategoryDetailConfig } from '@/common/interfaces/Category.interface'

const categoryInfo = ref({})

// 获取分类详情
const getCategoryInfo = async (categoryId) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getCategoryDetailConfig(categoryId))
    categoryInfo.value = res.data.data
    categoryInfo.value.categoryId = res.data.data.id
    delete categoryInfo.value.id
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取分类信息失败')
  }
}

// 获取当前路由
const route = useRoute()

// 从路由中获取查询参数
const categoryId = route.query.categoryId

getCategoryInfo(categoryId)
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 分类中心 </template>
    <template #two> <RouterLink to="/adminCategory/categoryCenter">分类管理</RouterLink> </template>
    <template #three> 编辑分类 </template>
  </BreadCrumb>
  <!-- 表单组件 -->
  <CategoryForm :category-info="categoryInfo" :category-id="categoryId" :is-edit="true" />
</template>

<style scoped></style>
