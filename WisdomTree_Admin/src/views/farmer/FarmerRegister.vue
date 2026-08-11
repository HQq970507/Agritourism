<script setup>
import { ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { farmerRegisterConfig } from '@/common/interfaces/farmer.interface'
import { requestWithRetry } from '@/common/interfaces/request'
import router from '@/router'

const ruleFormRef = ref()

const ruleForm = ref({
  username: '',
  password: '',
  farmName: '',
  qualification: '',
  phone: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  farmName: [{ required: true, message: '请输入农场名称', trigger: 'blur' }],
  qualification: [{ required: true, message: '请输入资质证号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      postRegister()
    }
  })
}

const postRegister = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '注册中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(farmerRegisterConfig(ruleForm.value))
    loading.close()
    if (res.data.code === 0) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(res.data.message || '注册失败')
    }
  } catch (error) {
    loading.close()
    ElMessage.error(error.response?.data?.message || '注册失败，请重试')
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="bg"></div>
  <div class="login-card">
    <el-row>
      <el-col :span="10" :offset="7">
        <el-card style="width: 100%" shadow="always">
          <div class="login-all">
            <div class="login-header">
              <div class="logo-placeholder">🌾</div>
              <h1>农户注册</h1>
            </div>
            <el-form
              ref="ruleFormRef"
              :model="ruleForm"
              status-icon
              :rules="rules"
              label-width="auto"
              class="demo-ruleForm"
            >
              <el-form-item label="账号" prop="username">
                <el-input v-model="ruleForm.username" size="large" clearable placeholder="请输入账号" />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="ruleForm.password"
                  size="large"
                  type="password"
                  placeholder="请输入密码（至少6位）"
                  show-password
                />
              </el-form-item>
              <el-form-item label="农场名称" prop="farmName">
                <el-input
                  v-model="ruleForm.farmName"
                  size="large"
                  clearable
                  placeholder="请输入农场名称"
                />
              </el-form-item>
              <el-form-item label="资质证号" prop="qualification">
                <el-input
                  v-model="ruleForm.qualification"
                  size="large"
                  clearable
                  placeholder="请输入资质证号"
                />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="ruleForm.phone"
                  size="large"
                  clearable
                  placeholder="请输入手机号"
                />
              </el-form-item>

              <div style="width: 100%; text-align: center">
                <el-button type="primary" size="large" @click="submitForm(ruleFormRef)"
                  >注册</el-button
                >
              </div>
              <div style="width: 100%; text-align: center; margin-top: 0.5rem">
                <el-button link type="primary" @click="goLogin">已有账号？返回登录</el-button>
              </div>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.logo-placeholder {
  width: 5rem;
  height: 5rem;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  margin: 0 auto;
}
</style>

<style scoped>
@import url('/src/assets/css/login.css');
</style>
