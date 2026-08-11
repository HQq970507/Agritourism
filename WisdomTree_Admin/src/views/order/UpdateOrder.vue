<script setup>
import { ref } from 'vue'
import BreadCrumb from '@/components/BreadCrumb.vue'
import { useRoute } from 'vue-router'
import { ElLoading, ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getOrderDetailConfig } from '@/common/interfaces/Order.interface'
import OrderForm from '@/components/order/OrderForm.vue'

const orderInfo = ref({})

// 获取订单详情
const getOrderDetail = async (orderId) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getOrderDetailConfig(orderId))
    orderInfo.value = res.data.data
    orderInfo.value.orderId = res.data.data.id
    delete orderInfo.value.id
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取订单信息失败')
  }
}

// 获取当前路由
const route = useRoute()

// 从路由中获取查询参数
const orderId = route.query.orderId

getOrderDetail(orderId)
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 订单中心 </template>
    <template #two> <RouterLink to="/adminOrder/orderCenter">订单管理</RouterLink> </template>
    <template #three> 编辑订单 </template>
  </BreadCrumb>
  <!-- 表单组件 -->
  <OrderForm :order-info="orderInfo" />
</template>

<style scoped></style>
