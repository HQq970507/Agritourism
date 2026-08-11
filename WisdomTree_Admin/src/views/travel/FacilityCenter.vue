<script setup>
import { ref, onMounted } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import BreadCrumb from '@/components/BreadCrumb.vue'
import {
  getAdminFacilitiesConfig,
  createFacilityConfig,
  updateFacilityConfig,
  deleteFacilityConfig
} from '@/common/interfaces/Travel.interface'

// 设施列表数据
const listData = ref([])

// 设施类型选项
const typeOptions = ['采摘园', '体验区', '餐厅', '民宿', '研学基地', '观景台']

// 状态选项
const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' }
]

// 获取设施列表
const getFacilityList = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getAdminFacilitiesConfig())
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取设施列表失败')
  }
}

getFacilityList()

// ==================== 新增 / 编辑 ====================

const dialogVisible = ref(false)
const dialogMode = ref('create')
const editingId = ref(null)
const formRef = ref()

const facilityForm = ref({
  name: '',
  type: '',
  description: '',
  opening_hours: '',
  contact: '',
  location: '',
  cover_image: '',
  status: 'active'
})

const formRules = {
  name: [{ required: true, message: '请输入设施名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择设施类型', trigger: 'change' }]
}

// 打开新增对话框
const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = null
  facilityForm.value = {
    name: '',
    type: '',
    description: '',
    opening_hours: '',
    contact: '',
    location: '',
    cover_image: '',
    status: 'active'
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  facilityForm.value = {
    name: row.name || '',
    type: row.type || '',
    description: row.description || '',
    opening_hours: row.opening_hours || '',
    contact: row.contact || '',
    location: row.location || '',
    cover_image: row.cover_image || '',
    status: row.status || 'active'
  }
  dialogVisible.value = true
}

// 提交（新增或编辑）
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return
  }
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    if (dialogMode.value === 'create') {
      await requestWithRetry(createFacilityConfig(facilityForm.value))
      ElMessage.success('新建设施成功')
    } else {
      await requestWithRetry(updateFacilityConfig(editingId.value, facilityForm.value))
      ElMessage.success('修改设施成功')
    }
    loading.close()
    dialogVisible.value = false
    getFacilityList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '保存设施失败')
  }
}

// ==================== 删除 ====================

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该设施吗?删除后不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteFacility(row.id)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

const deleteFacility = async (id) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(deleteFacilityConfig(id))
    loading.close()
    ElMessage.success(res.data?.message || '删除设施成功')
    getFacilityList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '删除设施失败')
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

// 状态标签
const statusTagType = (status) => (status === 'active' ? 'success' : 'info')
const statusLabel = (status) => (status === 'active' ? '启用' : '停用')
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 文旅线路 </template>
    <template #two> 设施管理 </template>
  </BreadCrumb>

  <div class="toolbar">
    <el-button type="primary" @click="handleCreate">
      <el-icon style="margin-right: 4px"><Plus /></el-icon>
      新增设施
    </el-button>
  </div>

  <!-- 设施表格 -->
  <div ref="container" style="height: 85%">
    <el-table
      :data="listData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
      empty-text="暂无设施数据，请点击右上角新增设施"
    >
      <el-table-column label="名称" prop="name" min-width="140" />
      <el-table-column label="类型" width="110">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="营业时间" prop="opening_hours" min-width="140" />
      <el-table-column label="联系电话" prop="contact" width="130" />
      <el-table-column label="位置" prop="location" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="large">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="相关操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)"> 编辑 </el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 新增/编辑设施对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogMode === 'create' ? '新增设施' : '编辑设施'"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="facilityForm" :rules="formRules" label-width="90px">
      <el-form-item label="设施名称" prop="name">
        <el-input v-model="facilityForm.name" placeholder="请输入设施名称" />
      </el-form-item>
      <el-form-item label="设施类型" prop="type">
        <el-select v-model="facilityForm.type" placeholder="请选择设施类型" style="width: 100%">
          <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="营业时间">
        <el-input v-model="facilityForm.opening_hours" placeholder="如：09:00-18:00" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="facilityForm.contact" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="位置">
        <el-input v-model="facilityForm.location" placeholder="请输入设施位置" />
      </el-form-item>
      <el-form-item label="封面图片">
        <el-input v-model="facilityForm.cover_image" placeholder="请输入封面图片 URL" />
      </el-form-item>
      <el-form-item label="设施描述">
        <el-input
          v-model="facilityForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入设施描述"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="facilityForm.status" style="width: 100%">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
@import url('/src/assets/css/tablecom.css');

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
