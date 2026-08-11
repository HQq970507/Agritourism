<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getGovActivityListConfig } from '@/common/interfaces/gov.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'
import PaginationEl from '@/components/PaginationEl.vue'
import dayjs from 'dayjs'

const loading = ref(false)
const listData = ref([])
const total = ref(0)

// 活动状态计算
const getActivityStatus = (start, end) => {
  const now = dayjs()
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  if (now.isBefore(startDate)) return '已发布'
  if (now.isAfter(endDate)) return '已结束'
  return '进行中'
}

const statusType = (status) => {
  if (status === '已发布') return 'success'
  if (status === '进行中') return 'warning'
  return 'info'
}

// 获取活动列表
const getActivityList = async (e) => {
  const { page, pagesize } = e || { page: 1, pagesize: 10 }
  loading.value = true
  try {
    const res = await requestWithRetry(getGovActivityListConfig(page, pagesize))
    const data = res.data.data
    const activities = Array.isArray(data) ? data : data?.activities || []
    activities.forEach((item) => {
      item.status = getActivityStatus(item.startTime, item.endTime)
    })
    listData.value = activities
    total.value = Array.isArray(data) ? activities.length : data?.total || 0
  } catch (error) {
    ElMessage.error('获取活动列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getActivityList()
})
</script>

<template>
  <div class="gov-page">
    <BreadCrumb>
      <template #one> 活动统筹 </template>
      <template #two> 活动列表 </template>
    </BreadCrumb>

    <div class="gov-table-wrap">
      <div class="gov-toolbar">
        <h3 class="gov-toolbar-title">平台活动统筹</h3>
        <el-button @click="getActivityList">刷新</el-button>
      </div>

      <el-alert
        style="margin-bottom: 20px"
        type="info"
        :closable="false"
        show-icon
        title="当前接口暂不返回报名人数明细，此处仅展示活动基本信息；报名名单可在后续接入 /activity/signUpList 后查看。"
      />

      <el-table v-loading="loading" :data="listData" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无活动数据" />
        </template>
        <el-table-column label="活动标题" prop="title" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" min-width="90">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="地点" prop="location" min-width="120">
          <template #default="scope">
            <span v-if="scope.row.location">{{ scope.row.location }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="报名人数" min-width="110">
          <template #default="scope">
            <span v-if="scope.row.currentCapacity != null">
              {{ scope.row.currentCapacity }} / {{ scope.row.plannedCapacity }}
            </span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" min-width="230">
          <template #default="scope">
            <span v-if="scope.row.startTime">
              {{ dayjs(scope.row.startTime).format('YYYY-MM-DD HH:mm') }} ~
              {{ dayjs(scope.row.endTime).format('YYYY-MM-DD HH:mm') }}
            </span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="活动详情" prop="content" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.content">{{ scope.row.content }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
      </el-table>

      <PaginationEl
        style="margin-top: 20px"
        @pagechange="(e) => getActivityList(e)"
        :total-father="total"
      />
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');
</style>
