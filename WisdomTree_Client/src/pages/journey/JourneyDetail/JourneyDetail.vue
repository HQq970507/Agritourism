<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  journeyRequest,
  normalizeJourney,
  stopTypeMeta,
  formatHours,
  formatDistance,
} from "../../../common/journey";

// ====================== 路由参数 ======================
const journeyId = ref("");
const source = ref("template"); // template | mine

// ====================== 数据状态 ======================
const journey = ref(null);
const firstLoading = ref(true);

// ====================== 数据获取 ======================
/**
 * 获取旅程详情（含站点）
 * 接口：GET /travel/journeys/:id
 */
const loadJourney = async () => {
  if (!journeyId.value) return;
  try {
    const data = await journeyRequest({
      url: `/travel/journeys/${journeyId.value}`,
      method: "GET",
    });
    journey.value = normalizeJourney(data || {}, {
      isTemplate: source.value === "template",
    });
  } catch (e) {
    uni.showToast({ title: e.message || "加载失败，请重试", icon: "none" });
  } finally {
    firstLoading.value = false;
  }
};

// ====================== 跳转 ======================
/**
 * 调整旅程（我的旅程）：进入调整页，保存后返回本页 onShow 自动刷新
 */
const toAdjust = () => {
  uni.navigateTo({
    url: `/pages/journey/JourneyAdjust/JourneyAdjust?id=${journeyId.value}`,
  });
};

/**
 * 写笔记占位（后续可跳 webview / 打开笔记编辑）
 */
const toNote = () => {
  uni.showToast({ title: "写笔记功能即将上线", icon: "none" });
};

/**
 * AI 帮我生成相似旅程：携带 hint 预填到 AI 生成页
 */
const toSimilarAI = () => {
  const hint = `帮我规划一个与「${journey.value?.name || ""}」类似的旅程，请给出详细行程安排`;
  uni.navigateTo({
    url: `/pages/journey/JourneyAI/JourneyAI?hint=${encodeURIComponent(hint)}`,
  });
};

// ====================== 预约 ======================
const reserveShow = ref(false);
const reserving = ref(false);
const reserveForm = ref({
  visitDate: "",
  partySize: "2",
  contactName: "",
  contactPhone: "",
  remark: "",
});

const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const onDateChange = (e) => {
  reserveForm.value.visitDate = e.detail.value;
};

/**
 * 提交预约
 * 接口：POST /travel/reserve  body: { routeId, visitDate, partySize, contactName, contactPhone, remark? }
 */
const submitReserve = async () => {
  const f = reserveForm.value;
  if (!f.visitDate) {
    uni.showToast({ title: "请选择游玩日期", icon: "none" });
    return;
  }
  if (!f.contactName.trim()) {
    uni.showToast({ title: "请填写联系人姓名", icon: "none" });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(f.contactPhone.trim())) {
    uni.showToast({ title: "请填写正确的手机号", icon: "none" });
    return;
  }
  if (reserving.value) return;
  reserving.value = true;
  uni.showLoading({ title: "预约中" });
  try {
    const body = {
      routeId: Number(journeyId.value),
      visitDate: f.visitDate,
      partySize: Number(f.partySize) || 1,
      contactName: f.contactName.trim(),
      contactPhone: f.contactPhone.trim(),
    };
    if (f.remark.trim()) body.remark = f.remark.trim();
    await journeyRequest({
      url: "/travel/reserve",
      method: "POST",
      data: body,
    });
    uni.hideLoading();
    uni.showToast({ title: "预约成功", icon: "success" });
    reserveShow.value = false;
    reserveForm.value.visitDate = "";
    reserveForm.value.contactName = "";
    reserveForm.value.contactPhone = "";
    reserveForm.value.remark = "";
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || "预约失败，请重试", icon: "none" });
  } finally {
    reserving.value = false;
  }
};

// ====================== 展示辅助 ======================
const typeMeta = (type) => stopTypeMeta(type);

// ====================== 生命周期 ======================
onLoad((option) => {
  journeyId.value = option.id || "";
  source.value = option.source || "template";
});

