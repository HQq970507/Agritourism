<script setup>
import BreadCrumb from '@/components/BreadCrumb.vue'
import CategoryForm from '@/components/category/CategoryForm.vue'
</script>

<template>
  <!-- 面包屑组件 -->
  <BreadCrumb>
    <template #one> 分类中心 </template>
    <template #two> 新增分类 </template>
  </BreadCrumb>
  <!-- 表单组件 -->
  <CategoryForm :is-edit="false" />
</template>

<style scoped></style>
