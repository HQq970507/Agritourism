<script setup>
import { ref } from "vue";
import { useTokenStore } from "../../../stores/token";
import { BaseUrl } from "../../../common/request";
import { NewAccesstoken } from "../../../common/request";
import AutoBack from "../../../components/AutoBack.vue";

const tokenStore = useTokenStore();

// 模拟收藏数据
const posts = ref([
  {
    id: 1,
    title: "家校共育经验分享：如何培养孩子自主学习能力",
    cover: "https://picsum.photos/600/400?1",
    user: {
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      username: "李老师",
    },
    type: "日常",
    likeCount: 245,
    commentCount: 89,
    liked: true,
  },
]);

// 跳转到帖子详情
const goToDetail = (postId) => {
  uni.navigateTo({
    url: `/pages/forum/forumDetail/index?postId=${postId}`,
  });
};

const getCollectInfo = async () => {
  uni.showLoading({
    title: "加载中",
  });
  const verify = await NewAccesstoken();
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/posts/myCollect`,
        method: "GET",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
      });
      if (res.data.status !== 200) {
        throw new Error(res.data.message);
      }
      posts.value = res.data.data;
      posts.value.forEach((post) => {
        post.liked = true;
      });
    } catch (error) {
      console.log(error);
      uni.showToast({
        title: "请求错误",
        icon: "error",
      });
    } finally {
      uni.hideLoading();
    }
  } else {
    uni.hideLoading();
  }
};

getCollectInfo();
</script>

<template>
  <view class="favorites-container">
    <AutoBack />
    <!-- 收藏列表 -->
    <scroll-view scroll-y class="post-list">
      <view
        v-for="(post, index) in posts"
        :key="index"
        class="post-card"
        @click="goToDetail(post.id)"
      >
        <!-- 作者信息 -->
        <view class="user-info">
          <image
            class="user-avatar"
            :src="post.user.avatar"
            mode="aspectFill"
          />
          <text class="user-name">{{ post.user.username }}</text>
          <view class="time-tag">
            {{ post.type }}
          </view>
        </view>

        <!-- 帖子内容 -->
        <text class="post-title">{{ post.title }}</text>
        <image
          v-if="post.cover"
          class="post-cover"
          :src="post.cover"
          mode="aspectFill"
        />

        <!-- 互动数据 -->
        <view class="interaction-bar">
          <view class="interaction-item">
            <uni-icons
              :type="post.liked ? 'heart-filled' : 'heart'"
              size="20"
              :color="post.liked ? '#d4af37' : 'rgba(245, 249, 249, 0.55)'"
            />
            <text>{{ post.likeCount }}</text>
          </view>
          <view class="interaction-item">
            <uni-icons type="chat" size="20" color="rgba(245, 249, 249, 0.55)" />
            <text>{{ post.commentCount }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <TabBar role="parents" />
  </view>
</template>

<style lang="scss" scoped>
/* ===== 贺兰青 · 毛玻璃收藏页（与首页同一设计语言） ===== */
.favorites-container {
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
  padding: 32rpx;
  padding-bottom: 120rpx; // 增加底部内边距（根据TabBar实际高度调整）
  box-sizing: border-box;

  .post-list {
    .post-card {
      background: var(--glass-strong);
      backdrop-filter: blur(20rpx);
      -webkit-backdrop-filter: blur(20rpx);
      border: 2rpx solid var(--glass-border);
      border-radius: 24rpx;
      padding: 32rpx;
      margin-bottom: 32rpx;
      box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);

      .user-info {
        display: flex;
        align-items: center;
        margin-bottom: 24rpx;
        position: relative;

        .user-avatar {
          width: 72rpx;
          height: 72rpx;
          border-radius: 50%;
          margin-right: 16rpx;
          border: 2rpx solid rgba(232, 201, 106, 0.55);
        }

        .user-name {
          font-size: 30rpx;
          color: var(--heli-text);
          font-weight: 600;
        }

        .time-tag {
          position: absolute;
          right: 0;
          background: rgba(212, 175, 55, 0.18);
          border: 2rpx solid rgba(212, 175, 55, 0.4);
          padding: 8rpx 16rpx;
          border-radius: 999rpx;
          font-size: 24rpx;
          color: var(--heli-gold-soft);
        }
      }

      .post-title {
        display: block;
        font-size: 34rpx;
        color: var(--heli-text);
        line-height: 1.4;
        margin-bottom: 24rpx;
        font-weight: 600;
      }

      .post-cover {
        width: 100%;
        height: 400rpx;
        border-radius: 16rpx;
        margin-bottom: 24rpx;
        border: 2rpx solid var(--glass-border);
      }

      .interaction-bar {
        display: flex;
        gap: 48rpx;
        padding-top: 24rpx;
        border-top: 2rpx solid var(--glass-border);

        .interaction-item {
          display: flex;
          align-items: center;
          color: rgba(245, 249, 249, 0.62);

          uni-icons {
            margin-right: 12rpx;
          }

          text {
            font-size: 26rpx;
          }
        }
      }
    }
  }
}
</style>
