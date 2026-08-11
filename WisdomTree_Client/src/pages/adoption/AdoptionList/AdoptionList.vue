<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { onLoad, onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import { ref } from "vue";
import { adoptionRequest } from "../../../common/adoption";
import TabBar from "../../../components/TabBar.vue";

// ====================== 分页 & 加载状态 ======================
const products = ref([]); // 可认领产品（分类）列表
const total = ref(0); // 总条数（后端返回）
const page = ref(1);
const pageSize = ref(10);
const isLoading = ref(false); // 是否正在请求
const noMore = ref(false); // 是否没有更多
const firstLoading = ref(true); // 首次加载（骨架/加载态）
// 关键字筛选（首页「宁夏特产年货」入口直达）
const keyword = ref("");
const pageTitle = ref("认领主线");
const pageSub = ref("挑选你心仪的农产品，从一粒种子见证丰收");

// ====================== 数据获取 ======================
/**
 * 获取可认领产品列表
 * 接口：GET /product/getProductList?page=1&pageSize=10（需登录，后端返回 categories）
 */
const loadProducts = async (reset = false) => {
  if (isLoading.value) return;
  if (!reset && noMore.value) return;
  isLoading.value = true;

  if (reset) {
    page.value = 1;
    noMore.value = false;
  }

  try {
    const kw = keyword.value ? `&keyword=${encodeURIComponent(keyword.value)}` : "";
    const data = await adoptionRequest({
      url: `/product/getProductList?page=${page.value}&pageSize=${pageSize.value}${kw}`,
      method: "GET",
    });
    const list = data?.categories || [];
    total.value = data?.total || 0;
    products.value = reset ? list : products.value.concat(list);
    if (products.value.length >= total.value) noMore.value = true;
  } catch (e) {
    uni.showToast({
      title: e.message || "请求失败，请重试",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
    firstLoading.value = false;
    uni.stopPullDownRefresh();
  }
};

// 触底加载更多
const loadMore = () => {
  if (noMore.value || isLoading.value) return;
  page.value += 1;
  loadProducts();
};

// ====================== 跳转 ======================
/**
 * 去认领：跳转到认领表单
 */
const toAdopt = (item) => {
  const name = item.display_name || item.name || "";
  uni.navigateTo({
    url: `/pages/adoption/AdoptionForm/AdoptionForm?categoryId=${item.id}&productName=${encodeURIComponent(
      name
    )}&avatar=${encodeURIComponent(item.avatar || "")}`,
  });
};

/**
 * 查看我的认领
 */
const toMyAdoption = () => {
  uni.navigateTo({
    url: "/pages/adoption/MyAdoption/MyAdoption",
  });
};

// ====================== 生命周期 ======================
// 支持 ?keyword= 参数直达（首页「宁夏特产年货」入口）
onLoad((option) => {
  if (option.keyword) {
    keyword.value = decodeURIComponent(option.keyword);
    pageTitle.value = "宁夏特产年货";
    pageSub.value = "中宁枸杞 · 盐池滩羊 · 贺兰山葡萄酒 · 八宝茶";
  }
  loadProducts(true);
});

onReachBottom(loadMore);

onPullDownRefresh(() => {
  loadProducts(true);
});
</script>

<template>
  <view class="adopt-page">
    <AutoBackVue />

    <!-- 顶部横幅 -->
    <view class="adopt-hero">
      <text class="adopt-hero-title">{{ pageTitle }}</text>
      <text class="adopt-hero-sub">{{ pageSub }}</text>
      <text class="adopt-hero-tag" @click="toMyAdoption">我的认领 →</text>
    </view>

    <!-- 首次加载 -->
    <view v-if="firstLoading" class="adopt-loading">加载中...</view>

    <!-- 空态 -->
    <view v-else-if="products.length === 0" class="adopt-empty">
      <image
        class="adopt-empty-img"
        src="https://s21.ax1x.com/2024/09/15/pAuyMHe.png"
      />
      <text class="adopt-empty-text">暂无可认领的产品</text>
      <view class="adopt-empty-btn adopt-btn adopt-btn-primary" @click="loadProducts(true)">
        重新加载
      </view>
    </view>

    <!-- 产品网格 -->
    <view v-else class="product-grid">
      <view
        v-for="item in products"
        :key="item.id"
        class="product-card adopt-card"
      >
        <view class="product-img-box">
          <image
            class="product-img"
            :src="item.avatar"
            mode="aspectFill"
            lazy-load
          />
        </view>
        <view class="product-info">
          <text class="product-name">{{ item.display_name || item.name }}</text>
          <text class="product-sub">{{ item.name }}</text>
          <view class="product-meta">
            <text class="product-price">¥{{ item.price }}/{{ item.unit }}</text>
            <text class="product-remain">剩 {{ item.remaining }}/{{ item.total }}</text>
          </view>
        </view>
        <view class="product-btn adopt-btn adopt-btn-primary" @click="toAdopt(item)">
          认领
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="!firstLoading && products.length > 0" class="adopt-loading">
      {{ noMore ? "— 没有更多了 —" : "上拉加载更多" }}
    </view>
  </view>

  <TabBar role="user" />
</template>

<style scoped>
@import url("../../../static/css/adoption.css");

/* =====================================================
   贺兰青毛玻璃主题覆盖（与首页 index.vue 同一设计语言）
   旧 --adopt-* 绿色令牌统一映射为贺兰青令牌
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

  /* 深青渐变背景（纯 CSS，无外链图） */
  background: radial-gradient(120% 60% at 90% -10%, rgba(95, 180, 180, 0.16) 0%, transparent 60%),
    radial-gradient(90% 50% at -10% 45%, rgba(212, 175, 55, 0.07) 0%, transparent 55%),
    linear-gradient(180deg, #0a2626 0%, #102f2f 55%, #0b2828 100%);
  color: var(--heli-text);
  /* 底部留白，避免内容被 fixed TabBar（约 155rpx）遮挡 */
  padding-bottom: 160rpx;
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

/* 主按钮（贺兰青，金色仅作点缀） */
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

/* 两列网格，与 tree 列表卡片风格一致 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 24rpx;
  grid-row-gap: 24rpx;
  padding: 28rpx 24rpx 40rpx;
}

.product-card {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

.product-img-box {
  width: 100%;
  height: 240rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.product-img {
  width: 100%;
  height: 100%;
}

.product-info {
  padding: 20rpx 4rpx 8rpx;
  flex: 1;
}

.product-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--heli-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--heli-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.product-price {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--heli-gold-soft);
}

.product-remain {
  font-size: 20rpx;
  color: var(--heli-muted);
}

.product-btn {
  height: 72rpx;
  font-size: 28rpx;
}
</style>
