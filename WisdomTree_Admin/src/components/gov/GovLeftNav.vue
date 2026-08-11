<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 高亮当前二级路由对应的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/govIndex/dashboard')) return '/govIndex/dashboard'
  if (path.startsWith('/govIndex/farmers')) return '/govIndex/farmers'
  if (path.startsWith('/govIndex/products')) return '/govIndex/products'
  if (path.startsWith('/govIndex/activity')) return '/govIndex/activity'
  if (path.startsWith('/govIndex/report')) return '/govIndex/report'
  return '/govIndex/dashboard'
})
</script>

<template>
  <el-menu
    active-text-color="#ffd04b"
    background-color="#1e3a5f"
    class="el-menu-vertical-demo"
    :default-active="activeMenu"
    text-color="#fff"
    router
  >
    <!-- 数据驾驶舱 -->
    <el-menu-item index="/govIndex/dashboard">
      <el-icon><TrendCharts /></el-icon>
      <span>数据驾驶舱</span>
    </el-menu-item>
    <!-- 商户监管-农户 -->
    <el-menu-item index="/govIndex/farmers">
      <el-icon><User /></el-icon>
      <span>商户监管·农户</span>
    </el-menu-item>
    <!-- 商户监管-产品 -->
    <el-menu-item index="/govIndex/products">
      <el-icon><Goods /></el-icon>
      <span>商户监管·产品</span>
    </el-menu-item>
    <!-- 活动统筹 -->
    <el-menu-item index="/govIndex/activity">
      <el-icon><Calendar /></el-icon>
      <span>活动统筹</span>
    </el-menu-item>
    <!-- 区域报告 -->
    <el-menu-item index="/govIndex/report">
      <el-icon><Location /></el-icon>
      <span>区域报告</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.el-menu-vertical-demo {
  height: 100%;
}
</style>
