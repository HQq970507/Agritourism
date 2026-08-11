<script setup>
import { ref, onMounted } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import BreadCrumb from '@/components/BreadCrumb.vue'
import {
  getAdminReservationsConfig,
  updateReservationStatusConfig
} from '@/common/interfaces/Travel.interface'

// 预约列表数据
const listData = ref([])

// 状态显示配置
const statusMap = {
  pending: { type: 'warning', label: '待确认' },
  confirmed: { type: 'success', label: '已确认' },
  completed: { type: 'primary', label: '已完成' },
  cancelled: { type: 'info', label: '已取消' }
}

// 获取预约列表
const getReservationList = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getAdminReservationsConfig())
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取预约列表失败')
  }
}

getReservationList()

// 状态标签
const statusTag = (status) => statusMap[status] || { type: 'info', label: status || '未知' }

// 根据当前状态返回可执行的操作
const getActions = (status) => {
  switch (status) {
    case 'pending':
      return [
        { key: 'confirmed', text: '确认', type: 'success' },
        { key: 'cancelled', text: '取消', type: 'danger' }
      ]
    case 'confirmed':
      return [
        { key: 'completed', text: '完成', type: 'primary' },
        { key: 'cancelled', text: '取消', type: 'danger' }
      ]
    default:
      return []
  }
}

// 更新预约状态
const handleStatusChange = (row, status) => {
  const nextStatus = statusMap[status]
  ElMessageBox.confirm(
    `确定要将该预约状态修改为「${nextStatus.label}」吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      updateStatus(row.id, status)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

const updateStatus = async (id, status) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(updateReservationStatusConfig(id, status))
    loading.close()
    ElMessage.success(res.data?.message || '状态更新成功')
    getReservationList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '状态更新失败')
  }
}

// ==================== 表格高度 ====================

const container = ref()
const tableMaxHeight = ref()

const updateTableHeight = () => {
  tableMaxHeight.value = container.value.clientHeight * 0.91
}

onMounted(() => {
  updateTableHeight()
  window.addEventListener('resize', () => {
    setTimeout(updateTableHeight, 300)
  })
})
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 文旅线路 </template>
    <template #two> 预约管理 </template>
  </BreadCrumb>

  <!-- 预约表格 -->
  <div ref="container" style="height: 92%">
    <el-table
      :data="listData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
      empty-text="暂无预约数据"
    >
      <el-table-column label="预约号" prop="reservation_no" min-width="130" />
      <el-table-column label="线路" prop="routeName" min-width="140" show-overflow-tooltip />
      <el-table-column label="用户" prop="username" width="100" />
      <el-table-column label="日期" prop="visit_date" width="110" />
      <el-table-column label="人数" prop="party_size" width="70" />
      <el-table-column label="联系人" prop="contact_name" width="90" />
      <el-table-column label="电话" prop="contact_phone" width="130" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.status).type" size="large">
            {{ statusTag(scope.row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="scope">
          <template v-for="action in getActions(scope.row.status)" :key="action.key">
            <el-button
              :type="action.type"
              link
              @click="handleStatusChange(scope.row, action.key)"
            >
              {{ action.text }}
            </el-button>
          </template>
          <span v-if="getActions(scope.row.status).length === 0">—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/tablecom.css');
</style>
