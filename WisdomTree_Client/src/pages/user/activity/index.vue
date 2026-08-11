<script setup>
import { ref, computed } from "vue";
import { useTokenStore } from "../../../stores/token";
import { BaseUrl } from "../../../common/request";
import { NewAccesstoken } from "../../../common/request";
import dayjs from "dayjs";
import AutoBack from "../../../components/AutoBack.vue";

const tokenStore = useTokenStore();

const activeTab = ref(0);
const tabs = ["全部", "未开始", "进行中", "已结束"];
const searchText = ref("");
const selectedActivity = ref(null);
const detailPopup = ref(null);

// 状态标签映射
const statusLabels = {
  upcoming: "未开始",
  ongoing: "进行中",
  ended: "已结束",
};

// 模拟活动数据
const activities = ref([
  {
    cover: "https://picsum.photos/300/200?1",
    title: "校园科技文化节",
    description:
      "年度科技创新成果展示与交流活动，包含机器人竞赛、科技作品展览等环节",
    startTime: "2025-03-01 09:00",
    endTime: "2025-03-05 17:00",
    location: "学校大礼堂",
    participated: 150,
    capacity: 200,
    status: "upcoming",
  },
  // 更多测试数据...
]);

const fetchActivityList = async () => {
  uni.showLoading({
    title: "加载中",
  });
  const verify = await NewAccesstoken();
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/activity/signUpList`,
        method: "GET",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
      });
      if (res.data.status !== 200) {
        throw new Error(res.data.message);
      }
      activities.value = res.data.data.map((item) => ({
        id: item.id, // 活动 ID
        cover: item.coverImageUrl, // 封面图片 URL
        title: item.title, // 活动标题
        description: item.content, // 活动详情
        startTime: item.startTime,
        endTime: item.endTime, // 格式化结束时间
        location: item.location, // 活动地点
        participated: item.currentCapacity, // 当前参与人数
        capacity: item.plannedCapacity, // 总容量
      }));
    } catch (error) {
      console.log(error);
      uni.showToast({
        title: "请求失败",
        icon: "error",
      });
    } finally {
      uni.hideLoading();
    }
  } else {
    uni.hideLoading();
  }
};

// 处理活动状态
const processedActivities = computed(() => {
  const now = dayjs();
  return activities.value.map((activity) => {
    const start = dayjs(activity.startTime);
    const end = dayjs(activity.endTime);

    let status = "ended";
    if (now.isBefore(start)) {
      status = "upcoming";
    } else if (now.isAfter(start) && now.isBefore(end)) {
      status = "ongoing";
    }

    return {
      ...activity,
      status,
    };
  });
});

// 筛选后的活动列表
const filteredActivities = computed(() => {
  return processedActivities.value.filter((activity) => {
    // 搜索条件
    const matchSearch =
      activity.title.includes(searchText.value) ||
      activity.description.includes(searchText.value);

    // 状态筛选
    const statusFilter =
      activeTab.value === 0
        ? true
        : activeTab.value === 1
        ? activity.status === "upcoming"
        : activeTab.value === 2
        ? activity.status === "ongoing"
        : activity.status === "ended";

    return matchSearch && statusFilter;
  });
});

// 时间格式化
const formatTime = (timeStr) => {
  return dayjs(timeStr).format("MM-DD HH:mm");
};

// 打开详情弹窗
const showDetail = (activity) => {
  selectedActivity.value = activity;
  detailPopup.value.open();
};

// 关闭详情弹窗
const closeDetail = () => {
  detailPopup.value.close();
  selectedActivity.value = null;
};

fetchActivityList();
</script>

<template>
  <view class="activity-container">
    <AutoBack />
    <!-- 搜索和筛选 -->
    <view class="activity-header">
      <view class="search-box">
        <uni-icons type="search" size="22" color="rgba(245, 249, 249, 0.5)" />
        <input v-model="searchText" placeholder="搜索活动名称" />
        <button class="filter-btn">
          <uni-icons type="funnel" size="22" color="#5fb4b4" />
        </button>
      </view>
      <view class="status-tabs">
        <text
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['tab', activeTab === index && 'active']"
          @click="activeTab = index"
        >
          {{ tab }}
        </text>
      </view>
    </view>

    <!-- 活动列表 -->
    <scroll-view scroll-y class="activity-list">
      <view
        v-for="(activity, index) in filteredActivities"
        :key="index"
        class="activity-card"
      >
        <image class="cover" :src="activity.cover" mode="aspectFill" />
        <view class="content">
          <view class="header">
            <text class="title">{{ activity.title }}</text>
            <view :class="['status', activity.status]">
              {{ statusLabels[activity.status] }}
            </view>
          </view>

          <view class="meta">
            <view class="meta-item">
              <uni-icons type="calendar" size="18" color="#5fb4b4" />
              <text
                >{{ formatTime(activity.startTime) }} -
                {{ formatTime(activity.endTime) }}</text
              >
            </view>
            <view class="meta-item">
              <uni-icons type="location" size="18" color="#5fb4b4" />
              <text>{{ activity.location }}</text>
            </view>
          </view>

          <view class="progress">
            <view class="progress-bar">
              <view
                class="progress-fill"
                :style="{
                  width:
                    (activity.participated / activity.capacity) * 100 + '%',
                }"
              />
            </view>
            <text class="progress-text">
              已参与 {{ activity.participated }}/{{ activity.capacity }} 人
            </text>
          </view>

          <view class="footer">
            <button class="action-btn" @click="showDetail(activity)">
              查看详情
            </button>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 活动详情弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="detail-popup" v-if="selectedActivity">
        <image class="popup-cover" :src="selectedActivity.cover" />
        <view class="popup-content">
          <text class="popup-title">{{ selectedActivity.title }}</text>

          <view class="info-item">
            <uni-icons type="calendar" size="20" color="#5fb4b4" />
            <text
              >{{ formatTime(selectedActivity.startTime) }} 至
              {{ formatTime(selectedActivity.endTime) }}</text
            >
          </view>

          <view class="info-item">
            <uni-icons type="location" size="20" color="#5fb4b4" />
            <text>{{ selectedActivity.location }}</text>
          </view>

          <view class="info-item">
            <uni-icons type="person" size="20" color="#5fb4b4" />
            <text
              >已参与 {{ selectedActivity.participated }}/{{
                selectedActivity.capacity
              }}
              人</text
            >
          </view>

          <view class="description">
            <text class="label">活动详情：</text>
            <text>{{ selectedActivity.description }}</text>
          </view>

          <button class="close-btn" @click="closeDetail">关闭</button>
        </view>
      </view>
    </uni-popup>

    <TabBar role="parents" />
  </view>
</template>

<style lang="scss" scoped>
/* ===== 贺兰青 · 毛玻璃活动页（与首页同一设计语言） ===== */
.activity-container {
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

  background: linear-gradient(180deg, #0d2828 0%, #123f3f 45%, #1a5c5c 100%);
  min-height: 100vh; // 改用最小高度
  padding: 24rpx;
  padding-bottom: 160rpx;
  box-sizing: border-box;
  color: var(--heli-text);

  .activity-header {
    margin-bottom: 32rpx;

    .search-box {
      display: flex;
      align-items: center;
      background: var(--glass-strong);
      backdrop-filter: blur(20rpx);
      -webkit-backdrop-filter: blur(20rpx);
      border: 2rpx solid var(--glass-border);
      border-radius: 48rpx;
      padding: 24rpx 32rpx;
      box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);

      input {
        flex: 1;
        margin: 0 24rpx;
        font-size: 28rpx;
        color: var(--heli-text);
      }

      input::placeholder {
        color: rgba(245, 249, 249, 0.45);
      }

      .filter-btn {
        padding: 0;
        background: transparent;
        line-height: 1;
        color: var(--heli-light);
      }
    }

    .status-tabs {
      display: flex;
      margin-top: 32rpx;
      padding: 10rpx;
      border-radius: 999rpx;
      background: var(--glass);
      backdrop-filter: blur(16rpx);
      -webkit-backdrop-filter: blur(16rpx);
      border: 2rpx solid var(--glass-border);

      .tab {
        flex: 1;
        text-align: center;
        padding: 22rpx;
        font-size: 28rpx;
        color: rgba(245, 249, 249, 0.6);
        position: relative;
        border-radius: 999rpx;
        transition: all 0.3s;

        &.active {
          color: var(--heli-text);
          font-weight: 600;
          background: rgba(47, 143, 143, 0.55);
          box-shadow: 0 6rpx 18rpx rgba(6, 24, 24, 0.3);
        }
      }
    }
  }

  .activity-list {
    .activity-card {
      background: var(--glass-strong);
      backdrop-filter: blur(20rpx);
      -webkit-backdrop-filter: blur(20rpx);
      border: 2rpx solid var(--glass-border);
      border-radius: 24rpx;
      margin-bottom: 32rpx;
      overflow: hidden;
      box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);

      .cover {
        width: 100%;
        height: 320rpx;
      }

      .content {
        padding: 32rpx;

        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24rpx;

          .title {
            font-size: 34rpx;
            font-weight: 600;
            color: var(--heli-text);
            flex: 1;
          }

          .status {
            font-size: 24rpx;
            padding: 8rpx 16rpx;
            border-radius: 999rpx;
            margin-left: 24rpx;
            font-weight: 500;

            &.upcoming {
              background: rgba(232, 201, 106, 0.16);
              color: #e8c96a;
            }

            &.ongoing {
              background: rgba(95, 180, 180, 0.16);
              color: #7fd0d0;
            }

            &.ended {
              background: rgba(255, 255, 255, 0.1);
              color: rgba(245, 249, 249, 0.55);
            }
          }
        }

        .meta-item {
          display: flex;
          align-items: center;
          margin-bottom: 16rpx;
          color: var(--heli-muted);
          font-size: 26rpx;

          uni-icons {
            margin-right: 12rpx;
          }
        }

        .progress {
          margin: 32rpx 0;

          &-bar {
            height: 12rpx;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 6rpx;
            overflow: hidden;
          }

          &-fill {
            height: 100%;
            background: linear-gradient(90deg, #2f8f8f, #5fb4b4);
            border-radius: 6rpx;
            transition: width 0.5s ease;
          }

          &-text {
            display: block;
            margin-top: 12rpx;
            font-size: 24rpx;
            color: var(--heli-muted);
          }
        }

        .footer {
          display: flex;
          justify-content: flex-end;

          .action-btn {
            width: 50%;
            background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
            color: #fff;
            border-radius: 999rpx;
            padding: 14rpx 32rpx;
            font-size: 30rpx;
            font-weight: 600;
            border: none;
            box-shadow: 0 8rpx 20rpx rgba(6, 24, 24, 0.35), 0 0 0 2rpx rgba(212, 175, 55, 0.25);

            &::after {
              border: none;
            }
          }
        }
      }
    }
  }

  .detail-popup {
    width: 80vw;
    background: rgba(16, 47, 47, 0.92);
    backdrop-filter: blur(24rpx);
    -webkit-backdrop-filter: blur(24rpx);
    border: 2rpx solid var(--glass-border);
    border-radius: 32rpx;
    overflow: hidden;
    box-shadow: 0 24rpx 64rpx rgba(6, 24, 24, 0.5);

    .popup-cover {
      width: 100%;
      height: 300rpx;
    }

    .popup-content {
      padding: 32rpx;
      color: var(--heli-text);

      .popup-title {
        display: block;
        font-size: 36rpx;
        font-weight: 700;
        color: var(--heli-text);
        margin-bottom: 24rpx;
      }

      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 24rpx;
        font-size: 28rpx;
        color: rgba(245, 249, 249, 0.8);

        uni-icons {
          margin-right: 12rpx;
          flex-shrink: 0;
        }
      }

      .description {
        margin: 32rpx 0;
        font-size: 28rpx;
        line-height: 1.6;
        color: rgba(245, 249, 249, 0.8);

        .label {
          color: var(--heli-gold-soft);
          font-weight: 600;
          margin-right: 12rpx;
        }
      }

      .close-btn {
        background: var(--glass);
        color: var(--heli-text);
        border: 2rpx solid var(--glass-border);
        border-radius: 999rpx;
        padding: 16rpx 0;
        width: 100%;
        margin-top: 32rpx;
        font-weight: 500;

        &::after {
          border: none;
        }
      }
    }
  }
}

/* 全局弹窗样式 */
::v-deep .uni-popup__wrapper-box {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10rpx);
}
</style>
