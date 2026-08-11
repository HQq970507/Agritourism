<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import TreeTitleVue from "../../../components/tree/TreeTitle.vue";
import BuyNowVue from "../../../components/tree/BuyNow.vue";
import BasicInfoVue from "../../../components/tree/BasicInfo.vue";
import TreePlateVue from "../../../components/tree/TreePlate.vue";
import TreeDeailVue from "../../../components/tree/TreeDeail.vue";
import TreeImageVue from "../../../components/tree/TreeImage.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { NewAccesstoken } from "../../../common/request";
import { BaseUrl } from "../../../common/request";
import { useTokenStore } from "@/stores/token";

const tokenStore = useTokenStore();

const toform = (treeTypeID, treeName, avatar) => {
  uni.navigateTo({
    url: `/pages/tree/TreeFrom/TreeFrom?treeTypeID=${treeTypeID}&treeName=${treeName}&avatar=${avatar}`,
  });
};

const treeTypeInfo = ref({
  id: 1,
  avatar: "https://s21.ax1x.com/2024/09/15/pAuDlAs.jpg",
  scientific_name: "学名",
  common_name: "俗名",
  description: "详情",
  total: "树木总数",
  remaining: "剩余数量",
});

// onload
onLoad((option) => {
  getTreeTypeInfo(option.treeTypeID);
});

// 获取树类详情
const getTreeTypeInfo = async (treeTypeID) => {
  uni.showLoading({
    title: "加载中",
  });
  const verify = await NewAccesstoken(tokenStore.Accesstoken);
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/tree/getTreeDetail?treeTypeID=${treeTypeID}`,
        method: "GET",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
      });
      if (res.data.status !== 200) {
        throw new Error();
      }
      treeTypeInfo.value = res.data.data;
    } catch (e) {
      uni.showToast({
        title: `请求错误`,
        icon: "error",
      });
    }
  }
};

const load = () => {
  uni.hideLoading();
};
</script>

<template>
  <view class="page">
    <!-- 自定义导航组件 -->
    <AutoBackVue />
    <!-- 领养按钮组件 -->
    <BuyNowVue
      @submit="
        toform(
          treeTypeInfo.id,
          treeTypeInfo.scientific_name,
          treeTypeInfo.avatar
        )
      "
    >
      <template #text>
        <p>填写领养信息</p>
      </template>
    </BuyNowVue>
    <!-- 基本信息组件 -->
    <BasicInfoVue>
      <template #info-name>{{ treeTypeInfo.scientific_name }}</template>
      <template #info-smname>{{ treeTypeInfo.common_name }}</template>
      <template #touxiang>
        <image :src="treeTypeInfo.avatar" @load="load"></image>
      </template>
    </BasicInfoVue>
    <!-- 树木铭牌组件 -->
    <TreePlateVue
      :show="true"
      :currentEnergy="treeTypeInfo.userEnergy"
      :totalEnergy="treeTypeInfo.energy"
    >
      <p class="mp-p">
        树种
        <span class="mp-span">{{ treeTypeInfo.scientific_name }}</span>
      </p>
      <p class="mp-p">
        总数
        <span class="mp-span num">{{ treeTypeInfo.total }} 颗</span>
      </p>
      <p class="mp-p">
        剩余数量
        <span class="mp-span sy">{{ treeTypeInfo.remaining }} 颗</span>
      </p>
    </TreePlateVue>
    <!-- 树木详情组件 -->
    <TreeDeailVue>
      <template>
        {{ treeTypeInfo.description }}
      </template>
    </TreeDeailVue>
    <!-- 因为BuyNow组件底部占位div -->
    <view class="zw"></view>
  </view>
</template>

<style scoped>
@import url("../../../static/css/treedeail.css");

/* =====================================================
   贺兰青 · 毛玻璃改造（与首页 index.vue 统一设计语言）
   ===================================================== */
.page {
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

  min-height: 100vh;
  box-sizing: border-box;
  color: var(--heli-text);
  /* 深色渐变背景（纯 CSS，无外链图） */
  background:
    radial-gradient(130% 80% at 50% 0%, rgba(95, 180, 180, 0.16) 0%, transparent 46%),
    radial-gradient(100% 60% at 100% 100%, rgba(26, 92, 92, 0.55) 0%, transparent 60%),
    linear-gradient(180deg, #103131 0%, #0b2626 55%, #081c1c 100%);
}

/* 铭牌 / 详情文字（slot 内容） */
.mp-p {
  color: var(--heli-muted);
}

.mp-span {
  color: var(--heli-text);
}

.num {
  background-color: rgba(95, 180, 180, 0.18);
  border-color: rgba(95, 180, 180, 0.4);
  color: #a5e3dd;
}

.sy {
  background-color: rgba(212, 175, 55, 0.16);
  border-color: rgba(212, 175, 55, 0.4);
  color: #f0dc9a;
}

/* ===== 隐藏组件内的外链背景图（改为纯 CSS 渐变） ===== */
.page ::v-deep .bg-img.bg-img {
  display: none;
}

/* ===== BasicInfo 基本信息文字 ===== */
.page ::v-deep .tree-name {
  color: var(--heli-text);
}

.page ::v-deep .tree-smallname,
.page ::v-deep .df {
  color: var(--heli-muted);
}

.page ::v-deep .treeling {
  color: var(--heli-light);
}

.page ::v-deep .right image {
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10rpx 28rpx rgba(6, 24, 24, 0.35);
}

/* ===== TreePlate / TreeDeail 卡片：毛玻璃 ===== */
.page ::v-deep .tree-detail.tree-detail {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 28rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.page ::v-deep .title-text {
  color: var(--heli-text);
}

.page ::v-deep .activeone {
  color: var(--heli-light);
}

/* 铭牌能量进度条 */
.page ::v-deep .energy-progress.energy-progress {
  color: var(--heli-light);
}

.page ::v-deep .progress-container.progress-container {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.page ::v-deep .progress-bar.progress-bar {
  background: linear-gradient(135deg, #5fb4b4 0%, #2f8f8f 100%);
}

.page ::v-deep .progress-text.progress-text {
  color: var(--heli-muted);
}

/* ===== BuyNow 底部领养栏：毛玻璃 + 贺兰青按钮 ===== */
.page ::v-deep .btn-box.btn-box {
  background: rgba(10, 30, 30, 0.72);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.page ::v-deep .btn-box .btn.btn {
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  border-radius: 999rpx;
  box-shadow: 0 8rpx 20rpx rgba(6, 24, 24, 0.35), 0 0 0 2rpx rgba(95, 180, 180, 0.25);
  color: #ffffff;
}
</style>
