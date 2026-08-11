<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import TabBar from "../../../components/TabBar.vue";
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import {
  farmRequest,
  FACILITY_TABS,
  FACILITY_TYPE_META,
  NX_CITIES,
  NX_MAP_VIEW,
  NX_REGIONS,
  facilityTypeMeta,
  normalizeFacility,
  pickFacilityList,
  projectCity,
  projectPoint,
  regionFill,
  regionPathData,
  regionsPathData,
} from "../../../common/farm";

// ====================== 地图静态资源 ======================
const mapView = NX_MAP_VIEW; // { width: 100, height: 123 } 真实经纬比例
const regions = NX_REGIONS; // 五市真实边界（GeoJSON 提取，含飞地/岛屿）
const regionPath = (r) => regionPathData(r, mapView.width, mapView.height);
const regionColor = (r) => regionFill(r.adcode);
const outlinePath = regionsPathData(regions, mapView.width, mapView.height);
const cities = NX_CITIES.map(projectCity);

// ====================== 状态 ======================
const activeType = ref(""); // "" = 全部
const facilities = ref([]);
const firstLoading = ref(true);
const loadFailed = ref(false);
const selected = ref(null); // 当前选中的设施（详情卡）

// ====================== 地图缩放 / 平移（类百度地图） ======================
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const scale = ref(1);
const tx = ref(0); // 平移 X（rpx）
const ty = ref(0); // 平移 Y（rpx）

// 交互状态
let startDist = 0;
let startScale = 1;
let startTx = 0;
let startTy = 0;
let startPX = 0; // 手势起点（画布内坐标 px）
let startPY = 0;
let dragging = false;
let pointerCount = 0;
// 手势中心点（用于以手势中心为原点缩放）
let gestureCX = 0;
let gestureCY = 0;

const clampScale = (v) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

// 取触摸/鼠标点（统一封装）
const pts = (e) => {
  if (e.touches && e.touches.length > 0) return e.touches;
  if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches;
  if (e.clientX !== undefined) return [e];
  return [];
};

