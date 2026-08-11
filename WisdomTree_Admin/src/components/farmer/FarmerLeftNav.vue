<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 高亮当前二级路由对应的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/farmerIndex/dashboard')) return '/farmerIndex/dashboard'
  if (path.startsWith('/farmerIndex/adoptions')) return '/farmerIndex/adoptions'
  if (path.startsWith('/farmerIndex/products')) return '/farmerIndex/products'
  if (path.startsWith('/farmerIndex/revenue')) return '/farmerIndex/revenue'
  if (path.startsWith('/farmerIndex/profile')) return '/farmerIndex/profile'
  return '/farmerIndex/dashboard'
})
</script>

<template>
  <el-menu
    active-text-color="#ffd04b"
    background-color="#545c64"
    class="el-menu-vertical-demo"
    :default-active="activeMenu"
    text-color="#fff"
    router
  >
    <!-- 数据看板 -->
    <el-menu-item index="/farmerIndex/dashboard">
      <el-icon><TrendCharts /></el-icon>
      <span>数据看板</span>
    </el-menu-item>
    <!-- 认领订单 -->
    <el-menu-item index="/farmerIndex/adoptions">
      <el-icon><List /></el-icon>
      <span>认领订单</span>
    </el-menu-item>
    <!-- 产品管理 -->
    <el-menu-item index="/farmerIndex/products">
      <el-icon><Goods /></el-icon>
      <span>产品管理</span>
    </el-menu-item>
    <!-- 收益中心 -->
    <el-menu-item index="/farmerIndex/revenue">
      <el-icon><Money /></el-icon>
      <span>收益中心</span>
    </el-menu-item>
    <!-- 个人资料 -->
    <el-menu-item index="/farmerIndex/profile">
      <el-icon><User /></el-icon>
      <span>个人资料</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.el-menu-vertical-demo {
  height: 100%;
}
</style>
