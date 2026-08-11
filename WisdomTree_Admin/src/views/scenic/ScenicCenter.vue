<script setup>
import { ref, onMounted } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import BreadCrumb from '@/components/BreadCrumb.vue'
import PaginationEl from '@/components/PaginationEl.vue'
import {
  getAdminScenicListConfig,
  createScenicConfig,
  updateScenicConfig,
  deleteScenicConfig
} from '@/common/interfaces/Scenic.interface'

// 景区列表数据
const listData = ref([])

// 总数据量 传给分页组件计算
const total = ref(0)

// 级别选项
const levelOptions = ['5A', '4A', '3A', '国家级旅游度假区', '省级旅游度假区', '自定义', '其他']

// 城市选项
const cityOptions = ['银川', '石嘴山', '吴忠', '固原', '中卫', '其他']

// 城市 → 天气码映射（选择城市后自动填充天气编码，无需手动填写）
const cityWeatherCodes = {
  '银川': '101170101',
  '石嘴山': '101170201',
  '吴忠': '101170301',
  '固原': '101170401',
  '中卫': '101170501',
  '平罗': '101170202',
  '青铜峡': '101170302'
}

// 城市选择变化时自动填充天气编码（仅当用户未手动填写时）
const handleCityChange = (city) => {
  if (!scenicForm.value.weather_code && cityWeatherCodes[city]) {
    scenicForm.value.weather_code = cityWeatherCodes[city]
  }
}

// 获取景区列表
const getScenicList = async (e) => {
  const { page, pagesize } = e || { page: 1, pagesize: 10 }

  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getAdminScenicListConfig(page, pagesize))
    listData.value = Array.isArray(res.data.data.list) ? res.data.data.list : []
    total.value = res.data.data.total || 0
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取景区列表失败')
  }
}

getScenicList()

// ==================== 新增 / 编辑 ====================

// 对话框显隐
const dialogVisible = ref(false)

// 当前模式 create / edit
const dialogMode = ref('create')

// 当前编辑的景区 id
const editingId = ref(null)

// 表单
const formRef = ref()
const scenicForm = ref({
  name: '',
  level: '',
  city: '',
  location: '',
  description: '',
  features: [],
  cover_image: '',
  opening_hours: '',
  ticket: '',
  contact: '',
  longitude: '',
  latitude: '',
  website: '',
  weather_code: '',
  is_featured: false
})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '请输入景区名称', trigger: 'blur' }]
}

// 特色项目动态标签输入
const featureInput = ref('')

// 添加特色项目
const addFeature = () => {
  const val = featureInput.value.trim()
  if (!val) return
  if (!scenicForm.value.features.includes(val)) {
    scenicForm.value.features.push(val)
  }
  featureInput.value = ''
}

// 删除特色项目
const removeFeature = (index) => {
  scenicForm.value.features.splice(index, 1)
}

// 打开新增对话框
const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = null
  scenicForm.value = {
    name: '',
    level: '',
    city: '',
    location: '',
    description: '',
    features: [],
    cover_image: '',
    opening_hours: '',
    ticket: '',
    contact: '',
    longitude: '',
    latitude: '',
    website: '',
    weather_code: '',
    is_featured: false
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  scenicForm.value = {
    name: row.name || '',
    level: row.level || '',
    city: row.city || '',
    location: row.location || '',
    description: row.description || '',
    features: Array.isArray(row.features) ? [...row.features] : [],
    cover_image: row.cover_image || '',
    opening_hours: row.opening_hours || '',
    ticket: row.ticket || '',
    contact: row.contact || '',
    longitude: row.longitude ?? '',
    latitude: row.latitude ?? '',
    website: row.website || '',
    weather_code: row.weather_code ?? '',
    is_featured: !!row.is_featured
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
      await requestWithRetry(createScenicConfig(scenicForm.value))
      ElMessage.success('新增景区成功')
    } else {
      await requestWithRetry(updateScenicConfig(editingId.value, scenicForm.value))
      ElMessage.success('修改景区成功')
    }
    loading.close()
    dialogVisible.value = false
    getScenicList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '保存景区失败')
  }
}

// ==================== 删除 ====================

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该景区吗?删除后不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteScenic(row.id)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

const deleteScenic = async (id) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(deleteScenicConfig(id))
    loading.close()
    ElMessage.success(res.data?.message || '删除景区成功')
    getScenicList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '删除景区失败')
  }
}

