<script setup>
import { watch, ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { deleteCategoryConfig } from '@/common/interfaces/Category.interface'
import deleteFileConfig from '@/common/interfaces/DeleteFile.interface'
import router from '@/router'

const tableData = ref([])

// 子传父
const emit = defineEmits(['handleDelete'])

// 子接受父组件数据
const props = defineProps({
  categorylist: Array
})

// 表格数据
watch(
  () => props.categorylist,
  (newVal) => {
    tableData.value = newVal
  },
  { immediate: true }
)

// 删除分类
const handleDelete = (index, row) => {
  open(row.id, row.avatar)
}

// 弹窗逻辑
const open = (categoryID, avatar) => {
  ElMessageBox.confirm('确定要删除分类吗?删除后不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteCategory(categoryID, avatar)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 删除请求后端
const deleteCategory = async (categoryID, avatar) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await Promise.all([
      requestWithRetry(deleteFileConfig(avatar)),
      requestWithRetry(deleteCategoryConfig(categoryID))
    ])
    loading.close()
    //删除成功后，重新请求数据
    emit('handleDelete')
    ElMessage({
      type: 'success',
      message: `${res[1].data.message}`
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
    path: '/adminCategory/updateCategory',
    query: { categoryId: row.id }
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
    <el-table
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
            <h3>分类详情</h3>
            <p>{{ scope.row.description }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="分类名称" prop="name" />
      <el-table-column label="分类图片">
        <template #default="scope">
          <el-col class="categoryImge-el">
            <el-image
              class="avatar"
              :preview-teleported="true"
              :preview-src-list="[scope.row.avatar]"
              :src="scope.row.avatar"
              fit="cover"
              loading="lazy"
          /></el-col>
        </template>
      </el-table-column>
      <el-table-column label="库存">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.remaining }}</el-tag>
        </template>
      </el-table-column>
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
@import url('/src/assets/css/tablecom.css');
</style>
