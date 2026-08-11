<script setup>
import { ref, onMounted } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import BreadCrumb from '@/components/BreadCrumb.vue'
import {
  getAdminRoutesConfig,
  createRouteConfig,
  updateRouteConfig,
  deleteRouteConfig
} from '@/common/interfaces/Travel.interface'

// 线路列表数据
const listData = ref([])

// 分类选项
const categoryOptions = ['采摘', '亲子', '研学', '康养', '美食', '观光']

// 难度选项
const difficultyOptions = ['轻松', '适中', '挑战']

// 状态选项
const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' }
]

// 站点类型选项
const stopTypeOptions = ['集合点', '景点', '体验点', '餐饮点', '休息点', '观景点', '住宿点', '终点']

// 获取线路列表
const getRouteList = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(getAdminRoutesConfig())
    listData.value = Array.isArray(res.data.data) ? res.data.data : []
    loading.close()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error('获取线路列表失败')
  }
}

getRouteList()

// ==================== 新增 / 编辑 ====================

// 对话框显隐
const dialogVisible = ref(false)

// 当前模式 create / edit
const dialogMode = ref('create')

// 当前编辑的线路 id
const editingId = ref(null)

// 表单
const formRef = ref()
const routeForm = ref({
  name: '',
  title: '',
  category: '',
  description: '',
  duration_hours: 1,
  distance_km: 1,
  difficulty: '轻松',
  best_season: '',
  is_featured: false,
  status: 'active',
  cover_image: '',
  stops: []
})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '请输入线路名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入线路标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 重新生成站点顺序号
const syncStopOrder = () => {
  routeForm.value.stops.forEach((stop, index) => {
    stop.order_index = index + 1
  })
}

// 新增站点
const addStop = () => {
  routeForm.value.stops.push({
    order_index: routeForm.value.stops.length + 1,
    name: '',
    type: '景点',
    time_slot: '',
    duration_minutes: 30,
    description: '',
    location: ''
  })
}

// 删除站点
const removeStop = (index) => {
  routeForm.value.stops.splice(index, 1)
  syncStopOrder()
}

// 上移站点
const moveStopUp = (index) => {
  if (index <= 0) return
  const stops = routeForm.value.stops
  const temp = stops[index]
  stops[index] = stops[index - 1]
  stops[index - 1] = temp
  syncStopOrder()
}

// 下移站点
const moveStopDown = (index) => {
  const stops = routeForm.value.stops
  if (index >= stops.length - 1) return
  const temp = stops[index]
  stops[index] = stops[index + 1]
  stops[index + 1] = temp
  syncStopOrder()
}

// 打开新增对话框
const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = null
  routeForm.value = {
    name: '',
    title: '',
    category: '',
    description: '',
    duration_hours: 1,
    distance_km: 1,
    difficulty: '轻松',
    best_season: '',
    is_featured: false,
    status: 'active',
    cover_image: '',
    stops: []
  }
  addStop()
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  routeForm.value = {
    name: row.name || '',
    title: row.title || '',
    category: row.category || '',
    description: row.description || '',
    duration_hours: row.duration_hours ?? 1,
    distance_km: row.distance_km ?? 1,
    difficulty: row.difficulty || '轻松',
    best_season: row.best_season || '',
    is_featured: !!row.is_featured,
    status: row.status || 'active',
    cover_image: row.cover_image || '',
    stops: Array.isArray(row.stops) ? row.stops.map((stop) => ({ ...stop })) : []
  }
  if (routeForm.value.stops.length === 0) {
    addStop()
  } else {
    syncStopOrder()
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
  if (routeForm.value.stops.length === 0) {
    ElMessage.warning('请至少添加一个站点')
    return
  }
  syncStopOrder()
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    if (dialogMode.value === 'create') {
      await requestWithRetry(createRouteConfig(routeForm.value))
      ElMessage.success('新增线路成功')
    } else {
      await requestWithRetry(updateRouteConfig(editingId.value, routeForm.value))
      ElMessage.success('修改线路成功')
    }
    loading.close()
    dialogVisible.value = false
    getRouteList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '保存线路失败')
  }
}

// ==================== 删除 ====================

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该线路吗?删除后不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteRoute(row.id)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