// onShow 每次进入刷新：调整页保存返回后站点顺序最新
onShow(() => {
  if (journeyId.value) {
    firstLoading.value = true;
    loadJourney();
  }
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 加载态 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <template v-else-if="journey">
      <!-- 封面横幅 -->
      <view class="adopt-hero detail-hero">
        <view class="detail-hero-left">
          <image
            v-if="journey.coverImage"
            class="detail-hero-img"
            :src="journey.coverImage"
            mode="aspectFill"
          />
          <view v-else class="detail-hero-img detail-hero-img-empty">🌾</view>
        </view>
        <view class="detail-hero-right">
          <text class="adopt-hero-title detail-name">{{ journey.name }}</text>
          <text class="adopt-badge adopt-badge-gold detail-status">
            {{ journey.category }}
          </text>
          <text class="adopt-hero-sub detail-sub" v-if="journey.description">
            {{ journey.description }}
          </text>
        </view>
      </view>

      <!-- 旅程信息 -->
      <view class="adopt-section-title">旅程信息</view>
      <view class="adopt-card journey-info">
        <view class="journey-info-row">
          <text class="journey-info-label">分类</text>
          <text class="journey-info-value">{{ journey.category || "—" }}</text>
        </view>
        <view class="journey-info-row">
          <text class="journey-info-label">时长</text>
          <text class="journey-info-value">
            {{ formatHours(journey.durationHours) || "—" }}
          </text>
        </view>
        <view class="journey-info-row">
          <text class="journey-info-label">距离</text>
          <text class="journey-info-value">
            {{ formatDistance(journey.distanceKm) || "—" }}
          </text>
        </view>
        <view class="journey-info-row">
          <text class="journey-info-label">难度</text>
          <text class="journey-info-value">{{ journey.difficulty || "—" }}</text>
        </view>
        <view class="journey-info-row">
          <text class="journey-info-label">最佳季节</text>
          <text class="journey-info-value">
            {{ journey.bestSeason || "—" }}
          </text>
        </view>
      </view>

      <!-- 站点时间线 -->
      <view class="adopt-section-title">行程安排（{{ journey.stops.length }} 站）</view>
      <view v-if="journey.stops.length === 0" class="adopt-card journey-tl-empty">
        该旅程暂未配置站点
      </view>
      <view v-else class="journey-tl">
        <view
          v-for="(stop, index) in journey.stops"
          :key="stop.id || index"
          class="journey-tl-item"
        >
          <view class="journey-tl-time">
            {{ stop.timeSlot || `第 ${index + 1} 站` }}
          </view>
          <view class="journey-tl-rail">
            <view class="journey-tl-dot"></view>
          </view>
          <view class="journey-tl-content">
            <view class="journey-stop-head">
              <text class="journey-stop-name">{{ stop.name }}</text>
              <text
                class="journey-type-badge"
                :class="`journey-type-${typeMeta(stop.type).cls}`"
              >
                {{ typeMeta(stop.type).text }}
              </text>
            </view>
            <view class="journey-stop-meta">
              <text class="journey-stop-meta-item" v-if="stop.timeSlot">
                {{ stop.timeSlot }}
              </text>
              <text class="journey-stop-meta-item" v-if="stop.durationMinutes">
                停留 {{ stop.durationMinutes }} 分钟
              </text>
            </view>
            <text class="journey-stop-desc" v-if="stop.description">
              {{ stop.description }}
            </text>
            <text class="journey-stop-loc" v-if="stop.location">
              📍 {{ stop.location }}
            </text>
          </view>
        </view>
      </view>

      <!-- 底部占位（避开吸底按钮） -->
      <view class="adopt-bottom-space"></view>
    </template>

    <!-- 底部操作 -->
    <view class="journey-footer" v-if="!firstLoading && journey">
      <template v-if="source === 'template'">
        <view class="adopt-btn adopt-btn-ghost" @click="toSimilarAI">
          AI 帮我生成相似旅程
        </view>
        <view class="adopt-btn adopt-btn-primary" @click="reserveShow = true">
          预约
        </view>
      </template>
      <template v-else>
        <view class="adopt-btn adopt-btn-ghost" @click="toNote">写笔记</view>
        <view class="adopt-btn adopt-btn-primary" @click="toAdjust">
          调整旅程
        </view>
      </template>
    </view>

    <!-- 预约弹层 -->
    <view class="journey-mask" v-if="reserveShow" @click="reserveShow = false">
      <view class="journey-sheet" @click.stop>
        <view class="journey-sheet-title">预约「{{ journey?.name }}」</view>

        <view class="journey-sheet-field">
          <text class="journey-sheet-label">游玩日期</text>
          <picker
            mode="date"
            :start="today()"
            @change="onDateChange"
          >
            <view class="journey-sheet-input">
              {{ reserveForm.visitDate || "请选择游玩日期" }}
            </view>
          </picker>
        </view>

        <view class="journey-sheet-field">
          <text class="journey-sheet-label">游玩人数</text>
          <input
            class="journey-sheet-input"
            v-model="reserveForm.partySize"
            type="number"
            placeholder="如 2"
          />
        </view>

        <view class="journey-sheet-field">
          <text class="journey-sheet-label">联系人姓名</text>
          <input
            class="journey-sheet-input"
            v-model="reserveForm.contactName"
            placeholder="请输入姓名"
            maxlength="20"
          />
        </view>

        <view class="journey-sheet-field">
          <text class="journey-sheet-label">联系电话</text>
          <input
            class="journey-sheet-input"
            v-model="reserveForm.contactPhone"
            type="number"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </view>

        <view class="journey-sheet-field">
          <text class="journey-sheet-label">备注（选填）</text>
          <input
            class="journey-sheet-input"
            v-model="reserveForm.remark"
            placeholder="如：需要儿童座椅"
          />
        </view>

        <view class="journey-sheet-actions">
          <view class="adopt-btn adopt-btn-ghost" @click="reserveShow = false">
            取消
          </view>
          <view
            class="adopt-btn adopt-btn-primary"
            :class="{ 'adopt-btn-disabled': reserving }"
            @click="submitReserve"
          >
            {{ reserving ? "提交中..." : "确认预约" }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
@import url("../../../static/css/adoption.css");
@import url("../../../static/css/journey.css");

/* 封面横幅（复用 AdoptionDetail 的 detail-hero 结构） */
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

.detail-hero-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

.detail-hero-img {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
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

.adopt-section-title {
  color: var(--heli-text);
}

.adopt-section-title::before {
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  box-shadow: 0 0 12rpx rgba(95, 180, 180, 0.6);
}

/* 旅程信息 */
.journey-info-row {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.journey-info-label {
  color: var(--heli-muted);
}

.journey-info-value {
  color: var(--heli-text);
}

/* 站点时间轴 */
.journey-tl-rail::before {
  background: linear-gradient(180deg, rgba(95, 180, 180, 0.5), rgba(47, 143, 143, 0.35));
}

.journey-tl-dot {
  background: #5fb4b4;
  border-color: rgba(8, 28, 28, 0.7);
  box-shadow: 0 0 0 4rpx rgba(95, 180, 180, 0.25);
}

.journey-tl-time {
  color: var(--heli-muted);
}

.journey-tl-content {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 24rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.journey-stop-name {
  color: var(--heli-text);
}

.journey-stop-meta-item {
  color: #7fc9c9;
}

.journey-stop-desc {
  color: var(--heli-text);
}

.journey-stop-loc {
  color: var(--heli-muted);
}

.journey-tl-empty {
  color: var(--heli-muted);
}

/* 站点类型徽标：半透明玻璃配色 */
.journey-type-green {
  background: rgba(95, 180, 180, 0.2);
  color: #a5e3dd;
}

.journey-type-orange {
  background: rgba(214, 138, 60, 0.2);
  color: #f2c98a;
}

.journey-type-blue {
  background: rgba(96, 144, 216, 0.22);
  color: #a9c9f0;
}

.journey-type-purple {
  background: rgba(163, 124, 214, 0.22);
  color: #cdb8ee;
}

.journey-type-cyan {
  background: rgba(68, 192, 182, 0.2);
  color: #9ce3da;
}

.journey-type-yellow {
  background: rgba(212, 175, 55, 0.22);
  color: #f0dc9a;
}

/* 状态徽标：金色 */
.adopt-badge-gold {
  background: rgba(212, 175, 55, 0.18);
  border: 2rpx solid rgba(212, 175, 55, 0.4);
  color: #f0dc9a;
}

/* 主按钮：贺兰青 */
.adopt-btn-primary {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  box-shadow: 0 10rpx 24rpx rgba(6, 24, 24, 0.4), 0 0 0 2rpx rgba(95, 180, 180, 0.25);
}

.adopt-btn-ghost {
  background: var(--glass);
  border: 2rpx solid rgba(95, 180, 180, 0.5);
  color: #bfe5e0;
}

/* 底部吸底操作栏：毛玻璃 */
.journey-footer {
  background: rgba(10, 30, 30, 0.72);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -6rpx 24rpx rgba(6, 24, 24, 0.35);
}

/* 预约弹层 */
.journey-mask {
  background: rgba(8, 28, 28, 0.62);
}

.journey-sheet {
  background: var(--glass-strong);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  border: 2rpx solid var(--glass-border);
  border-bottom: none;
}

.journey-sheet-title {
  color: var(--heli-text);
}

.journey-sheet-label {
  color: var(--heli-text);
}

.journey-sheet-input {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.16);
  color: var(--heli-text);
}

.adopt-loading {
  color: var(--heli-muted);
}
</style>
