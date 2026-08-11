<script setup>
import GovLogo from '@/components/gov/GovLogo.vue'
import GovLeftNav from '@/components/gov/GovLeftNav.vue'
import { adminTokenStore } from '@/stores/token'
import { ElMessageBox } from 'element-plus'
import router from '@/router'

const tokenStore = adminTokenStore()

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      tokenStore.clearStore()
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<template>
  <div class="gov-layout">
    <!-- 左侧导航 -->
    <div class="gov-side">
      <GovLogo />
      <GovLeftNav />
    </div>
    <!-- 右侧主区域 -->
    <div class="gov-main">
      <div class="gov-topbar">
        <div class="gov-topbar-title">🏛️ 政府监管平台</div>
        <div class="gov-topbar-user">
          <span>欢迎，政府管理员</span>
          <el-button type="danger" plain size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
      <div class="gov-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/gov.css');
</style>
