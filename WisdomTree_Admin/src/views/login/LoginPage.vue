<script setup>
import LoginForm from '@/components/login/LoginForm.vue'
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
              <h1>智慧农旅管理系统</h1>
            </div>
            <LoginForm />
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
