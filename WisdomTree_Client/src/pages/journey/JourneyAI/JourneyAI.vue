<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  journeyRequest,
  extractAIResult,
  safeDecode,
} from "../../../common/journey";

// ====================== 偏好选项（多选 chip） ======================
const PREFERENCE_OPTIONS = ["亲子", "采摘", "研学", "美食"];
const preferences = ref([]);

const togglePreference = (item) => {
  const index = preferences.value.indexOf(item);
  if (index >= 0) preferences.value.splice(index, 1);
  else preferences.value.push(item);
};

// ====================== 表单与状态 ======================
const message = ref("");
const sessionId = ref("");
const generating = ref(false);
const saving = ref(false);
// AI 结果：{ schedule, products, scenic, tips, summary, message, reply, intent }
const result = ref(null);

// ====================== AI 生成 ======================
/**
 * 调用 AI 对话接口生成旅程
 * 接口：POST /agent/chat  body: { message, sessionId? }
 * trip_planning 时 data 内携带 schedule/products/scenic/tips
 */
const generate = async () => {
  const text = message.value.trim();
  if (!text) {
    uni.showToast({ title: "先说说你想怎么玩", icon: "none" });
    return;
  }
  if (generating.value) return;
  generating.value = true;
  uni.showLoading({ title: "AI 规划中...", mask: true });

  const composed = preferences.value.length
    ? `${text}（偏好：${preferences.value.join("、")}）`
    : text;

  try {
    const data = await journeyRequest({
      url: "/agent/chat",
      method: "POST",
      data: { message: composed, sessionId: sessionId.value || undefined },
    });
    sessionId.value = data?.sessionId || sessionId.value;
    result.value = extractAIResult(data || {});
    if (
      !result.value ||
      (result.value.schedule.length === 0 &&
        result.value.products.length === 0 &&
        result.value.scenic.length === 0)
    ) {
      uni.showToast({ title: "暂未规划出合适行程，换个说法试试", icon: "none" });
    }
  } catch (e) {
    uni.showToast({ title: e.message || "AI 生成失败，请重试", icon: "none" });
  } finally {
    generating.value = false;
    uni.hideLoading();
  }
};

// ====================== 保存为我的旅程 ======================
/**
 * 组装 schedule 调用保存接口
 * 接口：POST /travel/agent/save-journey  body: { schedule: [{ time, activity, location?, description?, duration? }] }
 */
const saveJourney = async () => {
  if (!result.value || result.value.schedule.length === 0 || saving.value) return;
  saving.value = true;
  uni.showLoading({ title: "保存中" });

  const schedule = result.value.schedule.map((s = {}) => ({
    time: s.time || "",
    activity: s.activity || s.name || "行程活动",
    location: s.location || "",
    description: s.description || "",
    duration: s.duration || "",
  }));

  try {
    await journeyRequest({
      url: "/travel/agent/save-journey",
      method: "POST",
      data: { schedule },
    });
    uni.hideLoading();
    uni.showToast({ title: "已保存到我的旅程", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({
        url: "/pages/journey/JourneyList/JourneyList?type=mine",
      });
    }, 800);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || "保存失败，请重试", icon: "none" });
  } finally {
    saving.value = false;
  }
};

// ====================== 展示辅助 ======================
const priceText = (p) => {
  if (p == null || p.price == null) return "";
  const price = Number(p.price);
  const unit = p.unit ? `/${p.unit}` : "";
  return Number.isNaN(price) ? "" : `¥${price}${unit}`;
};

