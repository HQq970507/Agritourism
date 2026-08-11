<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  adoptionRequest,
  AREA_OPTIONS,
  safeDecode,
} from "../../../common/adoption";

// ====================== 路由参数 ======================
const categoryId = ref("");
const productName = ref("");
const productAvatar = ref("");

// ====================== 表单数据 ======================
const formData = ref({
  nickname: "", // 昵称（可默认取用户信息）
  area: "", // 区域（可选）
  wish: "", // 心愿（可选）
});

const areaIndex = ref(-1);
const submitting = ref(false);

// ====================== 区域选择 ======================
const onAreaChange = (e) => {
  areaIndex.value = Number(e.detail.value);
  formData.value.area = AREA_OPTIONS[areaIndex.value];
};

// ====================== 默认昵称 ======================
/**
 * 获取用户信息，昵称默认取用户名
 */
const loadDefaultNickname = async () => {
  try {
    const data = await adoptionRequest({ url: "/user/getUserInfo" });
    formData.value.nickname = data?.username || data?.nickname || "";
  } catch (e) {
    // 拿不到用户信息不阻塞填写，保持空昵称
  }
};

// ====================== 提交认领 ======================
/**
 * 提交认领表单
 * 接口：POST /adoption  body: { categoryId, wish?, area?, nickname? }
 */
const submit = async () => {
  if (!categoryId.value) {
    uni.showToast({ title: "产品信息缺失，请返回重试", icon: "none" });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;

  const body = { categoryId: Number(categoryId.value) };
  if (formData.value.nickname.trim()) body.nickname = formData.value.nickname.trim();
  if (formData.value.area) body.area = formData.value.area;
  if (formData.value.wish.trim()) body.wish = formData.value.wish.trim();

  uni.showLoading({ title: "认领中" });
  try {
    await adoptionRequest({ url: "/adoption", method: "POST", data: body });
    uni.hideLoading();
    uni.showToast({ title: "认领成功", icon: "success" });
    setTimeout(() => {
      // 直接替换到我的认领页，避免返回表单
      uni.redirectTo({
        url: "/pages/adoption/MyAdoption/MyAdoption",
      });
    }, 600);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || "认领失败，请重试", icon: "none" });
  } finally {
    submitting.value = false;
  }
};

