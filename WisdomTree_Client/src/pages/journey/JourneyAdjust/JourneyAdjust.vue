<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  journeyRequest,
  normalizeJourney,
  stopTypeMeta,
  moveStop,
  removeStop,
  buildAdjustPayload,
} from "../../../common/journey";

// ====================== 路由参数 ======================
const journeyId = ref("");

// ====================== 数据状态 ======================
const journeyName = ref("");
const stops = ref([]);
const firstLoading = ref(true);
const saving = ref(false);

// ====================== 数据获取 ======================
/**
 * 加载我的旅程站点列表
 * 接口：GET /travel/journeys/:id
 */
const loadJourney = async () => {
  if (!journeyId.value) return;
  try {
    const data = await journeyRequest({
      url: `/travel/journeys/${journeyId.value}`,
      method: "GET",
    });
    const journey = normalizeJourney(data || {});
    journeyName.value = journey.name;
    stops.value = journey.stops;
  } catch (e) {
    uni.showToast({ title: e.message || "加载失败，请重试", icon: "none" });
  } finally {
    firstLoading.value = false;
  }
};

// ====================== 调整操作 ======================
const moveUp = (index) => {
  stops.value = moveStop(stops.value, index, -1);
};

const moveDown = (index) => {
  stops.value = moveStop(stops.value, index, 1);
};

const removeAt = (index) => {
  stops.value = removeStop(stops.value, index);
};

// ====================== 保存调整 ======================
/**
 * 整体提交新站点顺序
 * 接口：POST /travel/journeys/:id/adjust  body: { stops: [...] }
 */
const save = async () => {
  if (saving.value) return;
  if (stops.value.length === 0) {
    uni.showToast({ title: "旅程至少保留一个站点", icon: "none" });
    return;
  }
  saving.value = true;
  uni.showLoading({ title: "保存中" });
  try {
    await journeyRequest({
      url: `/travel/journeys/${journeyId.value}/adjust`,
      method: "POST",
      data: { stops: buildAdjustPayload(stops.value) },
    });
    uni.hideLoading();
    uni.showToast({ title: "调整已保存", icon: "success" });
    setTimeout(() => {
      // 返回详情页，详情页 onShow 会重新拉取
      uni.navigateBack();
    }, 600);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || "保存失败，请重试", icon: "none" });
  } finally {
    saving.value = false;
  }
};

// ====================== 展示辅助 ======================
const typeMeta = (type) => stopTypeMeta(type);

