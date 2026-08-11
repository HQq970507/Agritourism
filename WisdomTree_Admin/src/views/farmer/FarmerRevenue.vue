<script setup>
import { ref, shallowRef, markRaw, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { List, Money, UserFilled, TrendCharts } from '@element-plus/icons-vue'
import { requestWithRetry } from '@/common/interfaces/request'
import { getFarmerRevenueConfig } from '@/common/interfaces/farmer.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)

// 汇总数据
const summary = shallowRef([
  { title: '订单数', value: 0, color: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', icon: markRaw(List) },
  { title: '认领总收入', value: 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Money) },
  { title: '农户所得(85%)', value: 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(UserFilled) },
  { title: '平台分成(15%)', value: 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(TrendCharts) }
])

// 收益明细
const detailList = ref([])

const formatMoney = (val) => (val == null ? '0.00' : Number(val).toFixed(2))

const getRevenue = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getFarmerRevenueConfig())
    const data = res.data.data
    const totalRevenue = Number(data.totalRevenue || 0)
    const platformShare =
      data.platformShare != null ? Number(data.platformShare) : Number((totalRevenue * 0.15).toFixed(2))
    const farmerShare = Number((totalRevenue - platformShare).toFixed(2))

    summary.value = [
      { title: '订单数', value: data.totalOrders || 0, color: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', icon: markRaw(List) },
      { title: '认领总收入', value: totalRevenue.toFixed(2), color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Money) },
      { title: '农户所得(85%)', value: farmerShare.toFixed(2), color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(UserFilled) },
      { title: '平台分成(15%)', value: platformShare.toFixed(2), color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(TrendCharts) }
    ]
    detailList.value = Array.isArray(data.list) ? data.list : []
  } catch (error) {
    ElMessage.error('获取收益数据失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getRevenue()
})
</script>

<template>
  <div v-loading="loading" class="farmer-page">
    <BreadCrumb>
      <template #one> 收益中心 </template>
      <template #two> 收益总览 </template>
    </BreadCrumb>

    <!-- 汇总卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="(item, index) in summary" :key="index" :xs="24" :sm="12" :md="6">
        <el-card class="farmer-stat-card" :style="{ background: item.color }">
          <div class="farmer-stat-content">
            <div class="farmer-stat-icon-box">
              <component :is="item.icon" class="farmer-stat-icon" />
            </div>
            <div class="farmer-stat-text">
              <div class="farmer-stat-title">{{ item.title }}</div>
              <div class="farmer-stat-value">¥ {{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收益明细 -->
    <div class="farmer-table-wrap">
      <div class="farmer-toolbar">
        <h3 class="farmer-toolbar-title">收益明细</h3>
        <el-button @click="getRevenue">刷新</el-button>
      </div>

      <el-table :data="detailList" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无收益明细数据" />
        </template>
        <el-table-column label="认领编号" prop="adoptionId" min-width="140">
          <template #default="scope">
            <el-tag size="large">{{ scope.row.adoptionId }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" prop="productName" min-width="140" />
        <el-table-column label="认领价" prop="adoptPrice" min-width="110">
          <template #default="scope">
            ¥ {{ formatMoney(scope.row.adoptPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="农户所得" prop="farmerShare" min-width="110">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: 600">¥ {{ formatMoney(scope.row.farmerShare) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="日期" prop="date" min-width="110" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');

.stats-row {
  margin-bottom: 10px;
}
</style>
