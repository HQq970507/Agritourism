<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  adoptionRequest,
  pickList,
  normalizeAdoption,
  normalizeDiary,
  STAGE_LABELS,
  STATUS_LABELS,
} from "../../../common/adoption";

// ====================== 路由参数 ======================
const adoptionId = ref("");

// ====================== 数据状态 ======================
const adoption = ref(null); // 认领信息（含溯源）
const trace = ref(null); // 溯源信息
const diaries = ref([]); // 日记列表
const firstLoading = ref(true);

// ====================== 数据获取 ======================
/**
 * 获取认领详情（含溯源信息）
 * 接口：GET /adoption/:id
 */
const loadAdoption = async () => {
  if (!adoptionId.value) return;
  try {
    const data = await adoptionRequest({
      url: `/adoption/${adoptionId.value}`,
      method: "GET",
    });
    // 认领主信息
    adoption.value = normalizeAdoption(data || {});
    // 溯源信息（兼容字段差异）
    trace.value =
      data?.traceability || data?.trace || data?.traceInfo || data?.ledger || null;
  } catch (e) {
    uni.showToast({ title: e.message || "加载失败，请重试", icon: "none" });
  }
};

/**
 * 获取生长日记列表
 * 接口：GET /adoption/:id/diary
 */
const loadDiaries = async () => {
  if (!adoptionId.value) return;
  try {
    const data = await adoptionRequest({
      url: `/adoption/${adoptionId.value}/diary`,
      method: "GET",
    });
    diaries.value = pickList(data).map((item) => normalizeDiary(item));
  } catch (e) {
    uni.showToast({ title: e.message || "日记加载失败", icon: "none" });
  } finally {
    firstLoading.value = false;
  }
};

const loadAll = () => {
  Promise.all([loadAdoption(), loadDiaries()]);
};

// ====================== 跳转 ======================
/**
 * 写生长日记
 */
const toWriteDiary = () => {
  uni.navigateTo({
    url: `/pages/adoption/AdoptionDiary/AdoptionDiary?adoptionId=${adoptionId.value}&productName=${encodeURIComponent(
      adoption.value?.productName || ""
    )}`,
  });
};

// ====================== 展示辅助 ======================
const stageText = (stage) => STAGE_LABELS[stage] || stage || "";
const statusText = () => {
  const item = adoption.value;
  if (!item) return "";
  return STATUS_LABELS[item.status] || item.status || "生长中";
};

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

// ====================== 生命周期 ======================
onLoad((option) => {
  adoptionId.value = option.id || "";
});

