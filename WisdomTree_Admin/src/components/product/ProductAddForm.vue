<script setup>
import { ref, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import UploadImage from '../UploadImage.vue'
import { addProductConfig } from '@/common/interfaces/Product.interface'
import SearchInput from '../SearchInput.vue'
import { searchProductCategoryConfig } from '@/common/interfaces/Product.interface'
import deleteFileConfig from '@/common/interfaces/DeleteFile.interface'

// 表单实例
const ruleFormRef = ref()

// 上传子组件实例
const uploadEl = ref()

// 上传图片的限制
const limit = ref(6)

// 需要删除的图片
const deleteImages = ref([])

// 表单数据
const form = ref({
  categoryName: '',
  price: 0,
  unit: '',
  mediaUrls: []
})

// 表单规则
const rules = ref({
  categoryName: [{ required: true, message: '请输入产品分类', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入产品价格', trigger: 'blur' },
    { type: 'number', message: '请输入数字', trigger: 'blur' }
  ],
  mediaUrls: [{ required: true, message: '请上传产品详情图片', trigger: 'blur' }]
})

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
  ElMessageBox.confirm('确定要增加新的产品吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      addProduct()
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 提交后端
const addProduct = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(addProductConfig(form.value))
    // 重置表单
    ruleFormRef.value.resetFields()
    uploadEl.value.clearFiles()
    // 关闭加载
    loading.close()
    ElMessage.success(`${res.data.message}`)
  } catch (error) {
    console.log(error)
    loading.close()
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
    <el-form-item label="产品分类" prop="categoryName">
      <SearchInput
        v-model="form.categoryName"
        :placeholder="'请输入产品分类名称'"
        :search-method="searchProductCategoryConfig"
      />
    </el-form-item>
    <el-alert
      title="请输入已有分类名称"
      :closable="false"
      style="margin: 2rem 0"
      type="warning"
      show-icon
    />
    <el-form-item label="产品价格" prop="price">
      <el-input-number v-model="form.price" :min="0" :precision="2" />
    </el-form-item>
    <el-form-item label="产品单位" prop="unit">
      <el-input v-model="form.unit" placeholder="斤/根/两" />
    </el-form-item>
    <el-form-item label="产品详情图片" prop="mediaUrls">
      <UploadImage
        ref="uploadEl"
        :limit-father="limit"
        @addSucess="
          (e) => {
            form.mediaUrls.push(e)
          }
        "
        @deleteSucess="
          (e) => {
            form.mediaUrls = e
          }
        "
        @deleteImgaes="
          (e) => {
            deleteImages.push(e)
          }
        "
      />
    </el-form-item>

    <el-button type="primary" @click="submitForm(ruleFormRef)">添加新产品</el-button>
  </el-form>
</template>

<style scoped></style>
