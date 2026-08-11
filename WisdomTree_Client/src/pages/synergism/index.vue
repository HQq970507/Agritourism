<script setup>
import { ref, onMounted } from "vue";
import TabBar from "@/components/TabBar.vue";
import { useTokenStore } from "../../stores/token";
import { BaseUrl } from "../../common/request";
import { NewAccesstoken } from "../../common/request";
import dayjs from "dayjs";
import StatusBar from "../../components/StatusBar.vue";

const tokenStore = useTokenStore();

// 活动数据，包含活动的封面、标题、日期、地点和详细信息
const activities = ref([
  {
    id: 1,
    cover:
      "https://huacheng.gz-cmc.com/upload/news/image/2023/05/30/1685436380197019851.jpg",
    title: "亲子运动会",
    date: "03月20日 14:00",
    location: "学校操场",
    detail:
      "本次活动旨在通过亲子互动游戏，增进家长与孩子之间的感情。活动包括接力赛跑、拔河比赛等项目，适合所有年龄段的家庭参与。",
  },
  {
    id: 2,
    cover:
      "https://img.tukuppt.com/preview/00/87/39/42/87394263e9f189dcb12show.jpg",
    title: "家庭教育讲座",
    date: "03月25日 09:00",
    location: "线上直播",
    detail:
      "本次讲座邀请了知名教育专家，分享如何培养孩子的自律能力、学习习惯以及情绪管理技巧。家长可以通过直播平台与讲师互动。",
  },
]);

// 资源分类标签
const resourceTabs = ["推荐", "文章", "视频"];
// 当前选中的资源分类索引
const resCategory = ref(0);

/**
 * 切换资源分类
 * @param {number} index - 分类索引，0 表示推荐，1 表示文章，2 表示视频
 * 根据分类索引筛选资源数据并更新 resources
 */
const changeResCategory = (index) => {
  resCategory.value = index;
  // 筛选逻辑：推荐显示全部，其他分类根据类型筛选
  resources.value = originalResources.filter((item) => {
    if (index === 0) return true; // 推荐显示全部
    return item.type === ["article", "video"][index - 1];
  });
};

// 原始资源数据，包含封面、标题、副标题、类型和链接
const originalResources = [
  {
    cover:
      "https://ts3.tc.mm.bing.net/th/id/OIP-C.s-WxtkP2HbjDTNB833QFPwHaE8?rs=1&pid=ImgDetMain",
    title: "看见此次大风带起的沙尘，你还觉得植树的意义小吗？",
    subtitle: "沙尘暴罕见如川",
    type: "article",
    url: "https://www.zhihu.com/question/1894530037010637398/answer/1894682148633564604",
  },
  {
    cover:
      "https://i0.hdslb.com/bfs/archive/3cdb8a288666ab24e9b2b415ec79f7e330c1bfc9.jpg@672w_378h_1c_!web-search-common-cover.avif",
    title: "说到环保，中国笑了",
    subtitle: "中国的环保底气",
    type: "video",
    url: "https://www.bilibili.com/video/BV1XA411P7Cw/?spm_id_from=333.337.search-card.all.click&vd_source=f467f9ffd54967c3f21b48a0c9f3604c",
  },
  {
    cover:
      "https://ts1.tc.mm.bing.net/th/id/R-C.4b792993949ea735cfc6482ecdab4866?rik=w0rKlf9kmrVo1A&riu=http%3a%2f%2fwww.daqihj.com%2fuploadfile%2f20190605%2f1559703117236162.jpg&ehk=iXDeIMp5Anr%2bcwveB1W%2flDdLr3TDUfUW0KT56fhu2XA%3d&risl=&pid=ImgRaw&r=0",
    title: "为什么提倡环保许久但环境依然恶化？",
    subtitle: "一直环保但没效果",
    type: "article",
    url: "https://www.zhihu.com/question/412130069/answer/1385565111",
  },
  {
    cover:
      "https://i0.hdslb.com/bfs/archive/9bc01ebe02e1335fbc7966286992a3a7f24603dc.jpg@672w_378h_1c_!web-search-common-cover",
    title: "全球碳排放真相？西方虚伪环保，嘴里主义心里全是生意",
    subtitle: "虚伪的西方环保",
    type: "video",
    url: "https://www.bilibili.com/video/BV17v9MY8EAr/?spm_id_from=333.337.search-card.all.click",
  },
];
// 当前显示的资源数据
const resources = ref([...originalResources]);

