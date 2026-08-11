<script setup>
import StatusBar from "../../components/StatusBar.vue";
import { useTokenStore } from "@/stores/token";
import { ref } from "vue";
import { NewAccesstoken } from "../../common/request";
import { onLoad } from "@dcloudio/uni-app";
import { medalStore } from "../../stores/medal";
import TabBar from "../../components/TabBar.vue";
import { TreeModelUrl } from "../../common/request";
import { BaseUrl } from "../../common/request";
import { NX_CITIES, NX_REGIONS, projectCity, regionsPathData } from "../../common/farm";

const tokenStore = useTokenStore();
const medal = medalStore();

//今日步数
const step = ref(0);

// 树信息
const treeInfo = ref({
  totalTrees: 10,
  totalTypes: 18,
});

// 控制组件显示和样式
const showxz = ref(false);

const know = () => {
  showxz.value = false;
  medal.clearMedalInfo();
};

const toTree = () => {
  uni.navigateTo({
    url: "/pages/tree/TreeList/TreeList",
  });
};

// 认领农产品入口
const toAdoptionList = () => {
  uni.navigateTo({
    url: "/pages/adoption/AdoptionList/AdoptionList",
  });
};

// 我的认领入口
const toMyAdoption = () => {
  uni.navigateTo({
    url: "/pages/adoption/MyAdoption/MyAdoption",
  });
};

// 智慧旅程入口
const toJourneyList = () => {
  uni.navigateTo({
    url: "/pages/journey/JourneyList/JourneyList",
  });
};

// ====================== P2 游客体验：农旅首页 ======================

// 季节推荐数据（点击跳转旅程列表，category 供后续联调）
const seasons = [
  { key: "spring", name: "春 · 采摘", sub: "草莓樱桃 鲜采鲜食", emoji: "🌸", category: "采摘" },
  { key: "summer", name: "夏 · 亲子", sub: "研学露营 田园野趣", emoji: "🏕️", category: "研学" },
  { key: "autumn", name: "秋 · 丰收", sub: "葡萄枸杞 满园飘香", emoji: "🍇", category: "丰收" },
  { key: "winter", name: "冬 · 年货", sub: "枸杞羊排 乡味年礼", emoji: "🧧", category: "美食" },
];

// 首页地图入口的小尺寸宁夏轮廓（真实省界，视觉背景）
const farmOutlinePath = regionsPathData(NX_REGIONS, 100, 225);
const farmCityDots = NX_CITIES.map(projectCity);

// 采摘园地图入口
const toFarmMap = () => {
  uni.navigateTo({
    url: "/pages/farm/FarmMap/FarmMap",
  });
};

// 季节卡片 -> 旅程列表
const toSeason = (season) => {
  uni.navigateTo({
    url: `/pages/journey/JourneyList/JourneyList?category=${encodeURIComponent(season.category)}`,
  });
};

// 宁夏特产年货入口 -> 认领/购买列表（仅展示特产分类）
const toSpecialties = () => {
  const kw = encodeURIComponent("枸杞,滩羊,葡萄酒,干红,八宝茶,沙枣");
  uni.navigateTo({
    url: `/pages/adoption/AdoptionList/AdoptionList?keyword=${kw}`,
  });
};

// 资源点击事件
const handleResourceClick = () => {
  uni.showModal({
    title: "即将打开3D树木养护模型",
    content: "确定要打开吗？",
    success(res) {
      if (res.confirm) {
        uni.navigateTo({
          url: `/pages/webview/index?url=${TreeModelUrl}`,
        });
      }
    },
  });
};

onLoad(() => {
  // 控制勋章显示
  if (medal.medalInfo.adoptionID !== "") {
    showxz.value = true;
  }
});