// ====================== 生命周期 ======================
onLoad((option) => {
  const hint = safeDecode(option.hint) || "";
  if (hint) message.value = hint;
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">AI 生成旅程</text>
      <text class="adopt-hero-sub">说出你的想法，AI 帮你安排一天的乡村之旅</text>
    </view>

    <!-- 输入区 -->
    <view class="adopt-form adopt-card">
      <view class="adopt-form-title">你的出行需求</view>
      <textarea
        class="adopt-textarea"
        v-model="message"
        maxlength="200"
        placeholder="如：2天1夜带娃摘草莓怎么玩"
      />
      <view class="adopt-form-title">选择偏好（可多选）</view>
      <view class="journey-chip-row">
        <view
          v-for="item in PREFERENCE_OPTIONS"
          :key="item"
          class="journey-chip"
          :class="{ active: preferences.includes(item) }"
          @click="togglePreference(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 生成按钮 -->
    <view class="adopt-form-submit">
      <view
        class="adopt-btn adopt-btn-primary"
        :class="{ 'adopt-btn-disabled': generating }"
        @click="generate"
      >
        {{ generating ? "AI 规划中..." : "AI 生成旅程" }}
      </view>
    </view>

    <!-- 生成结果 -->
    <template v-if="result">
      <!-- AI 文案兜底（结构化数据缺失时仍展示回复） -->
      <view class="journey-ai-notice" v-if="result.reply">
        {{ result.reply }}
      </view>

      <!-- 行程安排 -->
      <template v-if="result.schedule.length > 0">
        <view class="journey-ai-title">行程安排</view>
        <view class="journey-ai-card">
          <view
            v-for="(s, index) in result.schedule"
            :key="index"
            class="journey-ai-item"
          >
            <view class="journey-ai-item-main">
              <text class="journey-ai-item-name">
                {{ s.activity || s.name }}
              </text>
              <text class="journey-ai-item-sub" v-if="s.location">
                📍 {{ s.location }}
              </text>
              <text class="journey-ai-item-sub" v-if="s.description">
                {{ s.description }}
              </text>
            </view>
            <text class="journey-ai-item-extra" v-if="s.time || s.duration">
              {{ [s.time, s.duration].filter(Boolean).join(" · ") }}
            </text>
          </view>
        </view>
      </template>

      <!-- 产品推荐 -->
      <template v-if="result.products.length > 0">
        <view class="journey-ai-title">产品推荐</view>
        <view class="journey-ai-card">
          <view
            v-for="(p, index) in result.products"
            :key="index"
            class="journey-ai-item"
          >
            <view class="journey-ai-item-main">
              <text class="journey-ai-item-name">{{ p.name }}</text>
              <text class="journey-ai-item-sub" v-if="p.description">
                {{ p.description }}
              </text>
            </view>
            <text class="journey-ai-price" v-if="priceText(p)">
              {{ priceText(p) }}
            </text>
          </view>
        </view>
      </template>

      <!-- 景区推荐 -->
      <template v-if="result.scenic.length > 0">
        <view class="journey-ai-title">景区推荐</view>
        <view class="journey-ai-card">
          <view
            v-for="(s, index) in result.scenic"
            :key="index"
            class="journey-ai-item"
          >
            <view class="journey-ai-item-main">
              <text class="journey-ai-item-name">{{ s.name }}</text>
              <text class="journey-ai-item-sub">
                {{ [s.city, s.level, s.location].filter(Boolean).join(" · ") }}
              </text>
            </view>
            <text class="journey-ai-item-extra" v-if="s.weather || s.temp">
              {{ [s.weather, s.temp].filter(Boolean).join(" ") }}
            </text>
          </view>
        </view>
      </template>

      <!-- 出行建议 -->
      <template v-if="result.tips.length > 0">
        <view class="journey-ai-title">出行建议</view>
        <view class="journey-tips-list">
          <view
            v-for="(tip, index) in result.tips"
            :key="index"
            class="journey-tips-item"
          >
            {{ tip }}
          </view>
        </view>
      </template>

      <!-- 保存按钮 -->
      <view class="adopt-form-submit" v-if="result.schedule.length > 0">
        <view
          class="adopt-btn adopt-btn-primary"
          :class="{ 'adopt-btn-disabled': saving }"
          @click="saveJourney"
        >
          {{ saving ? "保存中..." : "保存为我的旅程" }}
        </view>
      </view>

      <view class="adopt-bottom-space"></view>
    </template>
  </view>
</template>

<style scoped>
@import url("../../../static/css/adoption.css");
@import url("../../../static/css/journey.css");
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

.adopt-form-title {
  color: var(--heli-text);
}

/* 输入区：玻璃输入框 */
.adopt-textarea {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 16rpx;
  color: var(--heli-text);
}

/* 偏好 chip：毛玻璃胶囊 */
.journey-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  color: var(--heli-muted);
}

.journey-chip.active {
  background: rgba(47, 143, 143, 0.28);
  border-color: var(--glass-border-teal);
  color: #bfe5e0;
}

/* 主按钮：贺兰青 */
.adopt-btn-primary {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  box-shadow: 0 10rpx 24rpx rgba(6, 24, 24, 0.4), 0 0 0 2rpx rgba(95, 180, 180, 0.25);
}

/* AI 文案兜底（AI 回复气泡：毛玻璃白） */
.journey-ai-notice {
  background: var(--glass-strong);
  border: 2rpx solid var(--glass-border);
  border-left: 8rpx solid #5fb4b4;
  border-radius: 24rpx;
  color: var(--heli-text);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.journey-ai-title {
  color: var(--heli-text);
}

.journey-ai-title::before {
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  box-shadow: 0 0 12rpx rgba(95, 180, 180, 0.6);
}

/* AI 结果卡：毛玻璃 */
.journey-ai-card {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 24rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.journey-ai-item {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.journey-ai-item-name {
  color: var(--heli-text);
}

.journey-ai-item-sub {
  color: var(--heli-muted);
}

.journey-ai-item-extra {
  color: var(--heli-muted);
}

.journey-ai-price {
  color: var(--heli-gold-soft);
}

/* 出行建议：毛玻璃 */
.journey-tips-list {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 24rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.journey-tips-item {
  color: var(--heli-text);
}

.journey-tips-item::before {
  color: #5fb4b4;
}
</style>