/**
 * 处理资源点击事件
 * @param {Object} item - 被点击的资源对象，包含封面、标题、副标题、类型和链接
 * 如果资源链接为空，提示暂未开放；否则弹出确认框，用户确认后跳转到外部链接
 */
const handleResourceClick = (item) => {
  if (!item.url) {
    uni.showToast({ title: "暂未开放", icon: "none" });
    return;
  }

  uni.showModal({
    title: "即将打开外部链接",
    content: "是否要打开外部网站？",
    success(res) {
      if (res.confirm) {
        uni.navigateTo({
          url: `/pages/webview/index?url=${item.url}`,
        });
      }
    },
  });
};

// 弹窗实例
const detailPopup = ref();

// 当前选中的活动
const currentActivity = ref({});

/**
 * 查询全部活动列表
 */
const fetchActivityList = async () => {
  uni.showLoading({ title: "加载中" });
  const verify = await NewAccesstoken();
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/activity/list`,
        method: "GET",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
      });
      if (res.data.status !== 200) {
        throw new Error(res.data.message);
      }
      activities.value = res.data.data.map((item) => ({
        id: item.id,
        cover: item.coverImageUrl,
        title: item.title,
        date: dayjs(item.startTime).format("YYYY-MM-DD HH:mm"),
        location: item.location,
        detail: item.content,
      }));
    } catch (error) {
      console.log(error);
      uni.showToast({ title: "请求失败", icon: "error" });
    } finally {
      uni.hideLoading();
    }
  } else {
    uni.hideLoading();
  }
};

/**
 * 打开活动详情弹窗
 * @param {Object} item - 活动对象，包含活动的详细信息
 * 设置当前活动并打开弹窗
 */
const showApply = (item) => {
  currentActivity.value = item;
  detailPopup.value.open();
};

/**
 * 关闭活动详情弹窗
 * 调用弹窗实例的关闭方法
 */
const closeDetail = () => {
  detailPopup.value.close();
};

/**
 * 报名活动
 */
const submitApply = async () => {
  uni.showLoading({ title: "提交中" });
  const verify = await NewAccesstoken();
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/activity/signUp`,
        method: "POST",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
        data: {
          id: currentActivity.value.id,
        },
      });
      if (res.data.code === 0) {
        uni.hideLoading();
        uni.showToast({
          title: "报名成功，环保能量增加了5g哟🤩",
          icon: "none",
        });
        closeDetail();
      } else if (res.data.code === 1) {
        uni.hideLoading();
        uni.showToast({ title: "您已报名", icon: "none" });
      } else if (res.data.code === 2) {
        uni.hideLoading();
        uni.showToast({ title: "活动已满", icon: "none" });
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      uni.hideLoading();
      uni.showToast({ title: "报名失败", icon: "error" });
    }
  } else {
    uni.hideLoading();
  }
};

// 初始化获取活动列表
onMounted(() => {
  fetchActivityList();
});
</script>

