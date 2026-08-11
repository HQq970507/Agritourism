<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import {
  getFarmerProfileConfig,
  updateFarmerProfileConfig
} from '@/common/interfaces/farmer.interface'
import BreadCrumb from '@/components/BreadCrumb.vue'

const loading = ref(false)
const saving = ref(false)

const profile = ref({})
const formRef = ref()
const editForm = ref({
  farmName: '',
  qualification: '',
  phone: ''
})

const rules = {
  farmName: [{ required: true, message: '请输入农场名称', trigger: 'blur' }],
  qualification: [{ required: true, message: '请输入资质证号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const getProfile = async () => {
  loading.value = true
  try {
    const res = await requestWithRetry(getFarmerProfileConfig())
    profile.value = res.data.data || {}
    editForm.value = {
      farmName: profile.value.farm_name || '',
      qualification: profile.value.qualification || '',
      phone: profile.value.phone || ''
    }
  } catch (error) {
    ElMessage.error('获取个人资料失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const saveProfile = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const res = await requestWithRetry(updateFarmerProfileConfig(editForm.value))
      ElMessage.success(res.data.message || '资料已更新')
      getProfile()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '更新失败')
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  getProfile()
})
</script>

<template>
  <div v-loading="loading" class="farmer-page">
    <BreadCrumb>
      <template #one> 个人资料 </template>
      <template #two> 资料管理 </template>
    </BreadCrumb>

    <el-row :gutter="20">
      <!-- 账户信息 -->
      <el-col :xs="24" :md="8">
        <el-card class="farmer-card">
          <h3 class="farmer-toolbar-title">账户信息</h3>
          <div class="profile-info">
            <div class="profile-avatar">🌾</div>
            <ul class="profile-list">
              <li><span class="profile-label">账号</span>{{ profile.username || '—' }}</li>
              <li><span class="profile-label">角色</span>农户</li>
              <li>
                <span class="profile-label">状态</span>
                <el-tag :type="profile.status === 'active' ? 'success' : 'info'">
                  {{ profile.status === 'active' ? '正常' : profile.status || '—' }}
                </el-tag>
              </li>
              <li><span class="profile-label">农场名称</span>{{ profile.farm_name || '—' }}</li>
              <li><span class="profile-label">资质证号</span>{{ profile.qualification || '—' }}</li>
              <li><span class="profile-label">手机号</span>{{ profile.phone || '—' }}</li>
            </ul>
          </div>
        </el-card>
      </el-col>

      <!-- 编辑表单 -->
      <el-col :xs="24" :md="16">
        <el-card class="farmer-card">
          <h3 class="farmer-toolbar-title">编辑资料</h3>
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="rules"
            label-width="90px"
            style="max-width: 480px"
          >
            <el-form-item label="农场名称" prop="farmName">
              <el-input v-model="editForm.farmName" placeholder="请输入农场名称" />
            </el-form-item>
            <el-form-item label="资质证号" prop="qualification">
              <el-input v-model="editForm.qualification" placeholder="请输入资质证号" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="editForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveProfile(formRef)"
                >保存修改</el-button
              >
              <el-button @click="getProfile">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');

.profile-info {
  margin-top: 12px;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border-radius: 50%;
  margin: 0 auto 20px;
}

.profile-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.profile-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
  color: #333;
  font-size: 14px;
}

.profile-list li:last-child {
  border-bottom: none;
}

.profile-label {
  color: #909399;
}
</style>
