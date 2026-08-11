<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import TabBar from "../../../components/TabBar.vue";
import { onLoad, onShow, onPullDownRefresh } from "@dcloudio/uni-app";
import { computed, reactive, ref } from "vue";
import {
  journeyRequest,
  pickJourneyList,
  normalizeJourney,
  formatHours,
  formatDistance,
} from "../../../common/journey";

// ====================== Tab 配置 ======================
const TABS = [
  { type: "template", label: "精选模板" },
  { type: "mine", label: "我的旅程" },
];

const activeIndex = ref(0);
const journeys = ref([]);
const firstLoading = ref(true);
// 封面加载失败的 id 集合（回退渐变占位）
const failedCovers = reactive(new Set());
// 季节直达模式：从首页季节推荐进入时按分类展示（如 采摘/研学/丰收/美食）
const seasonCategory = ref("");

const activeType = () => TABS[activeIndex.value].type;

const SEASON_META = {
  采摘: { title: "春 · 采摘季", sub: "草莓樱桃 鲜采鲜食，踏青赏花正当时" },
  研学: { title: "夏 · 亲子研学季", sub: "森林氧吧 · 荷塘湿地，田园野趣乐无穷" },
  丰收: { title: "秋 · 丰收季", sub: "葡萄枸杞 满园飘香，收获的喜悦" },
  美食: { title: "冬 · 年货季", sub: "滩羊八宝茶 乡味年礼，暖冬寻味" },
};

// 实时读取当前页 category 参数（computed，随路由参数变化自动更新）
const currentCategory = computed(() => {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.options?.category || "";
});

const displayCategory = computed(() => currentCategory.value || seasonCategory.value);
const heroTitle = computed(() => {
  const meta = SEASON_META[displayCategory.value];
  return meta ? meta.title : displayCategory.value ? `${displayCategory.value} · 主题线路` : "智慧旅程";
});
const heroSub = computed(() => {
  const meta = SEASON_META[displayCategory.value];
  return meta ? meta.sub : "平台精选线路 + AI 个性化规划，一站游遍乡村";
});

// ====================== 数据获取 ======================
/**
 * 加载旅程列表
 * 接口：GET /travel/journeys?type=template|mine（category 可选按分类）
 */
const loadJourneys = async () => {
  const type = activeType();
  firstLoading.value = true;
  try {
    // 「我的旅程」tab 展示全部用户旅程；「精选模板」tab 才应用季节分类过滤
    const query =
      type === "template" && displayCategory.value
        ? `/travel/journeys?type=${type}&category=${encodeURIComponent(displayCategory.value)}`
        : `/travel/journeys?type=${type}`;
    const data = await journeyRequest({
      url: query,
      method: "GET",
    });
    journeys.value = pickJourneyList(data).map((item) =>
      normalizeJourney(item, { isTemplate: type === "template" })
    );
  } catch (e) {
    uni.showToast({ title: e.message || "加载失败，请重试", icon: "none" });
  } finally {
    firstLoading.value = false;
    uni.stopPullDownRefresh();
  }
};

const switchTab = (index) => {
  if (index === activeIndex.value) return;
  activeIndex.value = index;
  loadJourneys();
};

// ====================== 跳转 ======================
const toDetail = (item) => {
  uni.navigateTo({
    url: `/pages/journey/JourneyDetail/JourneyDetail?id=${item.id}&source=${activeType()}`,
  });
};

const toAI = () => {
  uni.navigateTo({ url: "/pages/journey/JourneyAI/JourneyAI" });
};

// ====================== 生命周期 ======================
// 支持 JourneyList?type=mine 直达「我的旅程」tab（AI 保存后跳转）
// 支持 JourneyList?category=采摘 从首页季节推荐直达（按分类展示该季线路）
onLoad((option) => {
  if (option.type === "mine") activeIndex.value = 1;
});

// onShow 每次进入刷新，保证保存/调整后列表最新
onShow(() => {
  loadJourneys();
});