<template>
  <view class="container">
    <StatusBar />
    <!-- 顶部导航 -->
    <view class="header">
      <view class="main-title">
        <view class="title-decor">
          <view class="decor-line"></view>
          <text class="title-text">环保活动</text>
        </view>
        <text class="sub-title">共建共享绿色校园，参与精彩环保活动</text>
      </view>
      <uni-icons type="notification" size="32" color="#5fb4b4" />
    </view>

    <!-- 活动模块修改为垂直排列 -->
    <view class="section">
      <!-- 育人活动标题 -->
      <view class="section-header activity-header">
        <view class="title-wrapper">
          <text class="decor-line"></text>
          <text class="section-title">绿色活动</text>
        </view>
        <view class="more-link">
          <text>查看全部</text>
          <uni-icons type="arrowright" size="16" color="#5fb4b4" />
        </view>
      </view>

      <view class="vertical-activity-list">
        <view
          v-for="(item, index) in activities"
          :key="index"
          class="vertical-activity-card"
        >
          <image :src="item.cover" class="v-cover" mode="aspectFill" />
          <view class="v-content">
            <text class="v-title">{{ item.title }}</text>
            <view class="v-meta">
              <view class="v-meta-item">
                <uni-icons type="calendar" size="14" color="#fff" />
                <text class="v-date" style="margin-left: 10rpx">{{
                  item.date
                }}</text>
              </view>
              <view class="v-meta-item">
                <uni-icons type="location" size="14" color="#fff" />
                <text class="v-location">{{ item.location }}</text>
              </view>
            </view>
            <button class="v-apply-btn" @click="showApply(item)">
              立即报名
              <uni-icons type="arrow-right" size="14" color="#fff" />
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 资源模块 -->
    <view class="section zy">
      <view class="section-header resource-header">
        <view class="title-wrapper">
          <text class="decor-line"></text>
          <text class="section-title">知识科普</text>
        </view>

        <!-- 优化后的分类筛选 -->
        <view class="category-filter">
          <view
            v-for="(tab, index) in resourceTabs"
            :key="index"
            class="filter-item"
            :class="{ active: resCategory === index }"
            @click="changeResCategory(index)"
          >
            {{ tab }}
          </view>
        </view>
      </view>

      <view class="resource-grid">
        <view
          v-for="(item, index) in resources"
          :key="index"
          class="resource-card"
          @click="handleResourceClick(item)"
        >
          <image :src="item.cover" class="res-cover" mode="aspectFill" />
          <view class="badge" v-if="item.type === 'video'">
            <uni-icons type="videocam" size="16" color="#fff" />
          </view>
          <text class="res-title">{{ item.title }}</text>
          <text class="res-subtitle">{{ item.subtitle }}</text>
        </view>
      </view>
    </view>

    <!-- 修改后的申请弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="detail-dialog">
        <!-- 顶部关闭按钮 -->
        <uni-icons
          type="close"
          size="24"
          color="#999"
          class="close-btn"
          @click="closeDetail"
        />

        <!-- 弹窗内容 -->
        <view class="dialog-content">
          <!-- 活动封面 -->
          <image
            :src="currentActivity.cover"
            class="detail-cover"
            mode="aspectFill"
          />

          <!-- 活动信息 -->
          <view class="activity-info">
            <text class="detail-title">{{ currentActivity.title }}</text>

            <view class="info-item">
              <uni-icons type="calendar" size="18" color="#5fb4b4" />
              <text class="info-text">{{ currentActivity.date }}</text>
            </view>

            <view class="info-item">
              <uni-icons type="location" size="18" color="#5fb4b4" />
              <text class="info-text">{{ currentActivity.location }}</text>
            </view>

            <view class="detail-section">
              <text class="section-title">活动详情</text>
              <scroll-view scroll-y class="detail-scroll">
                <text class="detail-desc">{{ currentActivity.detail }}</text>
              </scroll-view>
            </view>
          </view>

          <!-- 底部操作区 -->
          <view class="action-bar">
            <!-- <input
              v-model="applyForm.name"
              placeholder="请输入家长姓名"
              class="name-input"
            /> -->
            <button class="submit-btn" @click="submitApply">
              立即参加
              <uni-icons type="arrow-right" size="16" color="#fff" />
            </button>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>

  <TabBar role="user" />
</template>

<style lang="scss" scoped>
.container {
  /* ===== 贺兰青设计令牌（与首页 index.vue 一致） ===== */
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
  padding: 0rpx 30rpx;
  /* 贺兰青深色渐变背景 + 青金氛围光 */
  background:
    radial-gradient(1200rpx 800rpx at 88% -8%, rgba(95, 180, 180, 0.16) 0%, transparent 60%),
    radial-gradient(900rpx 700rpx at -12% 28%, rgba(26, 92, 92, 0.42) 0%, transparent 60%),
    radial-gradient(800rpx 700rpx at 82% 96%, rgba(212, 175, 55, 0.07) 0%, transparent 55%),
    linear-gradient(175deg, #0b2424 0%, #123a3a 52%, #0e2f2f 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;

  .title {
    font-size: 38rpx;
    font-weight: 600;
    color: var(--heli-text);
    letter-spacing: 1rpx;
  }
}

.section {
  margin-bottom: 50rpx;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 500;
      color: rgba(245, 249, 249, 0.9);
    }

    .more {
      color: rgba(245, 249, 249, 0.55);
      font-size: 26rpx;
    }
  }
}

