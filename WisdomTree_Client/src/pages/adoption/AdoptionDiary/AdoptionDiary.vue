<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  adoptionRequest,
  STAGE_OPTIONS,
  safeDecode,
} from "../../../common/adoption";

// ====================== 路由参数 ======================
const adoptionId = ref("");
const productName = ref("");

// ====================== 表单数据 ======================
const formData = ref({
  stage: STAGE_OPTIONS[0].value, // 生长阶段（必选）
  description: "", // 描述（必填）
  temperature: "", // 温度（可选）
  humidity: "", // 湿度（可选）
  mediaUrl: "", // 媒体（可选，暂不接上传）
});

const stageIndex = ref(0);
const submitting = ref(false);

// ====================== 阶段选择 ======================
const onStageChange = (e) => {
  stageIndex.value = Number(e.detail.value);
  formData.value.stage = STAGE_OPTIONS[stageIndex.value].value;
};

// ====================== 提交日记 ======================
/**
 * 提交生长日记
 * 接口：POST /adoption/:id/diary  body: { stage, description, temperature?, humidity?, mediaUrl? }
 */
const submit = async () => {
  if (!adoptionId.value) {
    uni.showToast({ title: "认领信息缺失，请返回重试", icon: "none" });
    return;
  }
  if (!formData.value.description.trim()) {
    uni.showToast({ title: "请填写日记内容", icon: "none" });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;

  const body = {
    stage: formData.value.stage,
    description: formData.value.description.trim(),
  };
  if (formData.value.temperature.trim())
    body.temperature = formData.value.temperature.trim();
  if (formData.value.humidity.trim())
    body.humidity = formData.value.humidity.trim();
  if (formData.value.mediaUrl) body.mediaUrl = formData.value.mediaUrl;

  uni.showLoading({ title: "提交中" });
  try {
    await adoptionRequest({
      url: `/adoption/${adoptionId.value}/diary`,
      method: "POST",
      data: body,
    });
    uni.hideLoading();
    uni.showToast({ title: "记录成功", icon: "success" });
    setTimeout(() => {
      // 返回详情页，详情页 onShow 会重新拉取
      uni.navigateBack();
    }, 600);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || "提交失败，请重试", icon: "none" });
  } finally {
    submitting.value = false;
  }
};

// ====================== 生命周期 ======================
onLoad((option) => {
  adoptionId.value = option.adoptionId || "";
  productName.value = safeDecode(option.productName) || "";
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">写生长日记</text>
      <text class="adopt-hero-sub" v-if="productName">
        正在记录「{{ productName }}」的生长瞬间
      </text>
      <text class="adopt-hero-sub" v-else>记录它每一个生长的瞬间</text>
    </view>

    <!-- 日记表单 -->
    <view class="adopt-form adopt-card">
      <view class="adopt-form-title">日记内容</view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>生长阶段</text>
          <text class="required">*</text>
        </view>
        <picker :range="STAGE_OPTIONS" range-key="label" @change="onStageChange">
          <view class="adopt-picker">
            <text class="adopt-picker-value">{{ STAGE_OPTIONS[stageIndex].label }}</text>
            <text class="adopt-picker-arrow">▾</text>
          </view>
        </picker>
      </view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>描述</text>
          <text class="required">*</text>
        </view>
        <textarea
          class="adopt-textarea"
          v-model="formData.description"
          maxlength="300"
          placeholder="记录它今天的样子：叶片、长势、小惊喜……（最多300字）"
        />
      </view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>温度</text>
          <text class="optional">（选填，如 18-25°C）</text>
        </view>
        <input
          class="adopt-input"
          v-model="formData.temperature"
          placeholder="如 18-25°C"
          maxlength="20"
        />
      </view>

      <view class="adopt-form-row">
        <view class="adopt-form-label">
          <text>湿度</text>
          <text class="optional">（选填，如 60%）</text>
        </view>
        <input
          class="adopt-input"
          v-model="formData.humidity"
          placeholder="如 60%"
          maxlength="20"
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
        {{ submitting ? "提交中..." : "发布日记" }}
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

.adopt-picker-arrow {
  color: var(--heli-muted);
  font-size: 30rpx;
}

.adopt-form-submit {
  margin: 48rpx 24rpx 0;
}

.adopt-picker-value {
  font-size: 28rpx;
  color: var(--heli-text);
}
</style>
