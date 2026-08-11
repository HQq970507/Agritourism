<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getGovFarmersConfig, updateGovFarmerStatusConfig } from '@/common/interfaces/gov.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)
const listData = ref([])
const statusFilter = ref('')

// 状态映射
const statusMap = {
  active: { label: '正常', type: 'success' },
  pending: { label: '待审核', type: 'warning' },
  banned: { label: '已封禁', type: 'danger' }
}

const statusLabel = (status) => statusMap[status]?.label || status
const statusType = (status) => statusMap[status]?.type || 'info'

// 获取农户监管列表
const getFarmers = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getGovFarmersConfig(statusFilter.value))
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (error) {
    ElMessage.error('获取农户列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 通过审核
const handleApprove = (row) => {
  ElMessageBox.confirm(`确认通过农户「${row.farm_name || row.username}」的入驻审核吗？`, '审核农户', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      try {
        const res = await requestWithRetry(updateGovFarmerStatusConfig(row.id, 'active'))
        ElMessage.success(res.data.message || '已通过审核')
        getFarmers()
      } catch (error) {
        loading.value = false
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

// 封禁农户
const handleBan = (row) => {
  ElMessageBox.confirm(
    `确认封禁农户「${row.farm_name || row.username}」吗？封禁后其产品将无法继续上架销售。`,
    '封禁农户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      loading.value = true
      try {
        const res = await requestWithRetry(updateGovFarmerStatusConfig(row.id, 'banned'))
        ElMessage.success(res.data.message || '已封禁')
        getFarmers()
      } catch (error) {
        loading.value = false
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

// 状态筛选变化
const handleStatusChange = () => {
  getFarmers()
}

onMounted(() => {
  getFarmers()
})
</script>

<template>
  <div class="gov-page">
    <BreadCrumb>
      <template #one> 商户监管 </template>
      <template #two> 农户管理 </template>
    </BreadCrumb>

    <div class="gov-table-wrap">
      <div class="gov-toolbar">
        <h3 class="gov-toolbar-title">入驻农户列表</h3>
        <div class="filter-bar">
          <span class="filter-label">状态筛选：</span>
          <el-select
            v-model="statusFilter"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="handleStatusChange"
          >
            <el-option label="正常" value="active" />
            <el-option label="待审核" value="pending" />
            <el-option label="已封禁" value="banned" />
          </el-select>
          <el-button style="margin-left: 12px" @click="getFarmers">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="listData" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无农户数据" />
        </template>
        <el-table-column label="账号" prop="username" min-width="120" />
        <el-table-column label="农场名" prop="farm_name" min-width="140">
          <template #default="scope">
            <span v-if="scope.row.farm_name">{{ scope.row.farm_name }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="资质" prop="qualification" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.qualification">{{ scope.row.qualification }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="phone" min-width="120">
          <template #default="scope">
            <span v-if="scope.row.phone">{{ scope.row.phone }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="认领单数" prop="productAdoptions" min-width="90" />
        <el-table-column label="产品数" prop="productCount" min-width="80" />
        <el-table-column label="状态" prop="status" min-width="90">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="created_at" min-width="150">
          <template #default="scope">
            <span v-if="scope.row.created_at">{{ scope.row.created_at }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="相关操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status !== 'active'"
              type="success"
              size="small"
              @click="handleApprove(scope.row)"
              >通过审核</el-button
            >
            <el-button
              v-if="scope.row.status !== 'banned'"
              type="danger"
              size="small"
              @click="handleBan(scope.row)"
              >封禁</el-button
            >
            <span v-if="scope.row.status === 'banned'" style="color: #909399">已封禁</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');
</style>
