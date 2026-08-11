<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { ref } from "vue";
import { BaseUrl } from "../../../common/request";

const imageStyles = ref({
  width: 65,
  height: 65,
  border: {
    radius: "50%",
    color: "#f0f0f0",
  },
});

// 表单数据
const fromdata = ref({
  avatar: "",
  username: "",
  password: "",
  phone: "",
});

// 表单校验
const rules = {
  username: {
    rules: [
      {
        required: true,
        errorMessage: "请输入用户名",
      },
    ],
  },
  password: {
    rules: [
      {
        required: true,
        errorMessage: "请输入密码",
      },
    ],
  },

  phone: {
    rules: [
      {
        required: true,
        errorMessage: "请输入手机号",
      },
      // 检验是否为手机号
      {
        pattern: /^1[3456789]\d{9}$/,
        errorMessage: "请输入正确的手机号",
      },
    ],
  },
};

// 表单实例引用
const form = ref(null);

// 上传头像
const select = async (e) => {
  // 检验图片大小不超过5mb
  if (e.tempFiles[0].size > 3 * 1024 * 1024) {
    uni.showToast({
      title: "不能超过3MB",
      icon: "error",
    });
    return;
  }
  const tempFilePaths = e.tempFilePaths;
  const res = await uni.uploadFile({
    url: `${BaseUrl}/file/upload`,
    filePath: tempFilePaths[0],
    name: "file",
  });
  const resdata = JSON.parse(res.data);
  fromdata.value.avatar = resdata.path;
};

// 删除头像
const del = (e) => {
  fromdata.value.avatar = "";
  console.log(fromdata.value.avatar);
};

// 提交函数
const submitForm = async () => {
  if (!form.value) return;

  // 执行验证
  const { valid, errors } = await form.value.validate();
  if (valid == null) {
    // 表单校验成功
    console.log("校验成功");
    submitFormToBack();
  } else {
    // 表单校验失败
    console.log("校验失败", errors);
  }
};

// 提交表单到后端
const submitFormToBack = async () => {
  try {
    //  微信登录获取 code
    const loginRes = await uni.login({
      provider: "weixin",
    });

    const res = await uni.request({
      url: `${BaseUrl}/user/create`,
      method: "POST",
      data: {
        avatar: fromdata.value.avatar,
        username: fromdata.value.username,
        password: fromdata.value.password,
        phone: fromdata.value.phone,
        code: loginRes.code,
      },
    });
    if (res.data.status === 400) {
      uni.showToast({
        title: `${res.data.message}`,
        icon: "error",
      });
      return;
    }

    // 跳转到登录
    uni.navigateTo({
      url: "/pages/user/login/login",
    });
  } catch (e) {
    console.log(e);
  }
};
</script>

<template>
  <AutoBackVue />
  <view class="v1">
    <!-- 装饰光斑 -->
    <view class="glow glow-a"></view>
    <view class="glow glow-b"></view>

    <!-- 宣传语 -->
    <view class="hero">
      <p class="hero-kicker">贺兰山下 · 塞上江南</p>
      <p class="hero-title">欢迎注册<span class="hero-name">绿影慧领</span></p>
      <p class="hero-sub">一棵树 · 一份守护 · 一份绿色未来</p>
    </view>

    <!-- 毛玻璃注册卡片 -->
    <view class="glass-card">
      <uni-forms
        ref="form"
        :model="fromdata"
        :rules="rules"
        validate-trigger="bind"
      >
        <uni-forms-item name="avatar">
          <uni-file-picker
            limit="1"
            return-type="object"
            file-mediatype="image"
            :image-styles="imageStyles"
            disable-preview
            :del-icon="false"
            @select="select"
            @delete="del"
          />
          <p class="sm">选择头像</p>
        </uni-forms-item>
        <uni-forms-item name="username">
          <input
            type="nickname"
            class="sbzzinput"
            v-model="fromdata.username"
            placeholder="请输入用户名"
          />
        </uni-forms-item>
        <uni-forms-item name="password">
          <input
            type="password"
            class="sbzzinput"
            v-model="fromdata.password"
            placeholder="请输入密码"
          />
        </uni-forms-item>
        <uni-forms-item name="phone">
          <input
            type="text"
            class="sbzzinput"
            v-model="fromdata.phone"
            placeholder="请输入手机号"
          />
        </uni-forms-item>
      </uni-forms>
      <!-- 提交按钮 -->
      <button class="subbtn" @click="submitForm">注 册</button>
      <p class="ysp">
        <navigator
          class="ysp-a"
          hover-class="none"
          url="/pages/user/login/login"
          >已有账号？去登录</navigator
        >
      </p>
    </view>

    <!-- 隐私协议 -->
    <p class="ysp-foot">
      注册即表示同意
      <navigator class="ysp-a" hover-class="none">《用户协议》</navigator>
      <navigator class="ysp-a" hover-class="none">《隐私政策》</navigator>
    </p>
  </view>
