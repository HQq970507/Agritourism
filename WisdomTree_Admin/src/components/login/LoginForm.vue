<script setup>
import { ref } from 'vue'
import { BaseUrl } from '@/common/BaseUrl'
import axios from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import { adminTokenStore } from '@/stores/token'
import router from '@/router'

const tokenStore = adminTokenStore()

const ruleFormRef = ref()

const ruleForm = ref({
  username: '',
  password: ''
})

// biaodan
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 提交表单验证
const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log('submit!')
      postLogin()
    } else {
      console.log('error submit!', fields)
    }
  })
}

// 后端处理
const postLogin = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await axios({
      method: 'post',
      url: `${BaseUrl}/admin/login`,
      data: ruleForm.value
    })
    // 存token
    tokenStore.saveToken(res.data.data.accessToken)
    tokenStore.saveRefreshToken(res.data.data.refreshToken)
    tokenStore.saveRole(res.data.data.role)
    loading.close()
    // 按角色路由跳转：农户进农户端，政府进政府端，管理员进后台
    if (res.data.data.role === 'farmer') {
      router.push('/farmerIndex')
    } else if (res.data.data.role === 'government') {
      router.push('/govIndex')
    } else {
      router.push('/admindataChart/index')
    }
    ElMessage.success('登录成功')
  } catch (error) {
    loading.close()
    ElMessage.error(error.response.data.message)
  }
}

// 前往农户注册
const goRegister = () => {
  router.push('/farmerRegister')
}
</script>

<template>
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
        placeholder="请输入密码"
        show-password
      />
    </el-form-item>

    <div style="width: 100%; text-align: center">
      <el-button type="primary" size="large" @click="submitForm(ruleFormRef)">登录</el-button>
    </div>
    <div class="register-link">
      <el-button link type="primary" @click="goRegister">没有账号？农户注册</el-button>
    </div>
  </el-form>
</template>

<style scoped>
.demo-ruleForm {
  width: 80%;
}

.register-link {
  width: 100%;
  text-align: center;
  margin-top: 0.5rem;
}
</style>
