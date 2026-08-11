<script setup>
import { watch, ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import {
  batchUpdateProductsConfig,
  batchDeleteProductsConfig
} from '@/common/interfaces/Product.interface'
import router from '@/router'

const tableRef = ref()
const tableData = ref([])
const selectedRows = ref([])
const showBatchPriceDialog = ref(false)
const batchPrice = ref(0)
const batchUpdating = ref(false)

// 分类筛选数据
const categoryFilter = ref([])

// 子传父
const emit = defineEmits(['handleDelete'])

// 子接受父组件数据
const props = defineProps({
  productlist: Array,
  categoryFilterFather: Array
})

// 监听分类筛选数据，赋值给子组件
watch(
  () => props.categoryFilterFather,
  (newVal) => {
    // 当接收到新的数据时
    categoryFilter.value = newVal.map((item) => {
      return {
        text: item,
        value: item
      }
    })
  },
  { immediate: true }
)

// 表格数据
watch(
  () => props.productlist,
  (newVal) => {
    tableData.value = newVal
  },
  { immediate: true }
)

// 产品分类筛选
const CategoryFilter = (value, row, column) => {
  const property = column['property']
  return row[property] === value
}

// 上下架筛选
const statusFilter = (value, row) => {
  return row.is_sold === value
}

// 重置所有筛选条件
const clearFilter = () => {
  tableRef.value.clearFilter()
}

// 删除产品（聚合视图下删除整个分类及其产品）
const handleDelete = (index, row) => {
  open(row.id)
}

// 弹窗逻辑
const open = (categoryId) => {
  ElMessageBox.confirm(
    '确定要删除该产品吗? 将删除该产品下的全部库存，已售出的产品无法删除',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      deleteProduct(categoryId)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 删除请求后端（走批量删除接口，按分类删除）
const deleteProduct = async (categoryId) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(batchDeleteProductsConfig([categoryId]))
    loading.close()
    emit('handleDelete')
    ElMessage({
      type: 'success',
      message: `${res.data.message}`
    })
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(`${error.response?.data?.message || '删除失败'}`)
  }
}

// 前往编辑（聚合视图下产品=分类，跳转分类编辑页）
const handleEdit = (index, row) => {
  router.push({
    path: '/adminCategory/updateCategory',
    query: { categoryId: row.id }
  })
}

// 批量操作：统一修改价格
const openBatchPriceDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选要操作的产品')
    return
  }
  batchPrice.value = 0
  showBatchPriceDialog.value = true
}

// 执行批量改价
const confirmBatchPrice = async () => {
  const ids = selectedRows.value.map((row) => row.id)
  batchUpdating.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '批量修改价格中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(
      batchUpdateProductsConfig(ids, { price: batchPrice.value })
    )
    loading.close()
    showBatchPriceDialog.value = false
    ElMessage.success(res.data.message)
    emit('handleDelete')
  } catch (error) {
    loading.close()
    console.log(error)
    ElMessage.error(error.response?.data?.message || '批量修改价格失败')
  } finally {
    batchUpdating.value = false
  }
}

// 批量上下架
const batchSetStatus = async (isSold) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选要操作的产品')
    return
  }
  const ids = selectedRows.value.map((row) => row.id)
  const actionText = isSold ? '上架' : '下架'
  const loading = ElLoading.service({
    lock: true,
    text: `批量${actionText}中...`,
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(
      batchUpdateProductsConfig(ids, { is_sold: isSold })
    )
    loading.close()
    ElMessage.success(res.data.message)
    emit('handleDelete')
  } catch (error) {
    loading.close()
    console.log(error)
    ElMessage.error(error.response?.data?.message || `批量${actionText}失败`)
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选要删除的产品')
    return
  }
  const ids = selectedRows.value.map((row) => row.id)
  ElMessageBox.confirm(
    `确定要删除选中的 ${ids.length} 个产品吗? 已售出的产品无法删除`,
    '批量删除提示',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      const loading = ElLoading.service({
        lock: true,
        text: '批量删除中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      try {
        const res = await requestWithRetry(batchDeleteProductsConfig(ids))
        loading.close()
        ElMessage.success(res.data.message)
        emit('handleDelete')
      } catch (error) {
        loading.close()
        console.log(error)
        ElMessage.error(error.response?.data?.message || '批量删除失败')
      }
    })
    .catch(() => {
      ElMessage({ type: 'info', message: '取消操作' })
    })
}

// 勾选变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 表格父盒子
const container = ref()

// 动态设置的最大高度
const tableMaxHeight = ref()

// 更新表格最大高度的方法
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
  <div ref="container" style="height: 92%">
    <div class="batch-toolbar">
      <span class="batch-info" v-if="selectedRows.length > 0">
        已选 {{ selectedRows.length }} 项
      </span>
      <el-button type="primary" size="small" @click="openBatchPriceDialog">批量改价</el-button>
      <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
      <el-button size="small" @click="clearFilter" style="margin-left: auto">重置筛选</el-button>
    </div>
    <el-table
      ref="tableRef"
      :data="tableData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="产品名称" prop="categoryName" />
      <el-table-column label="品种">
        <template #default="scope">
          <span>{{ scope.row.displayName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="价格">
        <template #default="scope">
          <el-tag size="large" type="success">¥{{ scope.row.price }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="单位">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.unit }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总库存" prop="total" width="100" />
      <el-table-column label="剩余库存" prop="remaining" width="100" />
      <el-table-column
        label="状态"
        prop="is_sold"
        :filters="[
          { text: '有货', value: true },
          { text: '缺货', value: false }
        ]"
        :filter-method="statusFilter"
      >
        <template #default="scope">
          <el-tag size="large" :type="scope.row.is_sold ? 'success' : 'info'">{{
            scope.row.is_sold ? '有货' : '缺货'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="图片">
        <template #default="scope">
          <el-col class="productImge-el">
            <div class="productImge-box" v-for="(item, index) in scope.row.mediaUrls" :key="index">
              <el-image
                class="productImge"
                :preview-teleported="true"
                :preview-src-list="scope.row.mediaUrls"
                :initial-index="index"
                :src="item"
                fit="cover"
                loading="lazy"
              />
            </div>
            <div class="empty-div"></div>
          </el-col>
        </template>
      </el-table-column>
      <el-table-column label="相关操作">
        <template #default="scope">
          <el-button @click="handleEdit(scope.$index, scope.row)"> 编辑 </el-button>
          <el-button type="danger" @click="handleDelete(scope.$index, scope.row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showBatchPriceDialog" title="批量修改价格" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新价格">
          <el-input-number v-model="batchPrice" :min="0" :step="0.5" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <span style="color: #909399; font-size: 12px">
            将对选中的 {{ selectedRows.length }} 个产品统一设置价格
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchPriceDialog = false">取消</el-button>
        <el-button type="primary" :loading="batchUpdating" @click="confirmBatchPrice">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/TreeTable.css');

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.batch-info {
  color: #409eff;
  font-size: 13px;
  margin-right: 4px;
}
</style>
