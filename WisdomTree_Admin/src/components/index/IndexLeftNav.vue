<script setup></script>

<template>
  <el-menu
    active-text-color="#ffd04b"
    background-color="#545c64"
    class="el-menu-vertical-demo"
    default-active="/admindataChart"
    text-color="#fff"
    router
  >
    <!-- 数据分析 -->
    <el-menu-item index="/admindataChart">
      <el-icon><TrendCharts /></el-icon>
      <span>可视化工作台</span>
    </el-menu-item>
    <!-- 产品中心 -->
    <el-sub-menu index="7">
      <template #title>
        <el-icon><Goods /></el-icon>
        <span>产品中心</span>
      </template>
      <el-menu-item-group title="农产品管理">
        <el-menu-item index="7-1" route="/adminProduct/productCenter">产品管理</el-menu-item>
        <el-menu-item index="7-2" route="/adminProduct/addProduct">新增产品</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 分类中心 -->
    <el-sub-menu index="8">
      <template #title>
        <el-icon><Collection /></el-icon>
        <span>分类中心</span>
      </template>
      <el-menu-item-group title="农作物分类">
        <el-menu-item index="8-1" route="/adminCategory/categoryCenter">分类管理</el-menu-item>
        <el-menu-item index="8-2" route="/adminCategory/addCategory">新增分类</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 订单中心 -->
    <el-sub-menu index="9">
      <template #title>
        <el-icon><List /></el-icon>
        <span>订单中心</span>
      </template>
      <el-menu-item-group title="订单管理">
        <el-menu-item index="9-1" route="/adminOrder/orderCenter">订单管理</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 活动中心 -->
    <el-sub-menu index="5">
      <template #title>
        <el-icon><Flag /></el-icon>
        <span>活动中心</span>
      </template>
      <el-menu-item-group title="农旅活动">
        <el-menu-item index="5-1" route="/adminActivity/activityCenter">活动管理</el-menu-item>
        <el-menu-item index="5-2" route="/adminActivity/addActivity">新增活动</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 文旅线路 -->
    <el-sub-menu index="10">
      <template #title>
        <el-icon><Guide /></el-icon>
        <span>文旅线路</span>
      </template>
      <el-menu-item-group title="文旅管理">
        <el-menu-item index="10-1" route="/adminTravel/routeCenter">线路管理</el-menu-item>
        <el-menu-item index="10-2" route="/adminTravel/facilityCenter">设施管理</el-menu-item>
        <el-menu-item index="10-3" route="/adminTravel/reservationCenter">预约管理</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 景区管理 -->
    <el-sub-menu index="11">
      <template #title>
        <el-icon><Location /></el-icon>
        <span>景区管理</span>
      </template>
      <el-menu-item-group title="景区管理">
        <el-menu-item index="11-1" route="/adminScenic/scenicCenter">景区管理</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
    <!-- 3D模型可视化 -->
    <el-sub-menu index="6">
      <template #title>
        <el-icon><Platform /></el-icon>
        <span>3D农场可视化</span>
      </template>
      <el-menu-item-group title="三维场景">
        <el-menu-item index="6-3" route="/adminFarm">农场3D模型</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
  </el-menu>
</template>

<style scoped>
.el-menu-vertical-demo {
  height: 100%;
}
</style>
