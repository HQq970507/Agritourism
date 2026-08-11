<script setup></script>
<template>
  <div class="logo-box">
    <el-col class="logo-box">
      <div class="logo-placeholder">🌾</div>
      <h3 class="logo-title">智慧农旅 · 农户端</h3>
    </el-col>
  </div>
</template>
<style scoped>
.logo-box {
  margin: 0.4rem 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.logo-placeholder {
  width: 5rem;
  height: 5rem;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border-radius: 10px;
}

.logo-title {
  font-size: 1.8rem;
}
</style>