// ====================== 生命周期 ======================
onLoad((option) => {
  categoryId.value = option.categoryId || "";
  productName.value = safeDecode(option.productName) || "";
  productAvatar.value = safeDecode(option.avatar) || "";
  loadDefaultNickname();
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 认领产品概要 -->
    <view class="adopt-hero product-summary">
      <image
        class="summary-img"
        :src="productAvatar"
        mode="aspectFill"
      />
      <view class="summary-info">
        <text class="adopt-hero-title summary-name">{{ productName }}</text>
        <text class="adopt-hero-sub">填写信息，开启你的认领之旅</text>
      </view>
    </view>

    <!-- 认领表单 -->
    <view class="adopt-form adopt-card">
      <view class="adopt-form-title">认领信息</view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>昵称</text>
          <text class="optional">（默认取你的用户名，可修改）</text>
        </view>
        <input
          class="adopt-input"
          v-model="formData.nickname"
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>认领区域</text>
          <text class="optional">（选填）</text>
        </view>
        <picker :range="AREA_OPTIONS" @change="onAreaChange">
          <view class="adopt-picker">
            <text
              v-if="formData.area"
              class="adopt-picker-value"
            >{{ formData.area }}</text>
            <text v-else class="adopt-picker-placeholder">请选择认领区域</text>
            <text class="adopt-picker-arrow">▾</text>
          </view>
        </picker>
      </view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>我的心愿</text>
          <text class="optional">（选填）</text>
        </view>
        <textarea
          class="adopt-textarea"
          v-model="formData.wish"
          maxlength="60"
          placeholder="写下一句祝福，陪它一起长大（最多60字）"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="adopt-form-submit">
      <view
        class="adopt-btn adopt-btn-primary"
        :class="{ 'adopt-btn-disabled': submitting }"
        @click="submit"
      >
        {{ submitting ? "认领中..." : "确认认领" }}
      </view>
    </view>

    <view class="adopt-bottom-space"></view>
  </view>
</template>

<style scoped>
@import url("../../../static/css/adoption.css");

/* =====================================================
   贺兰青毛玻璃主题覆盖（与首页 index.vue 同一设计语言）
   ===================================================== */
.adopt-page {
  /* 贺兰青设计令牌 */
  --heli-blue: #2f8f8f;
  --heli-deep: #1a5c5c;
  --heli-light: #5fb4b4;
  --heli-gold: #d4af37;
  --heli-gold-soft: #e8c96a;
  --heli-text: #f5f9f9;
  --heli-muted: rgba(245, 249, 249, 0.72);
  --glass: rgba(255, 255, 255, 0.1);
  --glass-strong: rgba(255, 255, 255, 0.16);
  --glass-border: rgba(255, 255, 255, 0.14);
  --shadow-deep: 0 16rpx 40rpx rgba(6, 24, 24, 0.35);

  /* 旧绿色令牌 -> 贺兰青 */
  --adopt-green: #2f8f8f;
  --adopt-green-deep: #1a5c5c;
  --adopt-green-mid: #5fb4b4;
  --adopt-teal: #5fb4b4;
  --adopt-gold: #d4af37;
  --adopt-card: var(--glass);
  --adopt-line: rgba(255, 255, 255, 0.14);
  --adopt-text: #f5f9f9;
  --adopt-text-sub: rgba(245, 249, 249, 0.72);
  --adopt-radius: 24rpx;
  --adopt-shadow: 0 16rpx 40rpx rgba(6, 24, 24, 0.35);
  --adopt-grad: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  --adopt-danger: #ff8f7a;

  /* 深青渐变背景（纯 CSS） */
  background: radial-gradient(120% 60% at 90% -10%, rgba(95, 180, 180, 0.16) 0%, transparent 60%),
    radial-gradient(90% 50% at -10% 45%, rgba(212, 175, 55, 0.07) 0%, transparent 55%),
    linear-gradient(180deg, #0a2626 0%, #102f2f 55%, #0b2828 100%);
  color: var(--heli-text);
}

/* 毛玻璃卡片 */
.adopt-card {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

/* 顶部横幅 */
.adopt-hero {
  background: linear-gradient(135deg, rgba(26, 92, 92, 0.9) 0%, rgba(47, 143, 143, 0.85) 100%);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(95, 180, 180, 0.4);
  box-shadow: 0 16rpx 40rpx rgba(6, 24, 24, 0.4);
}

/* 主按钮（贺兰青，hover/active 深青） */
.adopt-btn-primary {
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  color: #fff;
  border: 2rpx solid rgba(95, 180, 180, 0.45);
  box-shadow: 0 12rpx 28rpx rgba(6, 24, 24, 0.35);
}

.adopt-btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #5fb4b4;
  border: 2rpx solid rgba(95, 180, 180, 0.45);
}

/* 表单容器 */
.adopt-form {
  margin: 24rpx;
  padding: 8rpx 32rpx 32rpx;
}

.adopt-form-title {
  padding: 28rpx 0 8rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--heli-text);
}

.adopt-form-row {
  padding: 26rpx 0;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.adopt-form-label {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
  font-size: 28rpx;
  color: var(--heli-text);
  font-weight: 600;
}

.adopt-form-label .required {
  margin-left: 8rpx;
  color: var(--adopt-danger);
}

.adopt-form-label .optional {
  margin-left: 12rpx;
  font-size: 22rpx;
  font-weight: 400;
  color: var(--heli-muted);
}

/* 输入框 / 文本域 / 选择器（深色毛玻璃 + 贺兰青描边） */
.adopt-input,
.adopt-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 18rpx 24rpx;
  font-size: 28rpx;
  color: var(--heli-text);
  background: rgba(255, 255, 255, 0.07);
  border: 2rpx solid rgba(95, 180, 180, 0.35);
  border-radius: 16rpx;
  transition: border-color 0.2s ease;
}

.adopt-input {
  min-height: 76rpx;
}

.adopt-textarea {
  min-height: 180rpx;
  line-height: 1.6;
}

.adopt-input::placeholder,
.adopt-textarea::placeholder {
  color: rgba(245, 249, 249, 0.4);
}

.adopt-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  min-height: 76rpx;
  padding: 18rpx 24rpx;
  background: rgba(255, 255, 255, 0.07);
  border: 2rpx solid rgba(95, 180, 180, 0.35);
  border-radius: 16rpx;
}

.adopt-picker-placeholder {
  color: rgba(245, 249, 249, 0.4);
  font-size: 28rpx;
}

.adopt-picker-arrow {
  color: var(--heli-muted);
  font-size: 30rpx;
}

.adopt-form-submit {
  margin: 48rpx 24rpx 0;
}

/* 顶部产品概要 */
.product-summary {
  display: flex;
  align-items: center;
}

.summary-img {
  position: relative;
  z-index: 1;
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.2);
}

.summary-info {
  position: relative;
  z-index: 1;
  margin-left: 28rpx;
  flex: 1;
}

.summary-name {
  display: block;
  font-size: 36rpx;
}

.adopt-picker-value {
  font-size: 28rpx;
  color: var(--heli-text);
}
</style>