// ====================== 生命周期 ======================
onLoad((option) => {
  journeyId.value = option.id || "";
  loadJourney();
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">调整旅程</text>
      <text class="adopt-hero-sub" v-if="journeyName">
        正在调整「{{ journeyName }}」的站点顺序
      </text>
      <text class="adopt-hero-sub" v-else>拖拽顺序已改为上下移动按钮</text>
    </view>

    <!-- 加载态 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <!-- 空态 -->
    <view v-else-if="stops.length === 0" class="adopt-empty">
      <image
        class="adopt-empty-img"
        src="https://s21.ax1x.com/2024/09/15/pAuyMHe.png"
      />
      <text class="adopt-empty-text">该旅程暂未配置站点</text>
    </view>

    <!-- 站点列表 -->
    <template v-else>
      <view class="journey-tabs journey-adjust-note">
        <view class="journey-tab active">共 {{ stops.length }} 个站点</view>
      </view>

      <view style="padding-top: 8rpx">
        <view
          v-for="(stop, index) in stops"
          :key="stop.id || index"
          class="adopt-card journey-adjust-item"
        >
          <view class="journey-adjust-index">{{ index + 1 }}</view>
          <view class="journey-adjust-info">
            <text class="journey-adjust-name">{{ stop.name }}</text>
            <text class="journey-adjust-sub">
              {{ typeMeta(stop.type).text }}
              <template v-if="stop.timeSlot"> · {{ stop.timeSlot }}</template>
            </text>
          </view>
          <view class="journey-adjust-ops">
            <view
              class="journey-mini-btn"
              :class="{ 'adopt-btn-disabled': index === 0 }"
              @click="moveUp(index)"
            >
              ↑
            </view>
            <view
              class="journey-mini-btn"
              :class="{ 'adopt-btn-disabled': index === stops.length - 1 }"
              @click="moveDown(index)"
            >
              ↓
            </view>
            <view class="journey-mini-btn danger" @click="removeAt(index)">
              删除
            </view>
          </view>
        </view>
      </view>

      <view class="adopt-bottom-space"></view>
    </template>

    <!-- 底部保存 -->
    <view class="journey-footer" v-if="!firstLoading && stops.length > 0">
      <view
        class="adopt-btn adopt-btn-primary"
        :class="{ 'adopt-btn-disabled': saving }"
        @click="save"
      >
        {{ saving ? "保存中..." : "保存调整" }}
      </view>
    </view>
  </view>
</template>

<style scoped>
@import url("../../../static/css/adoption.css");
@import url("../../../static/css/journey.css");

/* 站点计数条 */
.journey-adjust-note {
  margin-bottom: 24rpx;
}
</style>

<style scoped>
/* =====================================================
   贺兰青 · 毛玻璃改造（与首页 index.vue 统一设计语言）
   ===================================================== */
.adopt-page {
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
  --glass-border-teal: rgba(95, 180, 180, 0.5);
  --shadow-deep: 0 16rpx 40rpx rgba(6, 24, 24, 0.35);

  /* 深色渐变背景（纯 CSS，无外链图） */
  background:
    radial-gradient(130% 80% at 50% 0%, rgba(95, 180, 180, 0.16) 0%, transparent 46%),
    radial-gradient(100% 60% at 100% 100%, rgba(26, 92, 92, 0.55) 0%, transparent 60%),
    linear-gradient(180deg, #103131 0%, #0b2626 55%, #081c1c 100%);
  color: var(--heli-text);
}

/* 顶部横幅：贺兰青渐变 */
.adopt-hero {
  background: linear-gradient(135deg, rgba(47, 143, 143, 0.9), rgba(26, 92, 92, 0.92));
  border: 2rpx solid var(--glass-border-teal);
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.adopt-hero-sub {
  color: rgba(245, 249, 249, 0.85);
}

/* 通用卡片：半透明毛玻璃 */
.adopt-card {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 28rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

/* 站点计数条：毛玻璃胶囊 */
.journey-tabs {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.journey-tab.active {
  background: var(--glass-strong);
  border: 2rpx solid var(--glass-border-teal);
  color: #bfe5e0;
  box-shadow: 0 6rpx 16rpx rgba(6, 24, 24, 0.35), inset 0 1rpx 0 rgba(255, 255, 255, 0.14);
}

/* 调整站点序号：贺兰青 */
.journey-adjust-index {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  box-shadow: 0 8rpx 18rpx rgba(6, 24, 24, 0.3);
}

.journey-adjust-name {
  color: var(--heli-text);
}

.journey-adjust-sub {
  color: var(--heli-muted);
}

/* 调整小按钮：玻璃 */
.journey-mini-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
  color: var(--heli-text);
}

.journey-mini-btn.danger {
  background: rgba(207, 108, 105, 0.2);
  border-color: rgba(242, 179, 175, 0.35);
  color: #f2b3af;
}

/* 底部吸底操作栏：毛玻璃 */
.journey-footer {
  background: rgba(10, 30, 30, 0.72);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -6rpx 24rpx rgba(6, 24, 24, 0.35);
}

/* 主按钮：贺兰青 */
.adopt-btn-primary {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  box-shadow: 0 10rpx 24rpx rgba(6, 24, 24, 0.4), 0 0 0 2rpx rgba(95, 180, 180, 0.25);
}

.adopt-loading {
  color: var(--heli-muted);
}

.adopt-empty-text {
  color: var(--heli-muted);
}
</style>
