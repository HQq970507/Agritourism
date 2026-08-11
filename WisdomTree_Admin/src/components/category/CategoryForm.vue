<script setup>
import { ref, watch, onUnmounted } from 'vue'
import UploadImage from '../UploadImage.vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import { addCategoryConfig, updateCategoryConfig } from '@/common/interfaces/Category.interface'
import router from '@/router'
import deleteFileConfig from '@/common/interfaces/DeleteFile.interface'

const props = defineProps({
  categoryInfo: Object,
  categoryID: [Number, String],
  isEdit: {
    type: Boolean,
    default: false
  }
})

// 表单实例
const ruleFormRef = ref()

// 上传子组件实例
const uploadEl = ref()

// 上传图片的限制
const limit = ref(1)

// 需要删除的图片
const deleteImages = ref([])

// 表单数据
const form = ref({
  avatar: '',
  name: '',
  display_name: '',
  description: '',
  total: 1,
  remaining: 0,
  points_required: 0,
  price: 0,
  unit: ''
})

// 表单规则
const rules = ref({
  avatar: [{ required: true, message: '请上传分类图片', trigger: 'blur' }],
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入分类介绍', trigger: 'blur' }],
  total: [
    { required: true, message: '请输入总库存', trigger: 'blur' },
    { type: 'number', message: '请输入数字', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', message: '请输入数字', trigger: 'blur' }
  ]
})

// 编辑模式：监听父组件传来的分类信息
watch(
  () => props.categoryInfo,
  (newValue) => {
    if (newValue && props.isEdit) {
      form.value = { ...newValue }
      form.value.categoryId = newValue.id ?? newValue.categoryId ?? props.categoryID
      delete form.value.id
      delete form.value.categoryID
    }
  },
  { immediate: true }
)

// 提交表单
const submitForm = (formEl) => {
  if (!formEl) return
  formEl.validate((valid, fields) => {
    if (valid) {
      open()
    } else {
      console.log('error submit!', fields)
    }
  })
}

// 弹窗逻辑
const open = () => {
  const msg = props.isEdit ? '确定要修改分类信息吗?' : '确定要增加新的分类吗?'
  ElMessageBox.confirm(msg, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      props.isEdit ? updateCategory() : addCategory()
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 新增分类
const addCategory = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(addCategoryConfig(form.value))
    ruleFormRef.value.resetFields()
    uploadEl.value.clearFiles()
    loading.close()
    ElMessage.success(`${res.data.message}`)
  } catch (error) {
    loading.close()
    console.log(error)
    ElMessage.error(`${error.response.data.message}`)
  }
}

// 修改分类
const updateCategory = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(updateCategoryConfig(form.value))
    ruleFormRef.value.resetFields()
    uploadEl.value.clearFiles()
    loading.close()
    ElMessage.success(`${res.data.message}`)
    router.push('/adminCategory')
  } catch (error) {
    loading.close()
    console.log(error)
    ElMessage.error(`${error.response.data.message}`)
  }
}

// 取消挂载时 删除图片
onUnmounted(() => {
  deleteImages.value.forEach(async (item) => {
    await requestWithRetry(deleteFileConfig(item))
  })
})
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :rules="rules"
    :model="form"
    label-width="auto"
    label-position="top"
    size="large"
    style="max-width: 60rem; margin-top: 2rem"
  >
    <el-form-item label="分类名称" prop="name">
      <el-input v-model="form.name" placeholder="输入分类名称" />
    </el-form-item>
    <el-form-item label="品种名" prop="display_name">
      <el-input v-model="form.display_name" placeholder="输入品种名" />
    </el-form-item>
    <el-form-item label="价格" prop="price">
      <el-input-number v-model="form.price" :min="0" :step="0.1" />
    </el-form-item>
    <el-form-item label="单位" prop="unit">
      <el-input v-model="form.unit" placeholder="斤/根/两" />
    </el-form-item>
    <el-form-item label="总库存" prop="total">
      <el-input-number v-model="form.total" :min="1" />
    </el-form-item>
    <el-alert
      title="分类下可添加产品，请合理设置库存"
      :closable="false"
      style="margin: 2rem 0"
      type="warning"
      show-icon
    />
    <el-form-item label="分类介绍" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        placeholder="输入分类介绍"
        :autosize="{ minRows: 4 }"
      />
    </el-form-item>
    <el-form-item label="分类图片" prop="avatar">
      <UploadImage
        ref="uploadEl"
        :limit-father="limit"
        :oneImage="form.avatar"
        @addSucess="
          (e) => {
            form.avatar = e
          }
        "
        @deleteSucess="
          (e) => {
            form.avatar = e
          }
        "
        @deleteImgaes="
          (e) => {
            deleteImages.push(e)
          }
        "
      />
    </el-form-item>

    <el-button type="primary" @click="submitForm(ruleFormRef)">{{
      isEdit ? '修改分类信息' : '添加新分类'
    }}</el-button>
  </el-form>
</template>

<style scoped></style>
