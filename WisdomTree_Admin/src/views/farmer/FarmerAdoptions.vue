<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import BreadCrumb from '@/components/BreadCrumb.vue'
import {
  getFarmerAdoptionsConfig,
  confirmFarmerAdoptionConfig,
  completeFarmerAdoptionConfig
} from '@/common/interfaces/farmer.interface'

const loading = ref(false)
const listData = ref([])
const statusFilter = ref('')

// 状态映射
const statusMap = {
  growing: { label: '生长中', type: 'primary' },
  confirmed: { label: '已确认种植', type: 'success' },
  harvesting: { label: '待收获', type: 'warning' },
  completed: { label: '已完成', type: 'info' }
}

const statusLabel = (status) => statusMap[status]?.label || status
const statusType = (status) => statusMap[status]?.type || 'info'

// 获取认领订单列表
const getAdoptions = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getFarmerAdoptionsConfig(statusFilter.value))
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (error) {
    ElMessage.error('获取认领订单失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 确认种植
const handleConfirm = (row) => {
  ElMessageBox.confirm(`确认对认领订单「${row.adoption_id}」开始种植吗？`, '确认种植', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      try {
        const res = await requestWithRetry(confirmFarmerAdoptionConfig(row.id))
        ElMessage.success(res.data.message || '已确认种植')
        getAdoptions()
      } catch (error) {
        loading.value = false
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

// 履约完成
const handleComplete = (row) => {
  ElMessageBox.confirm(`确认认领订单「${row.adoption_id}」已履约完成吗？`, '履约完成', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      try {
        const res = await requestWithRetry(completeFarmerAdoptionConfig(row.id))
        ElMessage.success(res.data.message || '已履约完成')
        getAdoptions()
      } catch (error) {
        loading.value = false
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

// 状态筛选变化
const handleStatusChange = () => {
  getAdoptions()
}

onMounted(() => {
  getAdoptions()
})
</script>

<template>
  <div class="farmer-page">
    <BreadCrumb>
      <template #one> 认领订单 </template>
      <template #two> 认领订单管理 </template>
    </BreadCrumb>

    <div class="farmer-table-wrap">
      <div class="farmer-toolbar">
        <h3 class="farmer-toolbar-title">认领订单列表</h3>
        <div class="filter-bar">
          <span class="filter-label">状态筛选：</span>
          <el-select
            v-model="statusFilter"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="handleStatusChange"
          >
            <el-option label="生长中" value="growing" />
            <el-option label="已确认种植" value="confirmed" />
            <el-option label="待收获" value="harvesting" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button style="margin-left: 12px" @click="getAdoptions">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="listData" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无认领订单数据" />
        </template>
        <el-table-column label="认领编号" prop="adoption_id" min-width="130">
          <template #default="scope">
            <el-tag size="large">{{ scope.row.adoption_id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产品" prop="productName" min-width="120" />
        <el-table-column label="用户昵称" prop="nickname" min-width="100" />
        <el-table-column label="心愿" prop="wish" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" min-width="90">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" prop="adopted_at" min-width="110" />
        <el-table-column label="溯源码" prop="trace_code" min-width="140">
          <template #default="scope">
            <span v-if="scope.row.trace_code">{{ scope.row.trace_code }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="收获方式" prop="harvest_type" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.harvest_type">{{ scope.row.harvest_type }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="相关操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 'growing'"
              type="success"
              size="small"
              @click="handleConfirm(scope.row)"
              >确认种植</el-button
            >
            <el-button
              v-if="scope.row.status === 'confirmed'"
              type="warning"
              size="small"
              @click="handleComplete(scope.row)"
              >履约完成</el-button
            >
            <el-button
              v-if="scope.row.status === 'harvesting'"
              type="warning"
              size="small"
              @click="handleComplete(scope.row)"
              >履约完成</el-button
            >
            <el-button
              v-if="scope.row.status === 'completed'"
              type="info"
              size="small"
              disabled
              >已完成</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');

.filter-bar {
  display: flex;
  align-items: center;
}

.filter-label {
  color: #606266;
  font-size: 14px;
}
</style>
