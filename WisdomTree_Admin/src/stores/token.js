// token的pinia模块
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const adminTokenStore = defineStore(
  'token',
  () => {
    // Accesstoken
    const Accesstoken = ref('')
    // RefreshToken
    const RefreshToken = ref('')
    // 角色（admin 管理员 / farmer 农户 / government 政府）
    const role = ref('')
    // 保存Accesstoken
    const saveToken = (token) => {
      Accesstoken.value = token
    }
    // 保存RefreshToken
    const saveRefreshToken = (token) => {
      RefreshToken.value = token
    }
    // 保存角色
    const saveRole = (userRole) => {
      role.value = userRole
    }
    // 清空登录态（退出登录）
    const clearStore = () => {
      Accesstoken.value = ''
      RefreshToken.value = ''
      role.value = ''
    }
    return {
      Accesstoken,
      RefreshToken,
      role,
      saveToken,
      saveRefreshToken,
      saveRole,
      clearStore
    }
  },
  // 持久化
  { persist: true }
)