// 活动卡片样式
.horizontal-scroll {
  white-space: nowrap;

  .activity-card {
    display: inline-block;
    width: 560rpx;
    height: 360rpx;
    margin-right: 30rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;

    .cover {
      width: 100%;
      height: 100%;
    }

    .card-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 30rpx;
      background: linear-gradient(transparent, rgba(6, 24, 24, 0.75));
      color: #fff;

      .activity-title {
        font-size: 32rpx;
        margin-bottom: 15rpx;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        line-clamp: 1;
        overflow: hidden;
      }

      .meta {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        font-size: 24rpx;

        .date {
          margin-left: 10rpx;
        }
      }

      .apply-btn {
        background: rgba(95, 180, 180, 0.25);
        border: 1rpx solid rgba(95, 180, 180, 0.5);
        color: #fff;
        font-size: 26rpx;
        height: 60rpx;
        line-height: 60rpx;
        border-radius: 40rpx;
      }
    }
  }
}

// 资源网格（毛玻璃卡）
.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;

  .resource-card {
    background: var(--glass);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    border: 2rpx solid var(--glass-border);
    border-radius: 24rpx;
    padding: 15rpx;
    position: relative;
    box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.1);

    .res-cover {
      width: 100%;
      height: 240rpx;
      border-radius: 12rpx;
      margin-bottom: 20rpx;
    }

    .badge {
      position: absolute;
      top: 30rpx;
      right: 30rpx;
      background: rgba(47, 143, 143, 0.85);
      padding: 8rpx 16rpx;
      border-radius: 40rpx;
      display: flex;
      align-items: center;
    }

    .res-title {
      font-size: 28rpx;
      color: rgba(245, 249, 249, 0.9);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      line-clamp: 1;
      overflow: hidden;
    }

    .res-subtitle {
      font-size: 24rpx;
      color: rgba(245, 249, 249, 0.55);
      margin-top: 10rpx;
    }
  }
}

// 活动详情弹窗（深色毛玻璃）
.detail-dialog {
  width: 680rpx;
  background: rgba(16, 48, 48, 0.92);
  backdrop-filter: blur(30rpx);
  -webkit-backdrop-filter: blur(30rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 28rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24rpx 64rpx rgba(6, 24, 24, 0.5), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);

  .close-btn {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    z-index: 2;
    padding: 12rpx;
  }

  .dialog-content {
    max-height: 80vh;
  }

  .detail-cover {
    width: 100%;
    height: 360rpx;
  }

  .activity-info {
    padding: 40rpx 32rpx;
  }

  .detail-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--heli-text);
    margin-bottom: 32rpx;
    display: block;
  }

  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;

    .info-text {
      font-size: 28rpx;
      color: rgba(245, 249, 249, 0.8);
      margin-left: 16rpx;
    }
  }

  .detail-section {
    margin-top: 40rpx;

    .section-title {
      font-size: 30rpx;
      color: #5fb4b4;
      font-weight: 500;
      padding-left: 16rpx;
      border-left: 6rpx solid #5fb4b4;
      margin-bottom: 24rpx;
      display: block;
    }
  }

  .detail-scroll {
    max-height: 240rpx;

    .detail-desc {
      font-size: 26rpx;
      color: rgba(245, 249, 249, 0.65);
      line-height: 1.6;
    }
  }

  .action-bar {
    display: flex;
    gap: 20rpx;
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.06);
    border-top: 1rpx solid var(--glass-border);

    .name-input {
      flex: 1;
      height: 80rpx;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      border: 1rpx solid rgba(255, 255, 255, 0.16);
      color: var(--heli-text);
    }

    .submit-btn {
      width: 240rpx;
      height: 80rpx;
      background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
      color: #fff;
      font-size: 28rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      uni-icons {
        margin-left: 12rpx;
      }
    }
  }
}
// 垂直排列的活动列表
.vertical-activity-list {
  padding: 0 20rpx;
}

