<script setup>
import { ref, shallowRef, markRaw, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { UserFilled, Menu, SuccessFilled, User, Money, Histogram } from '@element-plus/icons-vue'
import { requestWithRetry } from '@/common/interfaces/request'
import { getGovOverviewConfig, getGovRegionConfig } from '@/common/interfaces/gov.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)

// 总览卡片
const summary = shallowRef([
  { title: '农户总数', value: 0, color: 'linear-gradient(135deg,#2563EB 0%,#1E3A5F 100%)', icon: markRaw(UserFilled) },
  { title: '产品分类数', value: 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
  { title: '认领总数', value: 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(SuccessFilled) },
  { title: '注册游客数', value: 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(User) },
  { title: '总收益', value: 0, color: 'linear-gradient(135deg,#10B981 0%,#047857 100%)', icon: markRaw(Money) }
])

// 区域数据
const regionData = ref([])

// 图表引用
const chartRef = ref(null)
let chartInstance = null

// 柱状图配置
const chartOption = {
  tooltip: { trigger: 'axis' },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: { lineStyle: { color: '#999' } }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLine: { lineStyle: { color: '#999' } }
  },
  series: [
    {
      name: '各市认领数',
      type: 'bar',
      barWidth: '60%',
      data: [],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#2563EB' },
            { offset: 1, color: '#05B0FF' }
          ]
        },
        borderRadius: [8, 8, 0, 0],
        shadowColor: '#2563EB40',
        shadowBlur: 8,
        shadowOffsetY: 4
      }
    }
  ]
}

const formatMoney = (val) => (val == null ? '0.00' : Number(val).toFixed(2))

// 获取区域报告数据
const fetchReport = async () => {
  loading.value = true
  try {
    const [overviewRes, regionRes] = await Promise.all([
      requestWithRetry(getGovOverviewConfig()),
      requestWithRetry(getGovRegionConfig())
    ])
    const data = overviewRes.data.data

    summary.value = [
      { title: '农户总数', value: data.totalFarmers || 0, color: 'linear-gradient(135deg,#2563EB 0%,#1E3A5F 100%)', icon: markRaw(UserFilled) },
      { title: '产品分类数', value: data.totalCategories || 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
      { title: '认领总数', value: data.totalAdoptions || 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(SuccessFilled) },
      { title: '注册游客数', value: data.totalUsers || 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(User) },
      { title: '总收益', value: Number(data.totalRevenue || 0).toFixed(2), color: 'linear-gradient(135deg,#10B981 0%,#047857 100%)', icon: markRaw(Money) }
    ]

    regionData.value = Array.isArray(regionRes.data.data) ? regionRes.data.data : []
    chartOption.xAxis.data = regionData.value.map((item) => item.city)
    chartOption.series[0].data = regionData.value.map((item) => item.totalAdoptions)
    nextTick(() => {
      chartInstance?.setOption(chartOption)
    })
  } catch (error) {
    ElMessage.error('区域报告加载失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchReport()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(chartOption)
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  chartInstance?.resize()
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div v-loading="loading" class="gov-page">
    <BreadCrumb>
      <template #one> 区域报告 </template>
      <template #two> 各市认领统计 </template>
    </BreadCrumb>

    <!-- 总览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="(item, index) in summary" :key="index" :xs="24" :sm="12" :md="8">
        <el-card class="gov-stat-card" :style="{ background: item.color }">
          <div class="gov-stat-content">
            <div class="gov-stat-icon-box">
              <component :is="item.icon" class="gov-stat-icon" />
            </div>
            <div class="gov-stat-text">
              <div class="gov-stat-title">{{ item.title }}</div>
              <div class="gov-stat-value">
                <template v-if="item.title === '总收益'">¥ {{ item.value }}</template>
                <template v-else>{{ Number(item.value || 0).toLocaleString() }}</template>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 各市认领分布 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="gov-card">
          <div class="gov-toolbar">
            <div style="display: flex; align-items: center">
              <el-icon :size="30" style="margin-right: 12px; color: var(--el-color-primary)"
                ><Histogram
              /></el-icon>
              <h3 class="gov-toolbar-title">各市认领数量分布</h3>
            </div>
          </div>
          <div v-if="!regionData.length" class="gov-empty">
            <el-empty description="暂无区域认领数据" />
          </div>
          <div v-else ref="chartRef" class="gov-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 区域统计表格 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="gov-table-wrap">
          <div class="gov-toolbar">
            <h3 class="gov-toolbar-title">各市认领统计明细</h3>
            <el-button @click="fetchReport">刷新</el-button>
          </div>

          <el-table :data="regionData" stripe size="large" style="width: 100%">
            <template #empty>
              <el-empty description="暂无区域统计数据" />
            </template>
            <el-table-column label="城市" prop="city" min-width="120" />
            <el-table-column label="认领单数" prop="totalAdoptions" min-width="110" />
            <el-table-column label="活跃" prop="activeCount" min-width="90" />
            <el-table-column label="已完成" prop="completedCount" min-width="100" />
            <el-table-column label="收益" min-width="130">
              <template #default="scope">
                ¥ {{ formatMoney(scope.row.totalRevenue) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');

.stats-row {
  margin-bottom: 10px;
}
</style>
