<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { requestWithRetry } from '@/common/interfaces/request'
import router from '@/router'
import SearchInput from '../SearchInput.vue'
import { searchUserConfig } from '@/common/interfaces/User.interface'
import { searchProductCategoryConfig } from '@/common/interfaces/Product.interface'
import { updateOrderConfig } from '@/common/interfaces/Order.interface'

// 表单实例
const ruleFormRef = ref()

// 表单数据
const form = ref({
  orderId: 0,
  orderNo: '',
  buyerName: '',
  contact: '',
  address: '',
  area: '',
  productName: '',
  status: '',
  remark: ''
})

// 父传子
const props = defineProps({
  orderInfo: Object
})

// 监视父组件传来的订单信息
watch(
  () => props.orderInfo,
  (newValue) => {
    if (newValue) {
      form.value = {
        orderId: newValue.orderId || 0,
        orderNo: newValue.orderNo || '',
        buyerName: newValue.buyerName || '',
        contact: newValue.contact || '',
        address: newValue.address || '',
        area: newValue.area || '',
        productName: newValue.productName || '',
        status: newValue.status || '',
        remark: newValue.remark || ''
      }
    }
  },
  { immediate: true }
)

// 订单状态选项
const statusOptions = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

// 表单规则
const rules = ref({
  buyerName: [{ required: true, message: '请填写买家名称', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择订单状态', trigger: 'blur' }],
  remark: [{ max: 200, message: '字数不超过200字', trigger: 'blur' }]
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
  ElMessageBox.confirm('确定要修改订单信息吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      updateOrder()
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}

// 提交后端
const updateOrder = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const res = await requestWithRetry(updateOrderConfig(form.value))
    // 重置表单
    ruleFormRef.value.resetFields()
    // 关闭加载
    loading.close()
    ElMessage.success(`${res.data.message}`)
    // 跳转
    router.push('/adminOrder')
  } catch (error) {
    loading.close()
    console.log(error)
    ElMessage.error(`${error.response.data.message}`)
  }
}
</script>

<template>
  <el-tag size="large" style="margin: 2rem 0 0 0">订单号：{{ form.orderNo }}</el-tag>
  <el-form
    ref="ruleFormRef"
    :rules="rules"
    :model="form"
    label-width="auto"
    label-position="top"
    size="large"
    style="max-width: 60rem; margin-top: 2rem"
  >
    <el-form-item label="买家名称" prop="buyerName">
      <SearchInput
        v-model="form.buyerName"
        :placeholder="'请输入买家名称'"
        :search-method="searchUserConfig"
      />
    </el-form-item>
    <el-form-item label="联系电话" prop="contact">
      <el-input v-model="form.contact" placeholder="输入联系电话" />
    </el-form-item>
    <el-form-item label="收货地址" prop="address">
      <el-input v-model="form.address" placeholder="输入收货地址" />
    </el-form-item>
    <el-form-item label="所在地区" prop="area">
      <el-input v-model="form.area" placeholder="输入所在地区" />
    </el-form-item>
    <el-form-item label="产品名称" prop="productName">
      <SearchInput
        v-model="form.productName"
        :placeholder="'请输入产品名称'"
        :search-method="searchProductCategoryConfig"
      />
    </el-form-item>
    <el-alert
      title="请输入已有的产品和用户"
      :closable="false"
      style="margin: 2rem 0"
      type="warning"
      show-icon
    />
    <el-form-item label="订单状态" prop="status">
      <el-select v-model="form.status" placeholder="选择订单状态">
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="订单备注" prop="remark">
      <el-input v-model="form.remark" type="textarea" placeholder="输入订单备注" :autosize="{ minRows: 3 }" />
    </el-form-item>

    <el-button type="primary" @click="submitForm(ruleFormRef)">修改订单信息</el-button>
  </el-form>
</template>

<style scoped></style>