// ==================== 表格高度 ====================

const container = ref()
const tableMaxHeight = ref()

const updateTableHeight = () => {
  tableMaxHeight.value = container.value.clientHeight * 0.84
}

onMounted(() => {
  updateTableHeight()
  window.addEventListener('resize', () => {
    setTimeout(updateTableHeight, 300)
  })
})

// 来源标签
const sourceTagType = (source) => (source === 'mct' ? 'info' : 'success')
const sourceLabel = (source) => (source === 'mct' ? '文旅部同步' : '手动添加')
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 景区管理 </template>
    <template #two> 景区管理 </template>
  </BreadCrumb>

  <div class="toolbar">
    <el-button type="primary" @click="handleCreate">
      <el-icon style="margin-right: 4px"><Plus /></el-icon>
      新增景区
    </el-button>
  </div>

  <!-- 景区表格 -->
  <div ref="container" style="height: 78%">
    <el-table
      :data="listData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
      empty-text="暂无景区数据，请点击右上角新增景区"
    >
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="景区名称" prop="name" min-width="160" show-overflow-tooltip />
      <el-table-column label="级别" width="140">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.level || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="城市" prop="city" width="100" />
      <el-table-column label="来源" width="110">
        <template #default="scope">
          <el-tag :type="sourceTagType(scope.row.source)" size="large">
            {{ sourceLabel(scope.row.source) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="门票" width="120">
        <template #default="scope">{{ scope.row.ticket || '-' }}</template>
      </el-table-column>
      <el-table-column label="开放时间" min-width="140" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.opening_hours || '-' }}</template>
      </el-table-column>
      <el-table-column label="是否推荐" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.is_featured ? 'danger' : 'info'" size="large">
            {{ scope.row.is_featured ? '推荐' : '普通' }}
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

  <!-- 分页组件 -->
  <PaginationEl @pagechange="(e) => getScenicList(e)" :total-father="total" />

  <!-- 新增/编辑景区对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogMode === 'create' ? '新增景区' : '编辑景区'"
    width="760px"
    :close-on-click-modal="false"
    top="4vh"
    destroy-on-close
  >
    <el-form ref="formRef" :model="scenicForm" :rules="formRules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="景区名称" prop="name">
            <el-input v-model="scenicForm.name" placeholder="请输入景区名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="级别">
            <el-select v-model="scenicForm.level" placeholder="请选择级别" style="width: 100%">
              <el-option v-for="item in levelOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="城市">
            <el-select v-model="scenicForm.city" placeholder="请选择城市" style="width: 100%" @change="handleCityChange">
              <el-option v-for="item in cityOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="位置">
            <el-input v-model="scenicForm.location" placeholder="请输入景区位置" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="门票">
            <el-input v-model="scenicForm.ticket" placeholder="如：免费 / 80元" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开放时间">
            <el-input v-model="scenicForm.opening_hours" placeholder="如：08:00-18:00" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input v-model="scenicForm.contact" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="官方网站">
            <el-input v-model="scenicForm.website" placeholder="请输入官方网站" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="经度">
            <el-input v-model="scenicForm.longitude" placeholder="如：106.23" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="纬度">
            <el-input v-model="scenicForm.latitude" placeholder="如：38.48" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="天气编码">
            <el-input v-model="scenicForm.weather_code" placeholder="如：101170101" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="封面图片">
        <el-input v-model="scenicForm.cover_image" placeholder="请输入封面图片 URL" />
      </el-form-item>
      <el-form-item label="特色项目">
        <div class="features-editor">
          <el-tag
            v-for="(feature, index) in scenicForm.features"
            :key="index"
            closable
            type="success"
            size="large"
            @close="removeFeature(index)"
          >
            {{ feature }}
          </el-tag>
          <el-input
            v-model="featureInput"
            placeholder="输入特色项目后按回车添加"
            class="feature-input"
            @keyup.enter="addFeature"
            @blur="addFeature"
          />
        </div>
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="scenicForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入景区简介"
        />
      </el-form-item>
      <el-form-item label="是否推荐">
        <el-switch
          v-model="scenicForm.is_featured"
          active-text="推荐"
          inactive-text="普通"
        />
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

.features-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.feature-input {
  width: 240px;
}
</style>
