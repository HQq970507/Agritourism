<script setup>
import { ref, shallowRef, markRaw, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  SuccessFilled,
  Menu,
  List,
  Document,
  Money,
  TrendCharts
} from '@element-plus/icons-vue'
import { requestWithRetry } from '@/common/interfaces/request'
import { getFarmerDashboardConfig } from '@/common/interfaces/farmer.interface'
import dayjs from 'dayjs'

// 加载态
const loading = ref(true)

// 统计卡片
const stats = shallowRef([
  { title: '认领总数', value: 0, color: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', icon: markRaw(SuccessFilled) },
  { title: '生长中', value: 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
  { title: '已完成', value: 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(List) },
  { title: '日记总数', value: 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(Document) },
  { title: '收益总额', value: 0, color: 'linear-gradient(135deg,#FF9A8B 0%,#FF6B88 100%)', icon: markRaw(Money) }
])

// 认领趋势
const trendData = ref([])

// 图表引用
const chartRef = ref(null)
let chartInstance = null

// 折线图配置
const chartOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#eee',
    textStyle: { color: '#666' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
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
      name: '认领数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: [],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#6BFFCA80' },
            { offset: 1, color: '#6BFFCA00' }
          ]
        }
      },
      lineStyle: {
        width: 3,
        shadowColor: '#4CAF5040',
        shadowBlur: 10,
        shadowOffsetY: 8
      },
      itemStyle: {
        color: '#2E7D32',
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  ]
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(chartOption)
}

const handleResize = () => {
  chartInstance?.resize()
}

// 获取看板数据
const fetchDashboard = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getFarmerDashboardConfig())
    const data = res.data.data
    stats.value = [
      { title: '认领总数', value: data.totalAdoptions || 0, color: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', icon: markRaw(SuccessFilled) },
      { title: '生长中', value: data.growingCount || 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
      { title: '已完成', value: data.completedCount || 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(List) },
      { title: '日记总数', value: data.totalDiaries || 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(Document) },
      { title: '收益总额', value: data.revenueTotal || 0, color: 'linear-gradient(135deg,#FF9A8B 0%,#FF6B88 100%)', icon: markRaw(Money) }
    ]
    trendData.value = Array.isArray(data.recentTrend) ? data.recentTrend : []

    // 更新趋势图
    chartOption.xAxis.data = trendData.value.map((item) => dayjs(item.date).format('MM-DD'))
    chartOption.series[0].data = trendData.value.map((item) => item.count)
    nextTick(() => {
      chartInstance?.setOption(chartOption)
    })
  } catch (error) {
    ElMessage.error('看板数据加载失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDashboard()
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div v-loading="loading" class="farmer-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="(item, index) in stats" :key="index" :xs="24" :sm="12" :md="8">
        <el-card class="farmer-stat-card" :style="{ background: item.color }">
          <div class="farmer-stat-content">
            <div class="farmer-stat-icon-box">
              <component :is="item.icon" class="farmer-stat-icon" />
            </div>
            <div class="farmer-stat-text">
              <div class="farmer-stat-title">{{ item.title }}</div>
              <div class="farmer-stat-value">{{ Number(item.value || 0).toLocaleString() }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 认领趋势 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="farmer-card">
          <div class="farmer-toolbar">
            <div style="display: flex; align-items: center">
              <el-icon :size="30" style="margin-right: 12px; color: var(--el-color-primary)"
                ><TrendCharts
              /></el-icon>
              <h3 class="farmer-toolbar-title">最近7天认领趋势</h3>
            </div>
          </div>
          <div v-if="!trendData.length" class="farmer-empty">
            <el-empty description="暂无认领趋势数据" />
          </div>
          <div v-else ref="chartRef" class="farmer-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');

.stats-row {
  margin-bottom: 10px;
}
</style>