const dist = (t) => {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const mid = (t) => ({
  x: (t[0].clientX + t[1].clientX) / 2,
  y: (t[0].clientY + t[1].clientY) / 2,
});

// 以指定屏幕点为中心缩放：保持该点对应的地图位置不变
const zoomAt = (newScale, cx, cy) => {
  const canvas = document.querySelector('.farm-map-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  // 地图中心（画布中心）+ 当前平移，换算屏幕点在地图内容坐标系中的位置
  const baseW = rect.width;
  const baseH = rect.height;
  // 内容坐标（相对画布中心，px）
  const px = cx - (rect.left + rect.width / 2) - tx.value / 2;
  const py = cy - (rect.top + rect.height / 2) - ty.value / 2;
  const oldS = scale.value;
  // 新的平移使该点仍位于相同屏幕位置
  tx.value = (cx - rect.left - rect.width / 2 - (px * newScale) / oldS) * 2;
  ty.value = (cy - rect.top - rect.height / 2 - (py * newScale) / oldS) * 2;
  scale.value = newScale;
};

const applyZoom = (factor) => {
  const canvas = document.querySelector('.farm-map-canvas');
  const rect = canvas ? canvas.getBoundingClientRect() : null;
  const cx = rect ? rect.left + rect.width / 2 : 0;
  const cy = rect ? rect.top + rect.height / 2 : 0;
  zoomAt(clampScale(scale.value * factor), cx, cy);
};

const zoomIn = () => applyZoom(1.4);
const zoomOut = () => applyZoom(1 / 1.4);
const resetView = () => {
  scale.value = 1;
  tx.value = 0;
  ty.value = 0;
};

// ===== 手势开始 =====
const onMapStart = (e) => {
  if (e.cancelable) e.preventDefault();
  const t = pts(e);
  pointerCount = t.length;
  startScale = scale.value;
  startTx = tx.value;
  startTy = ty.value;
  if (t.length >= 2) {
    startDist = dist(t);
    const m = mid(t);
    gestureCX = m.x;
    gestureCY = m.y;
    dragging = false;
  } else if (t.length === 1) {
    startPX = t[0].clientX;
    startPY = t[0].clientY;
    dragging = true;
  }
};

// ===== 手势移动 =====
const onMapMove = (e) => {
  const t = pts(e);
  if (t.length >= 2) {
    // 双指：捏合缩放（以两指中心为原点）+ 双指平移
    const d = dist(t);
    if (startDist > 0) {
      const m = mid(t);
      const newScale = clampScale(startScale * (d / startDist));
      // 结合双指中心移动进行平移
      tx.value = startTx + (m.x - gestureCX) * 2;
      ty.value = startTy + (m.y - gestureCY) * 2;
      zoomAt(newScale, m.x, m.y);
    }
  } else if (t.length === 1 && dragging) {
    // 单指/鼠标：平移 1:1 跟随
    tx.value = startTx + (t[0].clientX - startPX) * 2;
    ty.value = startTy + (t[0].clientY - startPY) * 2;
  }
};

// ===== 手势结束 =====
const onMapEnd = (e) => {
  const t = e.touches || [];
  pointerCount = t.length;
  if (t.length < 2) {
    dragging = false;
  }
};

// 过滤后的标记（服务端已按 type 过滤，客户端再做一次兜底）
const markers = computed(() =>
  facilities.value
    .filter((f) => !activeType.value || f.type === activeType.value)
    .map((f) => ({ ...f, meta: facilityTypeMeta(f.type) }))
);// 当前筛选文案（空态提示用）
const activeLabel = computed(
  () => FACILITY_TABS.find((t) => t.type === activeType.value)?.label || "全部"
);

// 每个类型的点位计数（chips 角标）
const countByType = (type) =>
  facilities.value.filter((f) => f.type === type).length;

// ====================== 数据获取 ======================
// 接口：GET /travel/facilities/map?type=采摘园（type 可选）
const loadFacilities = async () => {
  firstLoading.value = true;
  loadFailed.value = false;
  try {
    const data = await farmRequest({
      url: "/travel/facilities/map",
      method: "GET",
      data: activeType.value ? { type: activeType.value } : {},
    });
    facilities.value = pickFacilityList(data).map(normalizeFacility);
  } catch (e) {
    loadFailed.value = true;
    uni.showToast({ title: e.message || "加载失败，请重试", icon: "none" });
  } finally {
    firstLoading.value = false;
  }
};

const switchType = (type) => {
  if (type === activeType.value) return;
  selected.value = null;
  activeType.value = type;
  loadFacilities();
};

// ====================== 交互 ======================
// 标记点定位（文旅部风格：简单小点直接投影定位）
// 标记在可缩放层内，需反向缩放保持视觉大小恒定（地图放大时点不膨胀）
const markerStyle = (f) => {
  const p = projectPoint(f.longitude, f.latitude);
  const inv = 1 / scale.value;
  return {
    left: `${(p.x * 100).toFixed(2)}%`,
    top: `${(p.y * 100).toFixed(2)}%`,
    transform: `translate(-50%, -50%) scale(${inv.toFixed(3)})`,
  };
};

const cityStyle = (city) => ({
  left: `${(city.x * 100).toFixed(2)}%`,
  top: `${(city.y * 100).toFixed(2)}%`,
});

const toDetail = (f) => {
  selected.value = f;
};

const closeDetail = () => {
  selected.value = null;
};

const callPhone = (contact) => {
  if (!contact) {
    uni.showToast({ title: "暂无联系电话", icon: "none" });
    return;
  }
  uni.makePhoneCall({
    phoneNumber: String(contact).replace(/[^\d+\-]/g, ""),
    fail: () => {},
  });
};

// 类型徽标 class（复用 journey 类型配色）
const badgeCls = (f) => `journey-type-${f.meta.cls}`;

// 图例数据（仅展示地图上可能出现的类型）
const legend = FACILITY_TABS.filter((t) => t.type).map((t) => ({
  ...t,
  color: FACILITY_TYPE_META[t.type]?.color || "#8a5ac9",
}));

// ====================== 生命周期 ======================
onShow(() => {
  loadFacilities();
});
</script>

<template>
  <view class="adopt-page farm-map-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="farm-map-hero">
      <text class="farm-map-hero-title">采摘园地图</text>
      <text class="farm-map-hero-sub">宁夏全区 · 采摘园 / 农家乐 / 民宿 / 研学基地</text>
    </view>

    <!-- 地图主体 -->
    <view class="farm-map-body">
      <view v-if="firstLoading" class="adopt-loading">地图加载中...</view>

      <!-- #ifdef H5 -->
      <view
        v-else
        class="farm-map-canvas"
        :class="{ dragging }"
        @touchstart="onMapStart"
        @touchmove.stop.prevent="onMapMove"
        @touchend="onMapEnd"
        @touchcancel="onMapEnd"
        @mousedown="onMapStart"
        @mousemove="onMapMove"
        @mouseup="onMapEnd"
        @mouseleave="onMapEnd"
      >
        <!-- 拖拽提示（缩放后可拖动查看） -->
        <view v-if="scale > 1" class="farm-map-drag-hint">👆 拖动地图查看</view>
        <!-- 可缩放/平移内容层 -->
        <view
          class="farm-map-scalable"
          :style="{
            transform: `translate(${tx}rpx, ${ty}rpx) scale(${scale})`,
          }"
        >
          <!-- 宁夏真实省界（五市 GeoJSON 轮廓，分市着色） -->
          <svg
            class="farm-map-svg"
            :viewBox="`0 0 ${mapView.width} ${mapView.height}`"
            preserveAspectRatio="none"
          >
            <path
              v-for="region in regions"
              :key="region.adcode || region.name"
              :d="regionPath(region)"
              class="farm-map-region"
              fill-rule="evenodd"
              :style="{ fill: regionColor(region) }"
            />
            <path :d="outlinePath" class="farm-map-outline" />
          </svg>

          <!-- 五市标注 -->
          <view
            v-for="city in cities"
            :key="city.name"
            class="farm-map-city"
            :style="cityStyle(city)"
          >
            <view class="farm-map-city-dot"></view>
            <text class="farm-map-city-name">{{ city.name }}</text>
          </view>

          <!-- 设施标记点 -->
          <view
            v-for="f in markers"
            :key="f.id || f.name"
            class="farm-map-marker"
            :class="{ active: selected && selected.id === f.id }"
            :style="markerStyle(f)"
            @click.stop="toDetail(f)"
          >
            <view
              class="farm-map-marker-dot"
              :style="{ background: f.meta.color, color: f.meta.color }"
            ></view>
          </view>
        </view>

        <!-- 缩放控件（右下角） -->
        <view class="farm-map-zoom-ctrl">
          <view class="farm-map-zoom-btn" @click.stop="zoomIn">＋</view>
          <view class="farm-map-zoom-btn" @click.stop="zoomOut">－</view>
          <view
            v-if="scale > 1 || tx !== 0 || ty !== 0"
            class="farm-map-zoom-btn farm-map-zoom-reset"
            @click.stop="resetView"
          >⟳</view>
        </view>

        <!-- 空态 -->
        <view v-if="markers.length === 0" class="farm-map-empty">
          <text class="farm-map-empty-emoji">🗺️</text>
          <text class="farm-map-empty-text">
            暂无{{ activeLabel }}点位{{ loadFailed ? "，加载失败" : "" }}
          </text>
          <view v-if="loadFailed" class="adopt-btn adopt-btn-primary farm-map-empty-btn" @click="loadFacilities">
            重新加载
          </view>
        </view>
      </view>
      <!-- #endif -->

      <!-- #ifndef H5 -->
      <!-- 小程序端降级：设施列表模式（复用 markers 数据，点击看详情） -->
      <view v-else class="farm-map-list">
        <view
          v-for="f in markers"
          :key="f.id || f.name"
          class="farm-map-list-card"
          @click="toDetail(f)"
        >
          <view class="farm-map-list-card-head">
            <text class="farm-map-list-card-name">{{ f.name }}</text>
            <text class="adopt-badge" :class="badgeCls(f)">{{ f.type }}</text>
          </view>
          <view class="farm-map-list-card-rows">
            <view class="farm-map-list-card-row">
              <text class="label">📍 所在城市</text>
              <text class="value">{{ f.city || "宁夏" }}</text>
            </view>
            <view class="farm-map-list-card-row">
              <text class="label">🕐 开放时间</text>
              <text class="value">{{ f.openingHours || "以商家实际营业为准" }}</text>
            </view>
          </view>
        </view>

        <!-- 空态 -->
        <view v-if="markers.length === 0" class="farm-map-list-empty">
          <text class="farm-map-empty-emoji">🗺️</text>
          <text class="farm-map-empty-text">
            暂无{{ activeLabel }}点位{{ loadFailed ? "，加载失败" : "" }}
          </text>
          <view v-if="loadFailed" class="adopt-btn adopt-btn-primary farm-map-empty-btn" @click="loadFacilities">
            重新加载
          </view>
        </view>
      </view>
      <!-- #endif -->

      <!-- 图例 -->
      <view class="farm-map-legend">
        <view v-for="item in legend" :key="item.type" class="farm-map-legend-item">
          <view class="farm-map-legend-dot" :style="{ background: item.color }"></view>
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 底部类型筛选 chips -->
    <view class="farm-map-chips">
      <view
        v-for="tab in FACILITY_TABS"
        :key="tab.type || 'all'"
        class="farm-map-chip"
        :class="{ active: activeType === tab.type }"
        @click="switchType(tab.type)"
      >
        <view
          v-if="tab.type"
          class="farm-map-chip-dot"
          :style="{ background: FACILITY_TYPE_META[tab.type].color }"
        ></view>
        <text>{{ tab.label }}</text>
        <text v-if="tab.type" class="farm-map-chip-count">{{ countByType(tab.type) }}</text>
      </view>
    </view>

    <!-- 设施详情卡（底部抽屉） -->
    <view v-if="selected" class="farm-map-mask" @click="closeDetail">
      <view class="farm-map-sheet" @click.stop>
        <view class="farm-map-sheet-head">
          <view class="farm-map-sheet-name-wrap">
            <text class="farm-map-sheet-name">{{ selected.name }}</text>
            <text class="adopt-badge" :class="badgeCls(selected)">{{ selected.type }}</text>
          </view>
          <text class="farm-map-sheet-close" @click="closeDetail">✕</text>
        </view>

        <view class="farm-map-sheet-rows">
          <view class="farm-map-sheet-row">
            <text class="label">📍 所在城市</text>
            <text class="value">{{ selected.city || "宁夏" }}</text>
          </view>
          <view class="farm-map-sheet-row">
            <text class="label">🕐 开放时间</text>
            <text class="value">{{ selected.openingHours || "以商家实际营业为准" }}</text>
          </view>
          <view class="farm-map-sheet-row" @click="callPhone(selected.contact)">
            <text class="label">📞 联系电话</text>
            <text class="value link">{{ selected.contact || "暂无" }}</text>
          </view>
        </view>

        <text class="farm-map-sheet-desc">
          {{ selected.description || "暂无详细介绍，欢迎到店体验" }}
        </text>
      </view>
    </view>
  </view>

  <TabBar role="user" />
</template>

<style scoped>
@import url("../../../static/css/adoption.css");
@import url("../../../static/css/journey.css");
@import url("../../../static/css/farm.css");

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

/* ===== 与 fixed TabBar（约 155rpx 高）共存调整 ===== */

/* 内容底部留白：TabBar(155rpx) + 吸底 chips(约 100rpx) + 呼吸余量 */
.farm-map-page {
  padding-bottom: 280rpx;
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
.farm-map-hero {
  background: linear-gradient(135deg, rgba(26, 92, 92, 0.9) 0%, rgba(47, 143, 143, 0.85) 100%);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(95, 180, 180, 0.4);
  box-shadow: 0 16rpx 40rpx rgba(6, 24, 24, 0.4);
}

.farm-map-hero-title {
  color: var(--heli-text);
}

.farm-map-hero-sub {
  color: var(--heli-muted);
}

/* 主按钮（贺兰青） */
.adopt-btn-primary {
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  color: #fff;
  border: 2rpx solid rgba(95, 180, 180, 0.45);
  box-shadow: 0 12rpx 28rpx rgba(6, 24, 24, 0.35);
}

/* 加载态 */
.adopt-loading {
  color: var(--heli-muted);
}

/* 地图画布（深青底 + 贺兰青点阵） */
.farm-map-canvas {
  background: radial-gradient(rgba(95, 180, 180, 0.22) 3rpx, transparent 4rpx) 0 0 / 36rpx 36rpx,
    linear-gradient(180deg, rgba(20, 58, 58, 0.9) 0%, rgba(10, 36, 36, 0.95) 100%);
  border: 2rpx solid rgba(95, 180, 180, 0.25);
  box-shadow: inset 0 0 60rpx rgba(6, 24, 24, 0.45),
    0 10rpx 30rpx rgba(6, 24, 24, 0.35);
}

/* 宁夏 SVG 轮廓改贺兰青 */
.farm-map-outline {
  stroke: #2f8f8f;
  opacity: 0.95;
}

/* 分市边界保留白色细缝，叠加深青描边 */
.farm-map-region {
  stroke: rgba(245, 249, 249, 0.85);
}

/* 城市标注 */
.farm-map-city-dot {
  border-color: #2f8f8f;
  box-shadow: 0 0 0 4rpx rgba(47, 143, 143, 0.25);
}

.farm-map-city-name {
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
  color: var(--heli-text);
}

/* 空态 */
.farm-map-empty {
  background: rgba(8, 28, 28, 0.72);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

.farm-map-empty-text {
  color: var(--heli-muted);
}

/* 图例 */
.farm-map-legend-item {
  color: var(--heli-muted);
}

/* 小程序端降级：设施列表卡片 */
.farm-map-list-card {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.farm-map-list-card:active {
  background: rgba(255, 255, 255, 0.12);
}

.farm-map-list-card-name {
  color: var(--heli-text);
}

.farm-map-list-card-rows {
  background: rgba(255, 255, 255, 0.06);
}

.farm-map-list-card-row .label {
  color: var(--heli-muted);
}

.farm-map-list-card-row .value {
  color: var(--heli-text);
}

/* 底部筛选 chips（毛玻璃深青） */
.farm-map-chips {
  background: rgba(13, 40, 40, 0.82);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 2rpx solid rgba(95, 180, 180, 0.25);
  box-shadow: 0 -6rpx 24rpx rgba(6, 24, 24, 0.35);
  /* 底部筛选 chips 上移，让出 TabBar 位置，避免被遮挡 */
  bottom: 155rpx;
}

.farm-map-chip {
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  color: var(--heli-muted);
}

.farm-map-chip.active {
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  color: #fff;
  font-weight: 600;
  border-color: transparent;
  box-shadow: 0 8rpx 20rpx rgba(6, 24, 24, 0.4);
}

.farm-map-chip-count {
  color: var(--heli-muted);
}

/* 详情卡抽屉（毛玻璃深青） */
.farm-map-mask {
  background: rgba(6, 24, 24, 0.6);
  /* 详情卡抽屉：置于 TabBar 之上，遮罩全屏覆盖 */
  z-index: 1000;
}

.farm-map-sheet {
  background: rgba(15, 46, 46, 0.9);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  border-top: 2rpx solid rgba(95, 180, 180, 0.3);
  box-shadow: 0 -10rpx 40rpx rgba(6, 24, 24, 0.4);
}

.farm-map-sheet-name {
  color: var(--heli-text);
}

.farm-map-sheet-close {
  color: var(--heli-muted);
}

.farm-map-sheet-rows {
  background: rgba(255, 255, 255, 0.06);
}

.farm-map-sheet-row .label {
  color: var(--heli-muted);
}

.farm-map-sheet-row .value {
  color: var(--heli-text);
}

.farm-map-sheet-row .value.link {
  color: var(--heli-light);
}

.farm-map-sheet-desc {
  background: rgba(255, 255, 255, 0.06);
  color: var(--heli-text);
}
</style>