// onShow 每次进入刷新：写完日记返回时最新
onShow(() => {
  if (adoptionId.value) {
    firstLoading.value = true;
    loadAll();
  }
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 加载态 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <template v-else-if="adoption">
      <!-- 认领主卡片 -->
      <view class="adopt-hero detail-hero">
        <view class="detail-hero-left">
          <image
            class="detail-hero-img"
            :src="adoption.avatar"
            mode="aspectFill"
          />
        </view>
        <view class="detail-hero-right">
          <text class="adopt-hero-title detail-name">{{ adoption.productName }}</text>
          <text class="adopt-badge adopt-badge-gold detail-status">{{ statusText() }}</text>
          <text class="adopt-hero-sub detail-sub">
            {{ formatTime(adoption.adoptedAt) || "认领进行中" }} 认领
          </text>
        </view>
      </view>

      <!-- 认领信息 -->
      <view class="adopt-section-title">认领信息</view>
      <view class="adopt-card detail-info">
        <view class="detail-info-row">
          <text class="detail-info-label">昵称</text>
          <text class="detail-info-value">{{ adoption.nickname || "—" }}</text>
        </view>
        <view class="detail-info-row">
          <text class="detail-info-label">认领区域</text>
          <text class="detail-info-value">{{ adoption.area || "—" }}</text>
        </view>
        <view class="detail-info-row">
          <text class="detail-info-label">心愿</text>
          <text class="detail-info-value detail-wish">{{ adoption.wish || "—" }}</text>
        </view>
        <view class="detail-info-row">
          <text class="detail-info-label">日记数</text>
          <text class="detail-info-value">{{ adoption.diaryCount }} 篇</text>
        </view>
      </view>

      <!-- 溯源信息 -->
      <view class="adopt-section-title">溯源信息</view>
      <view class="adopt-card detail-info">
        <view class="detail-info-row">
          <text class="detail-info-label">溯源码</text>
          <text class="detail-info-value detail-code">
            {{ adoption.traceCode || trace?.trace_code || trace?.traceCode || "—" }}
          </text>
        </view>
        <view class="detail-info-row" v-if="trace?.stage">
          <text class="detail-info-label">当前环节</text>
          <text class="detail-info-value">{{ trace.stage }}</text>
        </view>
        <view class="detail-info-row" v-if="trace?.location">
          <text class="detail-info-label">产地</text>
          <text class="detail-info-value">{{ trace.location }}</text>
        </view>
        <view class="detail-info-row" v-if="trace?.description">
          <text class="detail-info-label">溯源描述</text>
          <text class="detail-info-value">{{ trace.description }}</text>
        </view>
      </view>

      <!-- 生长日记 -->
      <view class="adopt-section-title">生长日记</view>
      <view v-if="diaries.length === 0" class="adopt-card detail-diary-empty">
        <text class="detail-diary-empty-text">还没有生长日记，写下第一条记录吧</text>
      </view>
      <view v-else class="detail-diary-list">
        <view
          v-for="diary in diaries"
          :key="diary.id"
          class="adopt-card detail-diary-item"
        >
          <view class="detail-diary-head">
            <text class="adopt-badge adopt-badge-teal">{{ stageText(diary.stage) }}</text>
            <text class="detail-diary-date">{{ formatTime(diary.createdAt) }}</text>
          </view>
          <text class="detail-diary-desc">{{ diary.description }}</text>
          <view class="detail-diary-env" v-if="diary.temperature || diary.humidity">
            <text class="detail-diary-env-item" v-if="diary.temperature">
              温度 {{ diary.temperature }}
            </text>
            <text class="detail-diary-env-item" v-if="diary.humidity">
              湿度 {{ diary.humidity }}
            </text>
          </view>
        </view>
      </view>

      <!-- 底部占位（避开吸底按钮） -->
      <view class="adopt-bottom-space"></view>
    </template>

    <!-- 底部吸底按钮 -->
    <view class="detail-footer" v-if="!firstLoading">
      <view class="adopt-btn adopt-btn-primary" @click="toWriteDiary">
        写日记
      </view>
    </view>
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

/* 主按钮（贺兰青） */
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

/* 状态徽标（半透明贺兰青/金） */
.adopt-badge-green {
  background: rgba(47, 143, 143, 0.22);
  color: #bfe0de;
  border: 2rpx solid rgba(95, 180, 180, 0.35);
}

.adopt-badge-teal {
  background: rgba(95, 180, 180, 0.18);
  color: #bfe0de;
  border: 2rpx solid rgba(95, 180, 180, 0.35);
}

.adopt-badge-gold {
  background: rgba(212, 175, 55, 0.18);
  color: #e8c96a;
  border: 2rpx solid rgba(212, 175, 55, 0.4);
}

.adopt-badge-gray {
  background: rgba(255, 255, 255, 0.1);
  color: var(--heli-muted);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
}

/* 加载态文字 */
.adopt-loading {
  color: var(--heli-muted);
}

/* 区块标题 */
.adopt-section-title {
  display: flex;
  align-items: center;
  margin: 40rpx 24rpx 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--heli-text);
}

.adopt-section-title::before {
  content: "";
  width: 10rpx;
  height: 32rpx;
  margin-right: 16rpx;
  border-radius: 6rpx;
  background: var(--adopt-grad);
}

/* 认领主卡片 */
.detail-hero {
  display: flex;
  align-items: center;
}

.detail-hero-left {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.detail-hero-img {
  width: 150rpx;
  height: 150rpx;
  border-radius: 22rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.2);
}

.detail-hero-right {
  position: relative;
  z-index: 1;
  margin-left: 30rpx;
  flex: 1;
  min-width: 0;
}

.detail-name {
  display: block;
  font-size: 38rpx;
}

.detail-status {
  display: inline-block;
  margin-top: 16rpx;
}

.detail-sub {
  display: block;
  margin-top: 16rpx;
}

/* 信息卡片 */
.detail-info {
  margin: 0 24rpx;
  padding: 12rpx 32rpx;
}

.detail-info-row {
  display: flex;
  align-items: flex-start;
  padding: 24rpx 0;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.detail-info-row:last-child {
  border-bottom: none;
}

.detail-info-label {
  width: 150rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: var(--heli-muted);
}

.detail-info-value {
  flex: 1;
  font-size: 28rpx;
  color: var(--heli-text);
  word-break: break-all;
}

.detail-wish {
  color: var(--heli-light);
}

.detail-code {
  font-weight: 700;
  color: var(--heli-gold-soft);
  letter-spacing: 1rpx;
}

/* 日记 */
.detail-diary-empty {
  margin: 0 24rpx;
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
}

.detail-diary-empty-text {
  font-size: 26rpx;
  color: var(--heli-muted);
}

.detail-diary-list {
  padding: 0 24rpx;
}

.detail-diary-item {
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.detail-diary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-diary-date {
  font-size: 22rpx;
  color: var(--heli-muted);
}

.detail-diary-desc {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--heli-text);
}

.detail-diary-env {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.detail-diary-env-item {
  margin-right: 24rpx;
  font-size: 22rpx;
  color: var(--heli-light);
}

/* 底部吸底按钮（毛玻璃深青） */
.detail-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(13, 40, 40, 0.82);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 2rpx solid rgba(95, 180, 180, 0.25);
  box-shadow: 0 -6rpx 24rpx rgba(6, 24, 24, 0.35);
}
</style>
