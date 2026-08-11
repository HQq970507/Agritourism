<script setup>
import { ref, shallowRef, markRaw, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { UserFilled, Menu, SuccessFilled, User, Money, TrendCharts, Histogram } from '@element-plus/icons-vue'
import { requestWithRetry } from '@/common/interfaces/request'
import { getGovOverviewConfig, getGovRegionConfig } from '@/common/interfaces/gov.interface'
import dayjs from 'dayjs'

// 加载态
const loading = ref(true)

// 统计卡片
const stats = shallowRef([
  { title: '农户总数', value: 0, color: 'linear-gradient(135deg,#2563EB 0%,#1E3A5F 100%)', icon: markRaw(UserFilled) },
  { title: '产品分类数', value: 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
  { title: '认领总数', value: 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(SuccessFilled) },
  { title: '注册游客数', value: 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(User) },
  { title: '总收益', value: 0, color: 'linear-gradient(135deg,#10B981 0%,#047857 100%)', icon: markRaw(Money) }
])

// 认领趋势
const trendData = ref([])
// 区域分布
const regionData = ref([])

// 图表引用
const chartTrendRef = ref(null)
const chartRegionRef = ref(null)
let chartTrendInstance = null
let chartRegionInstance = null

// 折线图配置
const trendOption = {
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
            { offset: 0, color: '#2563EB80' },
            { offset: 1, color: '#2563EB00' }
          ]
        }
      },
      lineStyle: {
        width: 3,
        shadowColor: '#2563EB40',
        shadowBlur: 10,
        shadowOffsetY: 8
      },
      itemStyle: {
        color: '#1E3A5F',
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  ]
}

// 柱状图配置
const regionOption = {
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

// 初始化图表
const initChart = (dom, option) => {
  const chart = echarts.init(dom)
  chart.setOption(option)
  return chart
}

const handleResize = () => {
  chartTrendInstance?.resize()
  chartRegionInstance?.resize()
}

// 获取看板数据
const fetchDashboard = async () => {
  loading.value = true
  try {
    // 并行请求总览与区域分布
    const [overviewRes, regionRes] = await Promise.all([
      requestWithRetry(getGovOverviewConfig()),
      requestWithRetry(getGovRegionConfig())
    ])
    const data = overviewRes.data.data

    stats.value = [
      { title: '农户总数', value: data.totalFarmers || 0, color: 'linear-gradient(135deg,#2563EB 0%,#1E3A5F 100%)', icon: markRaw(UserFilled) },
      { title: '产品分类数', value: data.totalCategories || 0, color: 'linear-gradient(135deg,#05B0FF 0%,#6BFFCA 100%)', icon: markRaw(Menu) },
      { title: '认领总数', value: data.totalAdoptions || 0, color: 'linear-gradient(135deg,#FFD86B 0%,#FFB56B 100%)', icon: markRaw(SuccessFilled) },
      { title: '注册游客数', value: data.totalUsers || 0, color: 'linear-gradient(135deg,#A78BFA 0%,#D46BFD 100%)', icon: markRaw(User) },
      { title: '总收益', value: data.totalRevenue || 0, color: 'linear-gradient(135deg,#10B981 0%,#047857 100%)', icon: markRaw(Money) }
    ]

    trendData.value = Array.isArray(data.trend) ? data.trend : []
    regionData.value = Array.isArray(regionRes.data.data) ? regionRes.data.data : []

    // 更新折线图
    trendOption.xAxis.data = trendData.value.map((item) => dayjs(item.date).format('MM-DD'))
    trendOption.series[0].data = trendData.value.map((item) => item.count)

    // 更新柱状图
    regionOption.xAxis.data = regionData.value.map((item) => item.city)
    regionOption.series[0].data = regionData.value.map((item) => item.totalAdoptions)

    nextTick(() => {
      chartTrendInstance?.setOption(trendOption)
      chartRegionInstance?.setOption(regionOption)
    })
  } catch (error) {
    ElMessage.error('看板数据加载失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDashboard()
  chartTrendInstance = initChart(chartTrendRef.value, trendOption)
  chartRegionInstance = initChart(chartRegionRef.value, regionOption)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartTrendInstance?.dispose()
  chartRegionInstance?.dispose()
})
</script>

<template>
  <div v-loading="loading" class="gov-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="(item, index) in stats" :key="index" :xs="24" :sm="12" :md="8">
        <el-card class="gov-stat-card" :style="{ background: item.color }">
          <div class="gov-stat-content">
            <div class="gov-stat-icon-box">
              <component :is="item.icon" class="gov-stat-icon" />
            </div>
            <div class="gov-stat-text">
              <div class="gov-stat-title">{{ item.title }}</div>
              <div class="gov-stat-value">
                <template v-if="item.title === '总收益'">¥ {{ Number(item.value || 0).toLocaleString() }}</template>
                <template v-else>{{ Number(item.value || 0).toLocaleString() }}</template>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 认领趋势 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12" class="mb-6">
        <el-card class="gov-card">
          <div class="gov-toolbar">
            <div style="display: flex; align-items: center">
              <el-icon :size="30" style="margin-right: 12px; color: var(--el-color-primary)"
                ><TrendCharts
              /></el-icon>
              <h3 class="gov-toolbar-title">最近7天认领趋势</h3>
            </div>
          </div>
          <div v-if="!trendData.length" class="gov-empty">
            <el-empty description="暂无认领趋势数据" />
          </div>
          <div v-else ref="chartTrendRef" class="gov-chart"></div>
        </el-card>
      </el-col>

      <!-- 各市认领分布 -->
      <el-col :xs="24" :lg="12" class="mb-6">
        <el-card class="gov-card">
          <div class="gov-toolbar">
            <div style="display: flex; align-items: center">
              <el-icon :size="30" style="margin-right: 12px; color: var(--el-color-primary)"
                ><Histogram
              /></el-icon>
              <h3 class="gov-toolbar-title">各市认领分布</h3>
            </div>
          </div>
          <div v-if="!regionData.length" class="gov-empty">
            <el-empty description="暂无区域认领数据" />
          </div>
          <div v-else ref="chartRegionRef" class="gov-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');

.stats-row {
  margin-bottom: 10px;
}

.mb-6 {
  margin-bottom: 20px;
}
</style>
