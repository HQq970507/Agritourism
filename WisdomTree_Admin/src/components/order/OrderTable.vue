<script setup>
import { watch, ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { deleteOrderConfig } from '@/common/interfaces/Order.interface'
import router from '@/router'

const tableRef = ref()
const tableData = ref([])

// 状态筛选数据
const statusFilter = ref([])

// 订单状态中文映射
const statusMap = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

// 子传父
const emit = defineEmits(['handleDelete'])

// 子接受父组件数据
const props = defineProps({
  orderlist: Array,
  statusFilterFather: Array
})

// 监听状态筛选数据
watch(
  () => props.statusFilterFather,
  (newVal) => {
    if (newVal && newVal.length) {
      statusFilter.value = newVal.map((item) => ({
        text: item.label,
        value: item.value
      }))
    } else {
      statusFilter.value = [
        { text: '待支付', value: 'pending' },
        { text: '已支付', value: 'paid' },
        { text: '已发货', value: 'shipped' },
        { text: '已完成', value: 'completed' },
        { text: '已取消', value: 'cancelled' }
      ]
    }
  },
  { immediate: true }
)

// 表格数据
watch(
  () => props.orderlist,
  (newVal) => {
    tableData.value = newVal
  },
  { immediate: true }
)

// 状态筛选
const OrderStatusFilter = (value, row, column) => {
  const property = column['property']
  return row[property] === value
}

// 重置所有筛选条件
const clearFilter = () => {
  tableRef.value.clearFilter()
}

// 删除订单
const handleDelete = (index, row) => {
  open(row.id)
}

// 弹窗逻辑
const open = (orderId) => {
  ElMessageBox.confirm('确定要删除订单吗?删除后不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteOrder(orderId)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 删除请求后端
const deleteOrder = async (orderId) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(deleteOrderConfig(orderId))
    console.log(res)
    loading.close()
    //删除成功后，重新请求数据
    emit('handleDelete')

    ElMessage({
      type: 'success',
      message: `${res.data.message}`
    })
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(`${error.response.data.message}`)
  }
}

// 前往编辑
const handleEdit = (index, row) => {
  router.push({
    path: '/adminOrder/updateOrder',
    query: { orderId: row.id }
  })
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
    <el-button @click="clearFilter" style="margin-top: 2rem">重置所有筛选条件</el-button>
    <el-table
      ref="tableRef"
      :data="tableData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <div class="xq">
            <h3>订单备注</h3>
            <p>{{ scope.row.remark || '无' }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单号" prop="orderNo" width="180">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.orderNo }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" prop="productName" />
      <el-table-column label="买家" prop="buyerName" />
      <el-table-column label="金额">
        <template #default="scope">
          <el-tag size="large" type="success">¥{{ scope.row.totalAmount }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="订单状态"
        prop="status"
        :filters="statusFilter"
        :filter-method="OrderStatusFilter"
      >
        <template #default="scope">
          <el-tag
            size="large"
            :type="
              scope.row.status === 'completed'
                ? 'success'
                : scope.row.status === 'cancelled'
                  ? 'info'
                  : scope.row.status === 'pending'
                    ? 'danger'
                    : 'warning'
            "
          >
            {{ statusMap[scope.row.status] || scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" prop="orderedAt" width="180" />
      <el-table-column label="相关操作">
        <template #default="scope">
          <el-button @click="handleEdit(scope.$index, scope.row)"> 编辑 </el-button>
          <el-button type="danger" @click="handleDelete(scope.$index, scope.row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/AdoptTable.css');
</style>
