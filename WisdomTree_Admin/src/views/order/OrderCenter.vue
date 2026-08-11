<script setup>
import BreadCrumb from '@/components/BreadCrumb.vue'
import { ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import PaginationEl from '@/components/PaginationEl.vue'
import OrderTable from '@/components/order/OrderTable.vue'
import { getOrderListConfig, getOrderStatusFilterConfig } from '@/common/interfaces/Order.interface'

// 请求数据
const listData = ref([])

//总数据量 传给分页组件计算
const total = ref(0)

// 状态筛选值
const statusFilter = ref([])

// 获取订单列表
const getOrderList = async (e) => {
  const { page, pagesize } = e || { page: 1, pagesize: 10 }

  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    // 请求接口
    const res = await requestWithRetry(getOrderListConfig(page, pagesize))
    total.value = res.data.data.total
    listData.value = res.data.data.orderList
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取订单列表失败')
  }
}

// 获取状态筛选值（后端无该接口，使用前端静态列表）
const getStatusFilter = () => {
  statusFilter.value = getOrderStatusFilterConfig()
}

getStatusFilter()

getOrderList()
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 订单中心 </template>
    <template #two> 订单管理 </template>
  </BreadCrumb>
  <!-- 表格组件 -->
  <OrderTable
    :orderlist="listData"
    :status-filter-father="statusFilter"
    @handle-delete="getOrderList"
  />
  <!-- 分页组件 -->
  <PaginationEl @pagechange="(e) => getOrderList(e)" :total-father="total" />
</template>

<style scoped></style>