const deleteRoute = async (id) => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(deleteRouteConfig(id))
    loading.close()
    ElMessage.success(res.data?.message || '删除线路成功')
    getRouteList()
  } catch (error) {
    console.log(error)
    loading.close()
    ElMessage.error(error.response?.data?.message || '删除线路失败')
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
    <template #two> 线路管理 </template>
  </BreadCrumb>

  <div class="toolbar">
    <el-button type="primary" @click="handleCreate">
      <el-icon style="margin-right: 4px"><Plus /></el-icon>
      新增线路
    </el-button>
  </div>

  <!-- 线路表格 -->
  <div ref="container" style="height: 85%">
    <el-table
      :data="listData"
      style="width: 100%"
      :max-height="tableMaxHeight"
      stripe
      :border="false"
      size="large"
      class="table"
      empty-text="暂无线路数据，请点击右上角新增线路"
    >
      <el-table-column label="名称" min-width="160">
        <template #default="scope">
          <div class="route-name">
            <span class="name">{{ scope.row.name }}</span>
            <span class="title">{{ scope.row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" prop="category" width="90" />
      <el-table-column label="时长" width="100">
        <template #default="scope">{{ scope.row.duration_hours }} 小时</template>
      </el-table-column>
      <el-table-column label="距离" width="100">
        <template #default="scope">{{ scope.row.distance_km }} km</template>
      </el-table-column>
      <el-table-column label="难度" width="90">
        <template #default="scope">
          <el-tag size="large">{{ scope.row.difficulty }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最佳季节" prop="best_season" width="100" />
      <el-table-column label="推荐" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.is_featured ? 'danger' : 'info'" size="large">
            {{ scope.row.is_featured ? '推荐' : '普通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="large">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="站点数" width="90">
        <template #default="scope">
          <el-tag type="primary" size="large">{{ scope.row.stops?.length || 0 }}</el-tag>
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

  <!-- 新增/编辑线路对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogMode === 'create' ? '新增线路' : '编辑线路'"
    width="760px"
    :close-on-click-modal="false"
    top="4vh"
    destroy-on-close
  >
    <el-form ref="formRef" :model="routeForm" :rules="formRules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="线路名称" prop="name">
            <el-input v-model="routeForm.name" placeholder="请输入线路名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="线路标题" prop="title">
            <el-input v-model="routeForm.title" placeholder="请输入线路标题" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="分类" prop="category">
            <el-select v-model="routeForm.category" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最佳季节">
            <el-input v-model="routeForm.best_season" placeholder="如：春秋" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="时长(小时)">
            <el-input-number v-model="routeForm.duration_hours" :min="0" :max="240" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="距离(km)">
            <el-input-number v-model="routeForm.distance_km" :min="0" :max="10000" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="难度">
            <el-select v-model="routeForm.difficulty" style="width: 100%">
              <el-option
                v-for="item in difficultyOptions"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="推荐">
            <el-switch
              v-model="routeForm.is_featured"
              active-text="推荐"
              inactive-text="普通"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-select v-model="routeForm.status" style="width: 100%">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="封面图片">
        <el-input v-model="routeForm.cover_image" placeholder="请输入封面图片 URL" />
      </el-form-item>
      <el-form-item label="线路描述">
        <el-input
          v-model="routeForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入线路描述"
        />
      </el-form-item>

      <!-- 站点编辑区 -->
      <el-form-item label="途经站点">
        <div class="stops-editor">
          <div
            v-for="(stop, index) in routeForm.stops"
            :key="index"
            class="stop-card"
          >
            <div class="stop-head">
              <span class="stop-no">站点 {{ stop.order_index || index + 1 }}</span>
              <div class="stop-actions">
                <el-button size="small" :disabled="index === 0" @click="moveStopUp(index)">
                  上移
                </el-button>
                <el-button size="small" :disabled="index === routeForm.stops.length - 1" @click="moveStopDown(index)">
                  下移
                </el-button>
                <el-button size="small" type="danger" plain @click="removeStop(index)">
                  删除
                </el-button>
              </div>
            </div>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="站点名称">
                  <el-input v-model="stop.name" placeholder="请输入站点名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="站点类型">
                  <el-select v-model="stop.type" style="width: 100%">
                    <el-option
                      v-for="item in stopTypeOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="时段">
                  <el-input v-model="stop.time_slot" placeholder="如：09:00-10:00" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="停留分钟">
                  <el-input-number
                    v-model="stop.duration_minutes"
                    :min="0"
                    :max="1440"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="位置">
              <el-input v-model="stop.location" placeholder="请输入站点位置" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input v-model="stop.description" type="textarea" :rows="2" placeholder="请输入站点说明" />
            </el-form-item>
          </div>
          <el-button type="primary" plain @click="addStop">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>
            添加站点
          </el-button>
        </div>
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

.route-name {
  display: flex;
  flex-direction: column;
}

.route-name .name {
  font-weight: 600;
}

.route-name .title {
  color: #909399;
  font-size: 12px;
}

.stops-editor {
  width: 100%;
}

.stop-card {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px 16px 0;
  margin-bottom: 12px;
  background: #fafafa;
}

.stop-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stop-no {
  font-weight: 600;
  color: #409eff;
}
</style>