</template>

<style scoped>
/* ===== 贺兰青 · 毛玻璃注册页（与登录/首页同一设计语言） ===== */
.v1 {
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

  position: relative;
  min-height: 100vh;
  padding: 40rpx 48rpx 88rpx;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(160deg, #0d2828 0%, #1a5c5c 55%, #2f8f8f 100%);
  color: var(--heli-text);
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 装饰光斑 */
.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.glow-a {
  width: 460rpx;
  height: 460rpx;
  top: -140rpx;
  right: -160rpx;
  background: radial-gradient(circle, rgba(95, 180, 180, 0.42) 0%, transparent 68%);
}

.glow-b {
  width: 420rpx;
  height: 420rpx;
  bottom: -120rpx;
  left: -150rpx;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, transparent 68%);
}

/* 宣传语 */
.hero {
  position: relative;
  z-index: 1;
  text-align: center;
  margin: 40rpx 0 56rpx;
}

.hero-kicker {
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 10rpx;
  color: var(--heli-gold-soft);
  margin-bottom: 26rpx;
  text-shadow: 0 2rpx 16rpx rgba(6, 24, 24, 0.55);
}

.hero-title {
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  color: #ffffff;
}

.hero-name {
  color: var(--heli-gold-soft);
  text-shadow: 0 0 28rpx rgba(212, 175, 55, 0.4);
}

.hero-sub {
  margin-top: 22rpx;
  font-size: 26rpx;
  letter-spacing: 2rpx;
  color: rgba(245, 249, 249, 0.72);
}

/* 毛玻璃卡片 */
.glass-card {
  position: relative;
  z-index: 1;
  padding: 48rpx 40rpx 44rpx;
  border-radius: 32rpx;
  background: var(--glass-strong);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  border: 2rpx solid var(--glass-border);
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.glass-card::before {
  content: "";
  position: absolute;
  top: -140rpx;
  right: -100rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(95, 180, 180, 0.32) 0%, transparent 70%);
  pointer-events: none;
}

/* 表单输入 */
.sbzzinput {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  background: var(--glass);
  border: 2rpx solid var(--glass-border);
  border-radius: 999rpx;
  padding: 26rpx 34rpx;
  font-size: 28rpx;
  color: var(--heli-text);
  margin-bottom: 10rpx;
  transition: border-color 0.2s ease;
}

/* uni-app H5 会把 input 编译为 uni-input 外层 + 内部 .uni-input-input，
   scoped 样式无法直接作用于内部元素，用 :deep() 穿透保证输入框可点击、高度正常 */
.sbzzinput :deep(.uni-input-wrapper),
.sbzzinput :deep(.uni-input-form),
.sbzzinput :deep(.uni-input-input) {
  width: 100%;
  height: 100%;
  min-height: 48rpx;
  font-size: 28rpx;
  color: var(--heli-text);
  line-height: 48rpx;
}

.sbzzinput::placeholder {
  color: rgba(245, 249, 249, 0.45);
}

.sbzzinput:focus {
  border-color: rgba(95, 180, 180, 0.6);
}

/* 注册按钮 */
.subbtn {
  width: 100%;
  margin: 44rpx auto 0;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 32rpx;
  letter-spacing: 14rpx;
  padding: 24rpx 0;
  border: none;
  box-shadow: 0 14rpx 30rpx rgba(6, 24, 24, 0.42), 0 0 0 2rpx rgba(212, 175, 55, 0.35);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.subbtn::after {
  border: none;
}

.subbtn:active {
  transform: scale(0.98);
  opacity: 0.92;
}

/* 头像选择 */
.sm {
  margin-top: 24rpx;
  text-align: center;
  font-size: 24rpx;
  color: rgba(245, 249, 249, 0.6);
}

:deep(.uni-file-picker__container) {
  justify-content: center;
}

:deep(.file-picker__box-content) {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx dashed rgba(95, 180, 180, 0.55);
  border-radius: 50%;
  overflow: visible;
}

:deep(.file-picker__box) {
  border-radius: 50%;
}

:deep(.file-picker__image) {
  border-radius: 50%;
}

:deep(.icon-add) {
  color: var(--heli-gold-soft);
}

/* 链接 */
.ysp {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: rgba(245, 249, 249, 0.62);
}

.ysp-a {
  color: var(--heli-gold-soft);
  text-decoration: none;
  display: inline-block;
}

.ysp-foot {
  position: relative;
  z-index: 1;
  margin-top: 48rpx;
  text-align: center;
  font-size: 24rpx;
  color: rgba(245, 249, 249, 0.5);
}
</style>
