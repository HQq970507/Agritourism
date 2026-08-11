<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { getFarmerProductsConfig } from '@/common/interfaces/farmer.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)
const listData = ref([])

const getProducts = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getFarmerProductsConfig())
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (error) {
    ElMessage.error('获取产品列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getProducts()
})
</script>

<template>
  <div class="farmer-page">
    <BreadCrumb>
      <template #one> 产品管理 </template>
      <template #two> 我的产品 </template>
    </BreadCrumb>

    <div class="farmer-table-wrap">
      <div class="farmer-toolbar">
        <h3 class="farmer-toolbar-title">名下产品列表（只读）</h3>
        <el-button @click="getProducts">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="listData" stripe size="large" style="width: 100%">
        <template #empty>
          <el-empty description="暂无产品数据" />
        </template>
        <el-table-column label="分类名" prop="name" min-width="110" />
        <el-table-column label="展示名" prop="display_name" min-width="130" />
        <el-table-column label="价格" prop="price" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.price != null">¥ {{ scope.row.price }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" prop="unit" min-width="80" />
        <el-table-column label="总量" prop="total" min-width="80" />
        <el-table-column label="剩余" prop="remaining" min-width="80">
          <template #default="scope">
            <el-tag :type="scope.row.remaining > 0 ? 'success' : 'info'">
              {{ scope.row.remaining }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" prop="points_required" min-width="90">
          <template #default="scope">
            <span v-if="scope.row.points_required != null">{{ scope.row.points_required }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column label="认领价" prop="adopt_price" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.adopt_price != null">¥ {{ scope.row.adopt_price }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');
</style>
