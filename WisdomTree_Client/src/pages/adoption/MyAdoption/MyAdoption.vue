<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onShow, onPullDownRefresh } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  adoptionRequest,
  pickList,
  normalizeAdoption,
  STATUS_LABELS,
} from "../../../common/adoption";

// ====================== 数据状态 ======================
const adoptions = ref([]); // 我的认领列表
const firstLoading = ref(true);

// ====================== 数据获取 ======================
/**
 * 获取我的认领列表
 * 接口：GET /adoption/my
 */
const loadAdoptions = async () => {
  try {
    const data = await adoptionRequest({ url: "/adoption/my", method: "GET" });
    adoptions.value = pickList(data).map((item) => normalizeAdoption(item));
  } catch (e) {
    uni.showToast({
      title: e.message || "加载失败，请重试",
      icon: "none",
    });
  } finally {
    firstLoading.value = false;
    uni.stopPullDownRefresh();
  }
};

// ====================== 跳转 ======================
/**
 * 查看认领详情
 */
const toDetail = (item) => {
  uni.navigateTo({
    url: `/pages/adoption/AdoptionDetail/AdoptionDetail?id=${item.id}`,
  });
};

/**
 * 去认领产品
 */
const toAdoptionList = () => {
  uni.navigateTo({
    url: "/pages/adoption/AdoptionList/AdoptionList",
  });
};

// 状态文案兜底
const statusText = (item) => STATUS_LABELS[item.status] || item.status || "生长中";

// ====================== 生命周期 ======================
// onShow 每次进入刷新，保证认领/写日记后列表最新
onShow(() => {
  loadAdoptions();
});

onPullDownRefresh(() => {
  loadAdoptions();
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">我的认领</text>
      <text class="adopt-hero-sub">你认领的每一份产品，都值得被认真记录</text>
      <text class="adopt-hero-tag" @click="toAdoptionList">去认领 →</text>
    </view>

    <!-- 首次加载 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <!-- 空态 -->
    <view v-else-if="adoptions.length === 0" class="adopt-empty">
      <image
        class="adopt-empty-img"
        src="https://s21.ax1x.com/2024/09/15/pAuyMHe.png"
      />
      <text class="adopt-empty-text">暂无认领，去挑选一份农产品吧</text>
      <view class="adopt-empty-btn adopt-btn adopt-btn-primary" @click="toAdoptionList">
        去认领
      </view>
    </view>

    <!-- 认领列表 -->
    <view v-else class="adopt-list">
      <view
        v-for="item in adoptions"
        :key="item.id"
        class="adopt-card adopt-item"
        @click="toDetail(item)"
      >
        <!-- 产品图 -->
        <view class="adopt-item-img-box">
          <image
            class="adopt-item-img"
            :src="item.avatar"
            mode="aspectFill"
            lazy-load
          />
        </view>

        <!-- 产品信息 -->
        <view class="adopt-item-info">
          <view class="adopt-item-top">
            <text class="adopt-item-name">{{ item.productName }}</text>
            <text class="adopt-badge adopt-badge-green">{{ statusText(item) }}</text>
          </view>
          <text class="adopt-item-code" v-if="item.traceCode">
            溯源码：{{ item.traceCode }}
          </text>
          <text class="adopt-item-adoption-id" v-if="item.adoptionId">
            认领编号：{{ item.adoptionId }}
          </text>
          <view class="adopt-item-meta">
            <text class="adopt-item-meta-item">日记 {{ item.diaryCount }} 篇</text>
            <text class="adopt-item-meta-item" v-if="item.area">区域：{{ item.area }}</text>
          </view>
        </view>

        <!-- 箭头 -->
        <text class="adopt-item-arrow">›</text>
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

/* 加载 / 空态文字 */
.adopt-loading {
  color: var(--heli-muted);
}

.adopt-empty-text {
  color: var(--heli-muted);
}

.adopt-list {
  padding: 28rpx 24rpx 40rpx;
}

.adopt-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.adopt-item-img-box {
  width: 160rpx;
  height: 160rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.adopt-item-img {
  width: 100%;
  height: 100%;
}

.adopt-item-info {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;
}

.adopt-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.adopt-item-name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--heli-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 16rpx;
}

.adopt-item-code {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--heli-muted);
}

.adopt-item-adoption-id {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--heli-muted);
}

.adopt-item-meta {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.adopt-item-meta-item {
  font-size: 22rpx;
  color: var(--heli-light);
  margin-right: 24rpx;
}

.adopt-item-arrow {
  margin-left: 12rpx;
  font-size: 44rpx;
  color: rgba(245, 249, 249, 0.45);
  font-weight: 700;
}
</style>
