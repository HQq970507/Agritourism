<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { BaseUrl } from "../../../common/request";
import { NewAccesstoken } from "../../../common/request";
import { useTokenStore } from "@/stores/token";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";

const tokenStore = useTokenStore();

const oneimage = ref({
  url: "https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/shuijiao-small.jpg",
  extname: "jpg",
  name: "user.jpg",
});

const imageStyles = ref({
  width: 90,
  height: 90,
  border: {
    radius: "50%",
  },
});

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
  formData.value.avatar = resdata.path;
};

// 删除头像
const del = (e) => {
  formData.value.avatar = "";
  console.log(formData.value.avatar);
};

// 表单实例引用
const form = ref(null);
// 表单数据
const formData = ref({
  username: "",
  avatar: "",
  phone: "",
});

onLoad((option) => {
  uni.showLoading({
    title: "加载中",
  });
  const optionObj = JSON.parse(decodeURIComponent(option.userInfoStr));
  oneimage.value.url = optionObj.avatar;
  formData.value = optionObj;
  // 隐藏加载
  uni.hideLoading();
});

// 表单验证
const rules = ref({
  username: {
    rules: [
      {
        required: true,
        errorMessage: "请输入用户昵称",
      },
    ],
  },
  phone: {
    rules: [
      {
        required: true,
        errorMessage: "请输入手机号",
      },
      {
        pattern: /^1[3-9]\d{9}$/,
        errorMessage: "请输入有效手机号",
      },
    ],
  },
});
// 提交表单
const submit = async () => {
  // 执行验证
  const { valid, errors } = await form.value.validate();
  if (valid == null) {
    // 表单校验成功
    console.log("校验成功");
    submitForm();
  } else {
    // 表单校验失败
    console.log("校验失败", errors);
  }
};

const submitForm = async () => {
  uni.showLoading({
    title: "修改中",
  });
  const verify = await NewAccesstoken(tokenStore.Accesstoken);
  if (verify) {
    try {
      const res = await uni.request({
        url: `${BaseUrl}/user/updateInfo`,
        method: "PUT",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
        data: {
          ...formData.value,
        },
      });
      if (res.data.status !== 200) {
        throw new Error();
      }
      uni.hideLoading();
      // 提示
      uni.showToast({
        title: "修改成功",
        icon: "success",
      });
    } catch (e) {
      uni.hideLoading();
      uni.showToast({
        title: `请求错误`,
        icon: "error",
      });
    }
  }
};
</script>

<template>
  <view class="page">
    <AutoBackVue />
    <!-- 头像 昵称 部分 -->
    <uni-row>
      <uni-col>
        <view class="user-info">
          <view class="user-info__avatar">
            <uni-file-picker
              v-model="oneimage"
              limit="1"
              return-type="object"
              file-mediatype="image"
              disable-preview
              :del-icon="false"
              :image-styles="imageStyles"
              @select="select"
              @delete="del"
            />
          </view>
        </view>
      </uni-col>
    </uni-row>

    <!-- 修改个人信息 -->
    <uni-row>
      <uni-col span="22" offset="1">
        <view class="treeForm-box">
          <view class="From-title">个人信息</view>
          <!--  -->
          <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            err-show-type="toast"
          >
            <view class="from-tiem">
              <p class="fromtitle">用户名称</p>
              <uni-forms-item name="username">
                <input
                  type="nickname"
                  class="heli-input"
                  placeholder="请输入"
                  v-model="formData.username"
                />
              </uni-forms-item>
            </view>
            <view class="from-tiem">
              <p class="fromtitle">手机号</p>
              <uni-forms-item name="phone">
                <input class="heli-input" placeholder="请输入" v-model="formData.phone" />
              </uni-forms-item>
            </view>
          </uni-forms>
        </view>
      </uni-col>
    </uni-row>

    <!-- 按钮 -->
    <uni-row>
      <uni-col span="22" offset="1">
        <view class="btn-box" @click="submit">
          <p>修改</p>
        </view>
      </uni-col>
    </uni-row>
  </view>
</template>

<style scoped>
/* ===== 贺兰青 · 毛玻璃修改信息（与首页同一设计语言） ===== */
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
  --shadow-deep: 0 16rpx 40rpx rgba(6, 24, 24, 0.35);

  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(180deg, #0d2828 0%, #123f3f 45%, #1a5c5c 100%);
  color: var(--heli-text);
  padding-bottom: 80rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80rpx;
}

/* 表单玻璃卡片 */
.treeForm-box {
  margin-top: 35rpx;
  background: var(--glass-strong);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 28rpx;
  padding: 36rpx 30rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

.From-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--heli-text);
  letter-spacing: 2rpx;
}

.from-tiem {
  margin-top: 35rpx;
  border-bottom: 2rpx solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.fromtitle {
  font-size: 30rpx;
  letter-spacing: 1px;
  color: var(--heli-muted);
  margin-right: 30rpx;
  white-space: nowrap;
}

.heli-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--heli-text);
  padding: 16rpx 0;
}

.heli-input::placeholder {
  color: rgba(245, 249, 249, 0.4);
}

:deep(.uni-forms-item) {
  margin-bottom: 0;
}

/* 按钮 */
.btn-box {
  width: 100%;
  text-align: center;
  padding: 24rpx 0;
  background: linear-gradient(135deg, #2f8f8f 0%, #1a5c5c 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 32rpx;
  letter-spacing: 8rpx;
  margin-top: 48rpx;
  border-radius: 999rpx;
  box-shadow: 0 14rpx 30rpx rgba(6, 24, 24, 0.42), 0 0 0 2rpx rgba(212, 175, 55, 0.35);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.btn-box:active {
  transform: scale(0.98);
  opacity: 0.92;
}

/* 头像 */
:deep(.uni-file-picker__container) {
  justify-content: center;
}

:deep(.file-picker__box-content) {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx dashed rgba(95, 180, 180, 0.55);
  border-radius: 50%;
  overflow: visible;
}

:deep(.file-picker__image) {
  border-radius: 50%;
}

:deep(.icon-add) {
  color: var(--heli-gold-soft);
}

:deep(.icon-del-box) {
  position: absolute;
  right: 0px;
  z-index: 999;
}

:deep(.file-picker__progress) {
  display: none;
}
</style>
