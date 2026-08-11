<template>
  <view class="tab-bar-container">
    <!-- 用户端导航 -->
    <view v-if="role === 'user'" class="tab-bar user-tab-bar">
      <view
        v-for="(item, index) in userTab"
        :key="index"
        class="tab-item"
        :class="{ active: activeIndex === index }"
        @click="switchTab(item, index)"
      >
        <image
          :src="activeIndex === index ? item.selectedIconPath : item.iconPath"
          class="tab-icon"
        />
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>

    <!-- 管理员导航 -->
    <view v-if="role === 'teacher'" class="tab-bar admin-tab-bar">
      <view
        v-for="(item, index) in teacherTabs"
        :key="index"
        class="tab-item"
        :class="{ active: activeIndex === index }"
        @click="switchTab(item, index)"
      >
        <image
          :src="activeIndex === index ? item.selectedIconPath : item.iconPath"
          class="tab-icon"
        />
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";

// 定义组件属性
const props = defineProps({
  role: {
    type: String,
    default: "user",
  },
});

// 当前激活的标签索引
const activeIndex = ref(0);
// 当前路由
const currentRoute = ref("");

// 用户导航配置（农旅认领版）
const userTab = [
  {
    pagePath: "pages/index/index",
    iconPath: "/static/images/index.png",
    selectedIconPath: "/static/images/index.png",
    text: "首页",
  },
  {
    pagePath: "pages/adoption/AdoptionList/AdoptionList",
    iconPath: "/static/images/notice.png",
    selectedIconPath: "/static/images/notice.png",
    text: "认领",
  },
  {
    pagePath: "pages/journey/JourneyList/JourneyList",
    iconPath: "/static/images/forum.png",
    selectedIconPath: "/static/images/forum.png",
    text: "旅程",
  },
  {
    pagePath: "pages/farm/FarmMap/FarmMap",
    iconPath: "/static/images/service.png",
    selectedIconPath: "/static/images/service.png",
    text: "采摘园",
  },
  {
    pagePath: "pages/user/center/center",
    iconPath: "/static/images/user.png",
    selectedIconPath: "/static/images/user.png",
    text: "我的",
  },
];

// 管理员导航配置
const teacherTabs = [
  {
    pagePath: "pages/teacher/student/index",
    iconPath: "/static/images/service.png",
    selectedIconPath: "/static/images/service.png",
    text: "学生行为",
  },
  {
    pagePath: "pages/teacher/activity/index",
    iconPath: "/static/images/index.png",
    selectedIconPath: "/static/images/index.png",
    text: "家校活动",
  },
  {
    pagePath: "pages/teacher/feedback/index",
    iconPath: "/static/images/notice.png",
    selectedIconPath: "/static/images/notice.png",
    text: "家校反馈",
  },

  {
    pagePath: "pages/teacher/chat/index",
    iconPath: "/static/images/forum.png",
    selectedIconPath: "/static/images/forum.png",
    text: "家长私信",
  },
];

// 监听页面显示更新激活状态
onShow(() => {
  const pages = getCurrentPages();
  if (pages.length === 0) return;
  currentRoute.value = pages[pages.length - 1].route;
  updateActiveIndex();
});
// 更新激活状态（用 function 声明而非 const 箭头函数，避免 onShow 同步触发时的 TDZ 报错）
function updateActiveIndex() {
  // 根据角色选择对应的标签配置
  const tabs = props.role === "user" ? userTab : teacherTabs;
  const currentPath = currentRoute.value;
  // 查找当前路由对应的标签索引
  const index = tabs.findIndex((tab) => {
    const tabPath = tab.pagePath.replace(/^\//, ""); // 移除路径前的斜杠
    return currentPath === tabPath;
  });

  // 当前页不在导航中时置 -1（无激活 tab），避免误拦截同 index 的点击
  activeIndex.value = index >= 0 ? index : -1;
};
// 切换标签
const switchTab = (item, index) => {
  // 仅当当前页面就是该 tab 目标页时才跳过，避免 activeIndex 失准时误拦截
  const targetPath = item.pagePath.replace(/^\//, "");
  if (currentRoute.value === targetPath) return;
  // pagePath 形如 "pages/index/index"，redirectTo 需要以 / 开头，统一拼一次
  const url = `/${item.pagePath}`;
  if (props.role === "user") {
    // 如果是用户
    uni.redirectTo({
      url,
      success: () => {
        activeIndex.value = index; // 保持即时更新
      },
    });
  } else if (props.role === "teacher") {
    // 如果是管理员
    uni.redirectTo({
      url,
      success: () => {
        activeIndex.value = index; // 保持即时更新
      },
    });
  }
};
</script>

<style lang="scss" scoped>
.tab-bar-container {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 -4rpx 12rpx rgba(13, 40, 40, 0.08);
  z-index: 999;
  padding-bottom: 55rpx;
}

.tab-bar {
  display: flex;
  height: 100%;
  padding: 16rpx 0;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .tab-icon {
      width: 68rpx;
      height: 68rpx;
      margin-bottom: 8rpx;
    }

    .tab-text {
      font-size: 20rpx;
      line-height: 1;
    }

    &.active {
      .tab-text {
        color: #2f8f8f;
        font-weight: 500;
      }
    }
  }
}

.admin-tab-bar {
  .tab-item.active .tab-text {
    color: #5222ff;
  }
}
</style>
