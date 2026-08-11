<script setup>
import FarmerLogo from '@/components/farmer/FarmerLogo.vue'
import FarmerLeftNav from '@/components/farmer/FarmerLeftNav.vue'
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
  <div class="farmer-layout">
    <!-- 左侧导航 -->
    <div class="farmer-side">
      <FarmerLogo />
      <FarmerLeftNav />
    </div>
    <!-- 右侧主区域 -->
    <div class="farmer-main">
      <div class="farmer-topbar">
        <div class="farmer-topbar-title">🌾 农户工作台</div>
        <div class="farmer-topbar-user">
          <span>欢迎，农户</span>
          <el-button type="danger" plain size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
      <div class="farmer-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('/src/assets/css/farmer.css');
</style>
