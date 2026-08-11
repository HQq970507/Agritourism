<script setup>
import { ref } from 'vue'
import BreadCrumb from '@/components/BreadCrumb.vue'
import { useRoute } from 'vue-router'
import { ElLoading, ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getProductDetailConfig } from '@/common/interfaces/Product.interface'
import ProductUpdateForm from '@/components/product/ProductUpdateForm.vue'

const productInfo = ref({})

// 获取产品详情
const getProductInfo = async (productID) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getProductDetailConfig(productID))
    productInfo.value = res.data.data
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取产品信息失败')
  }
}

// 获取当前路由
const route = useRoute()

// 从路由中获取查询参数
const productId = +route.query.productId

getProductInfo(productId)
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 产品中心 </template>
    <template #two> <RouterLink to="/adminProduct/productCenter">产品管理</RouterLink> </template>
    <template #three> 编辑产品 </template>
  </BreadCrumb>
  <!-- 表单组件 -->
  <ProductUpdateForm :product-info="productInfo" :product-i-d="productId" />
</template>

<style scoped></style>