.vertical-activity-card {
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(6, 24, 24, 0.35);
  position: relative;

  .v-cover {
    width: 100%;
    height: 360rpx;
  }

  .v-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30rpx;
    background: linear-gradient(transparent, rgba(6, 24, 24, 0.78));
    color: #fff;
  }

  .v-title {
    font-size: 32rpx;
    margin-bottom: 20rpx;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    line-clamp: 1;
    overflow: hidden;
  }

  .v-meta {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 30rpx;

    &-item {
      display: flex;
      align-items: center;
      font-size: 24rpx;
    }
  }

  .v-apply-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 72rpx;
    background: rgba(95, 180, 180, 0.25);
    border: 1rpx solid rgba(95, 180, 180, 0.5);
    color: #fff;
    font-size: 26rpx;
    border-radius: 40rpx;

    uni-icons {
      margin-left: 10rpx;
    }
  }
}

/* 统一标题样式 */
.section-header {
  padding: 30rpx 0;

  .title-wrapper {
    display: flex;
    align-items: center;

    .decor-line {
      width: 8rpx;
      height: 36rpx;
      background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
      border-radius: 4rpx;
      margin-right: 20rpx;
      box-shadow: 0 0 12rpx rgba(95, 180, 180, 0.5);
    }

    .section-title {
      font-size: 36rpx;
      font-weight: 600;
      color: var(--heli-text);
      letter-spacing: 1rpx;
      position: relative;
    }
  }

  /* 活动模块更多链接 */
  .more-link {
    display: flex;
    align-items: center;
    font-size: 26rpx;
    color: #5fb4b4;

    text {
      margin-right: 8rpx;
    }
  }
}

/* 资源分类筛选样式 */
.category-filter {
  display: flex;
  gap: 20rpx;

  .filter-item {
    padding: 12rpx 32rpx;
    border-radius: 40rpx;
    background: rgba(255, 255, 255, 0.08);
    border: 2rpx solid rgba(255, 255, 255, 0.1);
    color: rgba(245, 249, 249, 0.6);
    font-size: 26rpx;
    transition: all 0.3s;

    &.active {
      background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
      color: #fff;
      box-shadow: 0 6rpx 20rpx rgba(6, 24, 24, 0.4), 0 0 0 2rpx rgba(95, 180, 180, 0.3);
    }
  }
}

/* 资源卡片微调 */
.resource-card {
  padding: 24rpx;

  .res-title {
    font-size: 30rpx;
    margin: 16rpx 0 8rpx;
  }

  .res-subtitle {
    font-size: 24rpx;
    line-height: 1.4;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0 50rpx;

  .main-title {
    .title-decor {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .decor-line {
        width: 8rpx;
        height: 40rpx;
        background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
        border-radius: 4rpx;
        margin-right: 24rpx;
        box-shadow: 0 0 12rpx rgba(95, 180, 180, 0.5);
      }

      .title-text {
        font-size: 44rpx;
        font-weight: 700;
        color: var(--heli-text);
        letter-spacing: 1rpx;
        position: relative;
        line-height: 1.2;
      }
    }

    .sub-title {
      display: block;
      font-size: 28rpx;
      color: rgba(245, 249, 249, 0.6);
    }
  }

  /* 调整通知图标 */
  .uni-icons {
    margin-top: -20rpx; /* 视觉对齐 */
  }
}

.zy {
  padding-bottom: 180rpx;
}

.container {
  /* 顶部装饰线 */
  .header .main-title .decor-line {
    background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
  }

  /* 通知图标颜色 */
  .uni-icons[type="notification"] {
    color: #5fb4b4;
  }

  /* 分类筛选激活状态 */
  .category-filter .filter-item.active {
    background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
    box-shadow: 0 6rpx 20rpx rgba(6, 24, 24, 0.4), 0 0 0 2rpx rgba(95, 180, 180, 0.3);
  }

  /* 更多链接箭头颜色 */
  .more-link .uni-icons {
    color: #5fb4b4;
  }

  /* 弹窗样式 */
  .detail-dialog {
    .info-item .uni-icons {
      color: #5fb4b4;
    }

    .detail-section .section-title {
      color: #5fb4b4;
      border-left-color: #5fb4b4;
    }

    .submit-btn {
      background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
    }
  }

  /* 资源视频角标 */
  .badge {
    background: rgba(47, 143, 143, 0.85);
  }

  /* 分段标题装饰线 */
  .section-header .title-wrapper .decor-line {
    background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
  }

  /* 全局阴影调整 */
  .vertical-activity-card {
    box-shadow: 0 8rpx 24rpx rgba(6, 24, 24, 0.35);
  }
}
</style>