// 能量气泡数据
// const bubbles = ref([
//   {
//     id: 1,
//     value: 0,
//     collecting: false,
//     energyid: 1,
//   },
//   {
//     id: 2,
//     value: 0,
//     collecting: false,
//     energyid: 1,
//   },
//   {
//     id: 3,
//     value: 0,
//     collecting: false,
//     energyid: 1,
//   },
//   {
//     id: 4,
//     value: 0,
//     collecting: false,
//     energyid: 1,
//   },
//   {
//     id: 5,
//     value: 0,
//     collecting: false,
//     energyid: 1,
//   },
// ]);
const bubbles = ref([]);

// 点击气泡
const collectEnergy = async (bubble) => {
  // 标记收集状态
  bubble.collecting = true;

  try {
    // 调用领取接口
    await receiveEnergy(bubble.energyid, bubble.value);

    // 500ms后移除气泡
    setTimeout(() => {
      bubbles.value = bubbles.value.filter((b) => b.id !== bubble.id);
    }, 500);
  } catch (error) {
    // 失败时重置状态
    bubble.collecting = false;
  }
};

// 获取树木总量和种类总数
const getStatistics = async () => {
  uni.showLoading({
    title: "加载中",
  });
  const verify = await NewAccesstoken();
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/datachart/user/statistics`,
        method: "GET",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
      });
      if (res.data.status !== 200) {
        throw new Error(res.data.message || "请求失败");
      }
      treeInfo.value = res.data.data;
      uni.hideLoading();
    } catch (e) {
      console.log(e);
      uni.hideLoading();
      uni.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
    }
  } else {
    uni.hideLoading();
  }
};

getStatistics();

// ====================== P2 游客体验：首页动态 ======================
const feed = ref({
  recentAdoptions: [],
  recentDiaries: [],
  hotPosts: [],
});

const toPostDetail = (id) => {
  uni.navigateTo({
    url: `/pages/forum/forumDetail/index?id=${id}`,
  });
};

const toForum = () => {
  uni.navigateTo({
    url: "/pages/forum/index",
  });
};

const toActivity = () => {
  uni.navigateTo({
    url: "/pages/user/activity/index",
  });
};

// 加载首页动态（最近认领 / 最新日记 / 热门帖子）
const getFeed = async () => {
  const verify = await NewAccesstoken();
  if (!verify) return;
  try {
    const res = await uni.request({
      url: `${BaseUrl}/home/feed?limit=3`,
      method: "GET",
      header: {
        authorization: `Bearer ${tokenStore.Accesstoken}`,
      },
    });
    if (res.data.status === 200) {
      feed.value = res.data.data;
    }
  } catch (e) {
    console.log(e);
  }
};

getFeed();

// 随机分割能量函数（保持总数不变）
const splitEnergy = (total) => {
  // 当总量不足以分配时，直接返回单个气泡,最小能量为5
  if (total < 5) return [total];
  const points = [];
  // 生成4个分割点
  for (let i = 0; i < 4; i++) {
    points.push(Math.random());
  }
  points.sort((a, b) => a - b);

  const parts = [];
  let prev = 0;
  // 计算每个区间的值
  for (const point of points) {
    const val = Math.round((point - prev) * total);
    parts.push(val);
    prev = point;
  }
  // 最后一部分
  parts.push(total - parts.reduce((a, b) => a + b));

  // 过滤掉0值并保证至少5个气泡
  return parts
    .filter((n) => n > 0)
    .concat(Array(5).fill(1)) // 防止空值
    .slice(0, 5);
};

// 合并今日运动数据接口
const mergeTodayStep = async () => {
  try {
    uni.showLoading({
      title: "合并数据中",
    });
    const verify = await NewAccesstoken();
    if (!verify) return;

    // 微信登录获取 code
    const loginRes = await uni.login({
      provider: "weixin",
    });

    // 获取微信运动数据
    const runRes = await uni.getWeRunData();

    const res = await uni.request({
      url: `${BaseUrl}/wxRun/merge`,
      method: "POST",
      header: {
        authorization: `Bearer ${tokenStore.Accesstoken}`,
      },
      data: {
        code: loginRes.code,
        encryptedData: runRes.encryptedData,
        iv: runRes.iv,
      },
    });
    if (res.data.code === 0) {
      uni.hideLoading();
      uni.showToast({
        title: "合并成功",
        icon: "success",
      });
      setTimeout(() => {
        getStep();
      }, 800);
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: "合并失败",
      icon: "error",
    });
    console.log(error);
  }
};

// 获取今日可领的能量
const getStep = async () => {
  try {
    uni.showLoading({
      title: "获取能量中",
    });

    const verify = await NewAccesstoken();
    if (!verify) return;

    // 微信登录获取 code
    const loginRes = await uni.login({
      provider: "weixin",
    });

    // 获取微信运动数据
    const runRes = await uni.getWeRunData();

    // 将数据发送到后端解密
    const res = await uni.request({
      url: `${BaseUrl}/wxRun/decrypt`,
      method: "POST",
      header: {
        authorization: `Bearer ${tokenStore.Accesstoken}`,
      },
      data: {
        code: loginRes.code,
        encryptedData: runRes.encryptedData,
        iv: runRes.iv,
      },
    });
    if (res.data.code === 2) {
      uni.hideLoading();
      uni.showModal({
        title: "微信号发生变更",
        content: "确定要合并今日运动数据吗",
        success(res) {
          if (res.confirm) {
            mergeTodayStep();
          }
        },
      });
      return;
    }
    if (res.data.code === 1) {
      const parts = splitEnergy(res.data.data.energy);
      bubbles.value = parts.map((item, index) => ({
        id: new Date().getTime() + index,
        energyid: res.data.data.id,
        value: item,
        collecting: false,
      }));
      uni.hideLoading();
      uni.showToast({
        title: "能量小气泡来咯😍",
        icon: "none",
      });
    } else if (res.data.code === 0) {
      uni.hideLoading();
      uni.showToast({
        title: "步数不250，能量小气泡无法生产😢",
        icon: "none",
      });
    } else if (res.data.code === 3) {
      uni.hideLoading();
      uni.showToast({
        title: "暂时领取完啦，继续加油🤗",
        icon: "none",
      });
    }
    step.value = res.data.data.step;
  } catch (error) {
    console.log(error);
  }
};

getStep();

// 领养能量接口
const receiveEnergy = async (energyId, energyValue) => {
  try {
    const verify = await NewAccesstoken();
    if (!verify) return;

    const res = await uni.request({
      url: `${BaseUrl}/wxRun/receive`,
      method: "POST",
      header: {
        authorization: `Bearer ${tokenStore.Accesstoken}`,
      },
      data: {
        id: energyId,
        energy: energyValue,
      },
    });

    if (res.data.code !== 0) {
      throw new Error(res.data.message || "领取失败");
    }
    uni.showToast({
      title: `${res.data.message}`,
      icon: "success",
    });
  } catch (error) {
    uni.showToast({
      title: "领取失败",
      icon: "error",
    });
    throw error;
  }
};
</script>

<template>
  <view class="page">
    <StatusBar />
    <image class="bg-img" mode="aspectFill" src="/static/img/hero-bg.jpg"></image>
    <view class="bg-overlay"></view>
    <!-- ===== P2 农旅标语区 ===== -->
    <view class="farm-hero">
      <text class="farm-hero-kicker">贺兰山下 · 塞上江南</text>
      <text class="farm-hero-title">认领宁夏的<text class="farm-hero-gold">四季</text></text>
      <text class="farm-hero-sub">采摘研学 · 农家民宿 · 四季风味，一图逛遍</text>
      <view class="farm-hero-chip" @click="toFarmMap">🗺️ 采摘园地图 →</view>
    </view>

    <!-- ===== P2 季节推荐（横滑） ===== -->
    <view class="farm-season">
      <view class="farm-season-head">
        <text class="farm-season-title">季节推荐</text>
        <text class="farm-season-more" @click="toJourneyList">全部旅程 ›</text>
      </view>
      <scroll-view class="farm-season-scroll" scroll-x :show-scrollbar="false">
        <view class="farm-season-list">
          <view
            v-for="season in seasons"
            :key="season.key"
            class="farm-season-card"
            :class="`farm-season-${season.key}`"
            @click="toSeason(season)"
          >
            <text class="farm-season-emoji">{{ season.emoji }}</text>
            <text class="farm-season-name">{{ season.name }}</text>
            <text class="farm-season-sub">{{ season.sub }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ===== P5 宁夏特产年货入口（冬） ===== -->
    <view class="farm-specialties" @click="toSpecialties">
      <view class="farm-specialties-info">
        <text class="farm-specialties-title">🧧 宁夏特产年货</text>
        <text class="farm-specialties-sub">中宁枸杞 · 盐池滩羊 · 贺兰山东麓葡萄酒 · 八宝茶</text>
        <view class="farm-specialties-btn">进店逛逛 ›</view>
      </view>
      <view class="farm-specialties-emojis">
        <text class="farm-specialties-emoji">🍇</text>
        <text class="farm-specialties-emoji">🐑</text>
        <text class="farm-specialties-emoji">🍵</text>
      </view>
    </view>

    <!-- ===== P2 采摘园地图入口卡 ===== -->
    <view class="farm-map-entry" @click="toFarmMap">
      <view class="farm-map-entry-info">
        <text class="farm-map-entry-title">采摘园地图</text>
        <text class="farm-map-entry-sub">宁夏全区 · 采摘园 / 农家乐 / 民宿 一图尽览</text>
        <view class="farm-map-entry-btn">打开地图 ›</view>
      </view>
      <view class="farm-map-entry-visual">
        <!-- #ifdef H5 -->
        <svg
          class="farm-map-entry-svg"
          viewBox="0 0 100 225"
          preserveAspectRatio="none"
        >
          <path :d="farmOutlinePath" class="farm-map-entry-shape" fill-rule="evenodd" />
        </svg>
        <!-- #endif -->
        <view
          v-for="city in farmCityDots"
          :key="city.name"
          class="farm-map-entry-dot"
          :style="{ left: `${(city.x * 100).toFixed(2)}%`, top: `${(city.y * 100).toFixed(2)}%` }"
        ></view>
      </view>
    </view>

    <!-- ===== P2 首页动态（社区感） ===== -->
    <view class="farm-feed">
      <view class="farm-feed-head">
        <text class="farm-feed-title">村里新鲜事</text>
        <text class="farm-feed-more" @tap="toForum">进村逛逛 ›</text>
      </view>

      <view v-if="feed.hotPosts.length > 0" class="farm-feed-card">
        <view class="farm-feed-card-title">
          <text class="farm-feed-badge">🔥 热门</text>
          <text class="farm-feed-card-more" @tap="toForum">全部帖子</text>
        </view>
        <view
          v-for="p in feed.hotPosts.slice(0, 3)"
          :key="'p' + p.id"
          class="farm-feed-item"
          @tap="toPostDetail(p.id)"
        >
          <view class="farm-feed-item-main">
            <text class="farm-feed-item-text">{{ p.title }}</text>
            <view class="farm-feed-item-meta">
              <text class="farm-feed-item-user">{{ p.username }}</text>
              <text class="farm-feed-item-like">♥ {{ p.likeCount }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="feed.recentAdoptions.length > 0" class="farm-feed-card">
        <view class="farm-feed-card-title">
          <text class="farm-feed-badge farm-feed-badge-teal">🌱 最近认领</text>
          <text class="farm-feed-card-more" @tap="toAdoptionList">去认领</text>
        </view>
        <view
          v-for="a in feed.recentAdoptions.slice(0, 2)"
          :key="'a' + a.id"
          class="farm-feed-item"
          @tap="toAdoptionList"
        >
          <view class="farm-feed-item-main">
            <text class="farm-feed-item-text">{{ a.username }} 认领了「{{ a.productName }}」</text>
            <view class="farm-feed-item-meta">
              <text class="farm-feed-item-user">{{ a.status === 'growing' ? '生长中' : a.status === 'harvesting' ? '采收中' : '已完成' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="feed.recentDiaries.length > 0" class="farm-feed-card">
        <view class="farm-feed-card-title">
          <text class="farm-feed-badge farm-feed-badge-gold">📝 最新日记</text>
          <text class="farm-feed-card-more" @tap="toForum">看看动态</text>
        </view>
        <view
          v-for="d in feed.recentDiaries.slice(0, 2)"
          :key="'d' + d.id"
          class="farm-feed-item"
          @tap="toForum"
        >
          <view class="farm-feed-item-main">
            <text class="farm-feed-item-text">{{ d.username }}：{{ d.description }}</text>
            <view class="farm-feed-item-meta">
              <text class="farm-feed-item-user">{{ d.productName }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 树林信息 -->
    <view class="plain-block">
      <view class="tree">
        <view class="tree-top">
          <view class="main">
            <view class="sb">
              <image
                src="https://s21.ax1x.com/2024/09/15/pAuyZ1x.png"
              ></image>
              <text>树木种类</text>
            </view>
            <text class="dada">{{ treeInfo.totalTypes }}种</text>
          </view>
          <view class="main">
            <view class="sb">
              <image
                src="https://s21.ax1x.com/2024/09/15/pAuymjK.png"
              ></image>
              <text>树木数量</text>
            </view>
            <text class="dada">{{ treeInfo.totalTrees }}颗</text>
          </view>
        </view>
      </view>
      <view class="tree-btn">
        <text>今日步数：{{ step }}</text>
      </view>
    </view>

    <!-- 种树按钮 -->
    <view class="plain-block">
      <view class="btn">
        <view class="zs-btn" @click="toTree">
          <image src="https://s21.ax1x.com/2024/09/15/pAuyV91.png"></image>
          <p>我要领养</p>
        </view>

        <view class="zs-btn" @click="handleResourceClick">
          <image src="https://s21.ax1x.com/2024/09/15/pAuykN9.png"></image>
          <p>3D养护</p>
        </view>
      </view>
    </view>

    <!-- 认领主线入口 -->
    <view class="plain-block">
      <view class="adopt-entry">
        <view class="adopt-entry-item" @click="toAdoptionList">
          <view class="adopt-entry-icon adopt-icon-green">认领</view>
          <view class="adopt-entry-text">
            <text class="adopt-entry-title">认领农产品</text>
            <text class="adopt-entry-sub">从种苗到丰收，全程陪伴</text>
          </view>
          <text class="adopt-entry-arrow">›</text>
        </view>
        <view class="adopt-entry-item" @click="toMyAdoption">
          <view class="adopt-entry-icon adopt-icon-teal">我的</view>
          <view class="adopt-entry-text">
            <text class="adopt-entry-title">我的认领</text>
            <text class="adopt-entry-sub">查看认领进度与生长日记</text>
          </view>
          <text class="adopt-entry-arrow">›</text>
        </view>
        <view class="adopt-entry-item" @click="toJourneyList">
          <view class="adopt-entry-icon adopt-icon-gold">旅程</view>
          <view class="adopt-entry-text">
            <text class="adopt-entry-title">智慧旅程</text>
              <text class="adopt-entry-sub">AI 规划线路 · 采摘研学之旅</text>
            </view>
            <text class="adopt-entry-arrow">›</text>
          </view>
      </view>
    </view>

    <!-- 领取勋章 -->
    <view class="xunzang-box" v-if="showxz">
      <view class="xunzang">
        <view class="xunzhang-main">
          <p class="xz-title">环保勋章</p>
          <view class="xz-img">
            <image mode="aspectFill" :src="medal.medalInfo.avatar"></image>
          </view>
          <view class="xz-content">
            <p class="xz-p">感谢你和绿影慧领用户一起支持了对林场的保护!</p>
          </view>
          <view class="info">
            <view class="infoitem">
              <text>昵称：</text>
              <text class="tbg">{{ medal.medalInfo.nickName }}</text>
            </view>
            <view class="infoitem">
              <text>证书编号：</text>
              <text class="tbg">{{ medal.medalInfo.adoptionID }}</text>
            </view>
            <view class="infoitem">
              <text>树的类型：</text>
              <text class="tbg">{{ medal.medalInfo.treeType }}</text>
            </view>
          </view>
        </view>
        <p class="konw" @click="know">知道了</p>
      </view>
    </view>

  <view class="plain-block">
    <view class="energy-bubbles">
      <view class="bubble-wrapper">
        <view
          v-for="(bubble, index) in bubbles"
          :key="bubble.id"
          class="bubble"
          :class="{
            collecting: bubble.collecting,
            onefloat: index % 2 ? true : false,
            twofloat: index % 2 ? false : true,
          }"
          @click="collectEnergy(bubble)"
        >
          <text class="value">+{{ bubble.value }}g</text>
        </view>
      </view>
    </view>
  </view>
  </view>

  <TabBar role="user" />
</template>

<style scoped>
@import url("../../static/css/index.css");

/* ===== 贺兰青设计令牌 ===== */
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
}

/* 背景深色渐变遮罩，让前景文字可读 */
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(13, 40, 40, 0.55) 0%,
    rgba(13, 40, 40, 0.15) 40%,
    rgba(13, 40, 40, 0.55) 100%
  );
}

.bg-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 0%, transparent 42%, rgba(8, 28, 28, 0.4) 100%);
}
</style>

<style scoped>
/* ===== 认领主线入口（贺兰青毛玻璃） ===== */
.adopt-entry {
  margin-top: 40rpx;
  background: var(--glass);
  border: 2rpx solid var(--glass-border);
  border-radius: 24rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.adopt-entry-item {
  display: flex;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.08);
}

.adopt-entry-item:last-child {
  border-bottom: none;
}

.adopt-entry-item:active {
  background-color: rgba(255, 255, 255, 0.08);
}

.adopt-entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(6, 24, 24, 0.3);
}

.adopt-icon-green {
  background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
}

.adopt-icon-teal {
  background: linear-gradient(135deg, #1a5c5c, #2f8f8f);
}

.adopt-icon-gold {
  background: linear-gradient(135deg, #d4af37, #e8c96a);
  color: #2a2310;
}

.adopt-entry-text {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;
}

.adopt-entry-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--heli-text);
}

.adopt-entry-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--heli-muted);
}

.adopt-entry-arrow {
  font-size: 44rpx;
  color: rgba(245, 249, 249, 0.45);
  font-weight: 700;
}
</style>

<style scoped>
/* =====================================================
   P2 游客体验 - 农旅首页（贺兰青 · 毛玻璃 · 实景大图）
   ===================================================== */

/* -------- 农旅标语区 -------- */
.farm-hero {
  position: relative;
  margin: 24rpx 24rpx 0;
  padding: 60rpx 36rpx 48rpx;
  border-radius: 28rpx;
  color: #f5f9f9;
  overflow: hidden;
  text-shadow: 0 4rpx 20rpx rgba(6, 24, 24, 0.45);
}

.farm-hero::after {
  content: "";
  position: absolute;
  right: -80rpx;
  top: -100rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(95, 180, 180, 0.28) 0%, transparent 70%);
  pointer-events: none;
}

.farm-hero-kicker {
  position: relative;
  z-index: 1;
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
  color: #e8c96a;
  margin-bottom: 20rpx;
}

.farm-hero-title {
  position: relative;
  z-index: 1;
  display: block;
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  color: #ffffff;
}

.farm-hero-gold {
  color: #e8c96a;
  text-shadow: 0 0 24rpx rgba(212, 175, 55, 0.45);
}

.farm-hero-sub {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 18rpx;
  font-size: 26rpx;
  color: rgba(245, 249, 249, 0.82);
}

.farm-hero-chip {
  position: relative;
  z-index: 1;
  display: inline-block;
  margin-top: 32rpx;
  padding: 14rpx 30rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
  border: 2rpx solid rgba(95, 180, 180, 0.55);
  font-size: 24rpx;
  font-weight: 600;
  color: #f2e6c0;
  box-shadow: 0 10rpx 28rpx rgba(6, 24, 24, 0.3);
  transition: transform 0.2s ease;
}

.farm-hero-chip:active {
  transform: scale(0.96);
}

/* -------- 季节推荐 -------- */
.farm-season {
  margin-top: 36rpx;
}

.farm-season-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 24rpx 20rpx;
}

.farm-season-title {
  display: flex;
  align-items: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #f5f9f9;
}

.farm-season-title::before {
  content: "";
  width: 10rpx;
  height: 32rpx;
  margin-right: 16rpx;
  border-radius: 6rpx;
  background: linear-gradient(135deg, #2f8f8f 0%, #5fb4b4 100%);
  box-shadow: 0 0 12rpx rgba(95, 180, 180, 0.6);
}

.farm-season-more {
  font-size: 24rpx;
  color: #e8c96a;
}

.farm-season-scroll {
  width: 100%;
  white-space: nowrap;
}

.farm-season-list {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 20rpx;
}

.farm-season-card {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 220rpx;
  padding: 28rpx 20rpx 34rpx;
  border-radius: 24rpx;
  color: #f5f9f9;
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 12rpx 32rpx rgba(6, 24, 24, 0.35);
}

.farm-season-card::after {
  content: "";
  position: absolute;
  left: 26rpx;
  right: 26rpx;
  bottom: 14rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: var(--season, #5fb4b4);
  opacity: 0.8;
}

.farm-season-spring {
  --season: #5fb4b4;
  background: linear-gradient(150deg, rgba(95, 180, 180, 0.3), rgba(255, 255, 255, 0.07));
}

.farm-season-summer {
  --season: #3b9c9c;
  background: linear-gradient(150deg, rgba(59, 156, 156, 0.34), rgba(255, 255, 255, 0.07));
}

.farm-season-autumn {
  --season: #d4af37;
  background: linear-gradient(150deg, rgba(212, 175, 55, 0.3), rgba(255, 255, 255, 0.07));
}

.farm-season-winter {
  --season: #2f6b8f;
  background: linear-gradient(150deg, rgba(47, 107, 143, 0.42), rgba(255, 255, 255, 0.07));
}

.farm-season-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 2rpx solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 8rpx 20rpx rgba(6, 24, 24, 0.25);
  font-size: 46rpx;
}

.farm-season-name {
  margin-top: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #f5f9f9;
}

.farm-season-spring .farm-season-name {
  color: #bfe5e0;
}

.farm-season-summer .farm-season-name {
  color: #a4d4d0;
}

.farm-season-autumn .farm-season-name {
  color: #f0dc9a;
}

.farm-season-winter .farm-season-name {
  color: #a9c8dd;
}

.farm-season-sub {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: rgba(245, 249, 249, 0.66);
}

/* -------- 采摘园地图入口卡 -------- */
.farm-map-entry {
  position: relative;
  display: flex;
  align-items: center;
  margin: 32rpx 24rpx 0;
  padding: 32rpx 30rpx;
  border-radius: 28rpx;
  background: var(--glass-strong);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border-teal);
  overflow: hidden;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.farm-map-entry:active {
  opacity: 0.92;
}

.farm-map-entry-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.farm-map-entry-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #f5f9f9;
}

.farm-map-entry-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba(245, 249, 249, 0.72);
}

.farm-map-entry-btn {
  display: inline-block;
  margin-top: 24rpx;
  padding: 12rpx 30rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #d4af37, #b8922e);
  color: #142b2b;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 20rpx rgba(6, 24, 24, 0.35), 0 0 0 2rpx rgba(212, 175, 55, 0.25);
}

.farm-map-entry-visual {
  position: relative;
  flex-shrink: 0;
  width: 120rpx;
  height: 260rpx;
  margin-left: 20rpx;
}

.farm-map-entry-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.farm-map-entry-shape {
  fill: rgba(95, 180, 180, 0.32);
  stroke: #7cc6c6;
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.farm-map-entry-dot {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #d4af37;
  border: 3rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2rpx 8rpx rgba(6, 24, 24, 0.35);
}

/* -------- P2 首页动态（社区感） -------- */
.farm-feed {
  margin: 48rpx 32rpx 0;
}

.farm-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.farm-feed-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--heli-text, #f5f9f9);
  position: relative;
  padding-left: 28rpx;
}

.farm-feed-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 32rpx;
  background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
  border-radius: 4rpx;
}

.farm-feed-more {
  font-size: 26rpx;
  color: rgba(95, 180, 180, 0.9);
}

.farm-feed-card {
  margin-bottom: 28rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 16rpx 40rpx rgba(6, 24, 24, 0.35), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.farm-feed-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.farm-feed-badge {
  font-size: 26rpx;
  font-weight: 600;
  color: #e8c96a;
}

.farm-feed-badge-teal {
  color: #7cc6c6;
}

.farm-feed-badge-gold {
  color: #e8c96a;
}

.farm-feed-card-more {
  font-size: 24rpx;
  color: rgba(245, 249, 249, 0.6);
}

.farm-feed-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.08);
}

.farm-feed-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.farm-feed-item:first-child {
  padding-top: 0;
}

.farm-feed-item-main {
  flex: 1;
  min-width: 0;
}

.farm-feed-item-text {
  display: block;
  font-size: 28rpx;
  color: #f5f9f9;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.farm-feed-item-meta {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.farm-feed-item-user {
  font-size: 24rpx;
  color: rgba(245, 249, 249, 0.6);
}

.farm-feed-item-like {
  margin-left: 20rpx;
  font-size: 24rpx;
  color: #e8c96a;
}

/* -------- P5 宁夏特产年货入口（冬） -------- */
.farm-specialties {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32rpx 32rpx 0;
  padding: 32rpx 36rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(47, 143, 143, 0.28), rgba(26, 92, 92, 0.4));
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(232, 201, 106, 0.35);
  box-shadow: 0 16rpx 40rpx rgba(6, 24, 24, 0.35), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.farm-specialties-info {
  flex: 1;
  min-width: 0;
}

.farm-specialties-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #f5f9f9;
}

.farm-specialties-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: rgba(245, 249, 249, 0.72);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.farm-specialties-btn {
  display: inline-block;
  margin-top: 20rpx;
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #d4af37, #b8922e);
  color: #142b2b;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 16rpx rgba(6, 24, 24, 0.3);
}

.farm-specialties-emojis {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 20rpx;
  flex-shrink: 0;
}

.farm-specialties-emoji {
  font-size: 44rpx;
  line-height: 1.4;
  filter: drop-shadow(0 4rpx 10rpx rgba(6, 24, 24, 0.4));
}

/* -------- 与原首页内容的间距调整（树信息卡 / 领养按钮不再下沉） -------- */
.page .tree {
  margin-top: 40rpx;
}

.page .btn {
  margin-top: 48rpx;
}

/* -------- 修复 uni-app H5 滚动后点击失效 --------
   uni-row/uni-col 栅格组件在滚动后 hit-test 与视觉位置错位，
   将可交互块改为普通 view 布局（等价 span=20 offset=2 的左右边距）。 */
.plain-block {
  margin: 0 8.33%;
}
</style>