onPullDownRefresh(() => {
  loadJourneys();
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">{{ heroTitle }}</text>
      <text class="adopt-hero-sub">{{ heroSub }}</text>
      <text class="adopt-hero-tag" @click="toAI">AI 生成旅程 →</text>
    </view>

    <!-- Tab 切换 -->
    <view class="journey-tabs">
      <view
        v-for="(tab, index) in TABS"
        :key="tab.type"
        class="journey-tab"
        :class="{ active: index === activeIndex }"
        @click="switchTab(index)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 首次加载 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <!-- 空态 -->
    <view v-else-if="journeys.length === 0" class="adopt-empty">
      <image
        class="adopt-empty-img"
        src="https://s21.ax1x.com/2024/09/15/pAuyMHe.png"
      />
      <text class="adopt-empty-text">
        {{ seasonCategory.value ? `暂无「${seasonCategory.value}」主题线路` : activeIndex === 0 ? "暂无精选旅程，稍后再来看看" : "还没有我的旅程，去 AI 生成一个吧" }}
      </text>
      <view class="adopt-empty-btn adopt-btn adopt-btn-primary" @click="toAI">
        {{ seasonCategory.value ? "AI 生成旅程" : activeIndex === 0 ? "重新加载" : "AI 生成旅程" }}
      </view>
    </view>

    <!-- 旅程卡片列表 -->
    <view v-else>
      <view
        v-for="item in journeys"
        :key="item.id"
        class="adopt-card journey-card"
        @click="toDetail(item)"
      >
        <view class="journey-card-cover">
          <view
            v-if="!failedCovers.has(item.id) && item.coverImage"
            class="journey-card-cover-bg journey-card-grad"
          >
            <image
              class="journey-card-cover-img"
              :src="item.coverImage"
              mode="aspectFill"
              lazy-load
              @error="failedCovers.add(item.id)"
            />
          </view>
          <view v-else class="journey-card-cover-bg journey-card-grad">
            <text class="journey-cover-emoji">🌾</text>
          </view>
          <view class="journey-duration-pill">
            {{ formatHours(item.durationHours) || `${item.stops.length} 站` }}
          </view>
        </view>

        <view class="journey-card-body">
          <view class="journey-card-top">
            <text class="journey-card-name">{{ item.name }}</text>
            <text class="adopt-badge adopt-badge-green">{{ item.category }}</text>
          </view>
          <view class="journey-card-meta">
            <text class="journey-card-meta-item" v-if="formatHours(item.durationHours)">
              {{ formatHours(item.durationHours) }}
            </text>
            <text class="journey-card-meta-item">{{ item.stops.length }} 个站点</text>
            <text class="journey-card-meta-item" v-if="formatDistance(item.distanceKm)">
              {{ formatDistance(item.distanceKm) }}
            </text>
          </view>
          <text class="journey-card-desc">
            {{ item.description || "点击查看完整行程安排" }}
          </text>
        </view>
      </view>
    </view>
  </view>

  <TabBar role="user" />
</template>

<style scoped>
@import url("../../../static/css/adoption.css");
@import url("../../../static/css/journey.css");

/* 底部留白，避免内容被 fixed TabBar（约 155rpx）遮挡 */
.adopt-page {
  padding-bottom: 160rpx;
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

.adopt-hero-tag {
  background: rgba(212, 175, 55, 0.2);
  border: 2rpx solid rgba(232, 201, 106, 0.4);
  color: var(--heli-gold-soft);
}

/* Tab 切换：毛玻璃胶囊 */
.journey-tabs {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.journey-tab {
  color: rgba(245, 249, 249, 0.6);
}

.journey-tab.active {
  background: var(--glass-strong);
  border: 2rpx solid var(--glass-border-teal);
  color: #bfe5e0;
  box-shadow: 0 6rpx 16rpx rgba(6, 24, 24, 0.35), inset 0 1rpx 0 rgba(255, 255, 255, 0.14);
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

/* 旅程卡片封面：贺兰青渐变 */
.journey-card-grad {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 60%, #0f3a3a 100%);
}

.journey-card-name {
  color: var(--heli-text);
}

.journey-card-meta-item {
  color: #7fc9c9;
}

.journey-card-desc {
  color: var(--heli-muted);
}

.journey-duration-pill {
  background: rgba(8, 28, 28, 0.65);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  color: #f2e6c0;
}

/* 分类徽标：贺兰青 */
.adopt-badge-green {
  background: rgba(95, 180, 180, 0.2);
  border: 2rpx solid rgba(95, 180, 180, 0.4);
  color: #bfe5e0;
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

/* 加载 / 空态文字 */
.adopt-loading {
  color: var(--heli-muted);
}

.adopt-empty-text {
  color: var(--heli-muted);
}
</style>
