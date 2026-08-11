<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import {
  getGovProductsConfig,
  getGovFarmersConfig,
  offShelfGovProductConfig
} from '@/common/interfaces/gov.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)
const listData = ref([])
const farmerOptions = ref([])
const farmerFilter = ref('')

// 状态映射
const statusMap = {
  on: { label: '在售', type: 'success' },
  off: { label: '已下架', type: 'info' },
  sold_out: { label: '售罄', type: 'warning' }
}

const statusLabel = (status) => statusMap[status]?.label || status
const statusType = (status) => statusMap[status]?.type || 'info'

// 获取农户下拉选项
const getFarmers = async () => {
  try {
    const res = await requestWithRetry(getGovFarmersConfig(''))
    farmerOptions.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (error) {
    // 下拉加载失败不阻塞产品列表
    console.log(error)
  }
}

// 获取产品监管列表
const getProducts = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getGovProductsConfig(farmerFilter.value || undefined))
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (error) {
    ElMessage.error('获取产品列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 产品下架
const handleOffShelf = (row) => {
  ElMessageBox.confirm(`确认将产品「${row.display_name || row.name}」下架吗？`, '产品下架', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      try {
        const res = await requestWithRetry(offShelfGovProductConfig(row.id))
        ElMessage.success(res.data.message || '已下架')
        getProducts()
      } catch (error) {
        loading.value = false
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

// 农户筛选变化
const handleFarmerChange = () => {
  getProducts()
}

onMounted(() => {
  getFarmers()
  getProducts()
})
</script>

<template>
  <div class="gov-page">
    <BreadCrumb>
      <template #one> 商户监管 </template>
      <template #two> 产品管理 </template>
    </BreadCrumb>

    <div class="gov-table-wrap">
      <div class="gov-toolbar">
        <h3 class="gov-toolbar-title">平台产品列表</h3>
        <div class="filter-bar">
          <span class="filter-label">所属农户：</span>
          <el-select
            v-model="farmerFilter"
            placeholder="全部农户"
            clearable
            filterable
            style="width: 220px"
            @change="handleFarmerChange"
          >
            <el-option
              v-for="f in farmerOptions"
              :key="f.id"
              :label="f.farm_name || f.username"
              :value="f.id"
            />
          </el-select>
          <el-button style="margin-left: 12px" @click="getProducts">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="listData" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无产品数据" />
        </template>
        <el-table-column label="分类名" prop="name" min-width="110" />
        <el-table-column label="展示名" prop="display_name" min-width="130" />
        <el-table-column label="所属农户" prop="farm_name" min-width="140">
          <template #default="scope">
            <span v-if="scope.row.farm_name">{{ scope.row.farm_name }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" prop="price" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.price != null">¥ {{ scope.row.price }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="总量" prop="total" min-width="80" />
        <el-table-column label="剩余" prop="remaining" min-width="80">
          <template #default="scope">
            <el-tag :type="scope.row.remaining > 0 ? 'success' : 'info'">
              {{ scope.row.remaining }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认领价" prop="adopt_price" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.adopt_price != null">¥ {{ scope.row.adopt_price }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" min-width="90">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="相关操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status !== 'off'"
              type="danger"
              size="small"
              @click="handleOffShelf(scope.row)"
              >下架</el-button
            >
            <span v-else style="color: #909399">已下架</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');
</style>
