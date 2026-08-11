<script setup>
import BreadCrumb from '@/components/BreadCrumb.vue'
import ProductAddForm from '@/components/product/ProductAddForm.vue';
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 产品中心 </template>
    <template #two> 新增产品 </template>
  </BreadCrumb>
  <!-- 表单组件 -->
   <ProductAddForm />
</template>

<style scoped></style>
