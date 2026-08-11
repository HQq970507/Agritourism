<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import TreeCardVue from "../../../components/tree/TreeCard.vue";
import TreeTitleVue from "../../../components/tree/TreeTitle.vue";
import BuyNowVue from "../../../components/tree/BuyNow.vue";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { NewAccesstoken } from "../../../common/request";
import { BaseUrl } from "../../../common/request";
import { useTokenStore } from "@/stores/token";
import { medalStore } from "../../../stores/medal";

onLoad((option) => {
  uni.showLoading({
    title: "加载中",
  });
  treeTypeID.value = option.treeTypeID;
  treeName.value = option.treeName;
  avatar.value = option.avatar;
});

// 上页传来的数据
const treeName = ref("默认");

const avatar = ref("https://s21.ax1x.com/2024/09/15/pAuDlAs.jpg");

//
const tokenStore = useTokenStore();

const medal = medalStore();

const treeTypeID = ref("");

// 表单实例引用
const form = ref(null);
// 选择器数据
const treeType = [
  "爱情纪念树",
  "友情纪念树",
  "亲情纪念树",
  "青春纪念树",
  "事业纪念树",
  "平安纪念树",
];
const region = ["图书馆", "食堂", "教学楼", "运动场", "寝室"];
// 表单数据
const formData = ref({
  nickName: "",
  treeType: treeType[0],
  wish: "",
  area: region[0],
});
// 表单验证
const rules = ref({
  nickName: {
    rules: [
      {
        required: true,
        errorMessage: "请输入姓名/昵称",
      },
    ],
  },
});

// 选择器处理
// 树类型默认值
const index = ref(0);
// 选择器事件
const bindPickerChange = (e) => {
  index.value = e.detail.value;
  // 绑定表单数据
  formData.value.treeType = treeType[e.detail.value];
};

// 区域类型默认值
const regionIndex = ref(0);
const RegionChange = (e) => {
  regionIndex.value = e.detail.value;
  formData.value.area = region[e.detail.value];
};

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

// 后端提交表单
const submitForm = async () => {
  uni.showLoading({
    title: "领养中",
  });
  const verify = await NewAccesstoken(tokenStore.Accesstoken);
  if (verify) {
    try {
      if (formData.value.wish === "") {
        formData.value.wish = "向下扎根,向上生长,初心不改，未来可期!";
      }
      console.log(formData.value);
      const res = await uni.request({
        url: `${BaseUrl}/tree/adoptTree`,
        method: "POST",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
        data: {
          treeTypeID: Number(treeTypeID.value),
          ...formData.value,
        },
      });
      if (res.data.status !== 200) {
        throw new Error();
      }
      uni.hideLoading();
      // 提示
      uni.showToast({
        title: "领养成功",
        icon: "success",
      });
      const medalInfo = {
        ...res.data.data,
        avatar: avatar.value,
      };
      // 存入勋章信息
      medal.saveMedalInfo(medalInfo);
      // 等一秒
      setTimeout(() => {
        // 跳转页面
        uni.reLaunch({
          url: "/pages/index/index?AutoLogin=false",
        });
      }, 500);
    } catch (e) {
      uni.hideLoading();
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
    <AutoBackVue />
    <!-- 领养按钮组件 -->
    <BuyNowVue @submit="submit">
      <template #xy>
        <p class="ysp">
          领养即表示同意
          <navigator class="ysp-a" hover-class="none">《领养协议》</navigator>
        </p>
      </template>
    </BuyNowVue>
    <view class="bg-img heli-bg"></view>
    <!-- 步骤 -->
    <uni-row>
      <uni-col span="20" offset="2">
        <TreeTitleVue>
          <text>第二步</text>
          <text>与我的小树建立连接</text>
          <template #image>
            <image :src="avatar" @load="load"></image>
          </template>
        </TreeTitleVue>
      </uni-col>
    </uni-row>

    <!-- 表单 -->
    <uni-row>
      <uni-col span="20" offset="2">
        <view class="treeForm-box">
          <view class="From-title">领养信息</view>
          <view class="treetitel">
            <text>树木品种</text>
            <text>{{ treeName }}</text>
          </view>
          <!--  -->
          <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            err-show-type="toast"
          >
            <view class="from-tiem">
              <p class="fromtitle">姓名/昵称</p>
              <uni-forms-item name="nickName">
                <input placeholder="请输入" v-model="formData.nickName" />
              </uni-forms-item>
            </view>
            <view class="from-tiem">
              <p class="fromtitle">领养区域</p>
              <uni-forms-item name="region">
                <picker
                  @change="RegionChange"
                  value="regionIndex"
                  :range="region"
                >
                  <view class="uni-input">{{ region[regionIndex] }}</view>
                </picker>
              </uni-forms-item>
            </view>
            <view class="from-tiem">
              <p class="fromtitle">纪念树类型</p>
              <uni-forms-item name="treeType">
                <picker
                  @change="bindPickerChange"
                  value="index"
                  :range="treeType"
                >
                  <view class="uni-input">{{ treeType[index] }}</view>
                </picker>
              </uni-forms-item>
            </view>
            <view class="from-tiem-xy">
              <p class="fromtitle">我的心愿</p>
              <uni-forms-item name="wish">
                <textarea
                  maxlength="30"
                  class="xytext"
                  v-model="formData.wish"
                  placeholder="向下扎根,向上生长,初心不改，未来可期!"
                />
              </uni-forms-item>
            </view>
          </uni-forms>
        </view>
      </uni-col>
    </uni-row>
  </view>
</template>

<style scoped>
@import url("../../../static/css/treeform.css");

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

  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  color: var(--heli-text);
  /* 深色渐变背景（纯 CSS，无外链图） */
  background:
    radial-gradient(130% 80% at 50% 0%, rgba(95, 180, 180, 0.16) 0%, transparent 46%),
    radial-gradient(100% 60% at 100% 100%, rgba(26, 92, 92, 0.55) 0%, transparent 60%),
    linear-gradient(180deg, #103131 0%, #0b2626 55%, #081c1c 100%);
}

/* 全屏渐变背景层（原外链背景图改为纯 CSS 渐变） */
.bg-img {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  background:
    radial-gradient(90% 60% at 15% 10%, rgba(95, 180, 180, 0.2) 0%, transparent 60%),
    linear-gradient(160deg, rgba(47, 143, 143, 0.35) 0%, transparent 50%, rgba(26, 92, 92, 0.5) 100%);
  pointer-events: none;
}

/* 领养表单：毛玻璃卡片 */
.treeForm-box {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 28rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
  padding: 30rpx;
}

.From-title {
  color: var(--heli-text);
}

.treetitel {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.treetitel text {
  color: var(--heli-muted);
}

.treetitel text:nth-child(2) {
  color: var(--heli-light);
}

.from-tiem {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.fromtitle {
  color: var(--heli-text);
}

.from-tiem-xy {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* 表单输入 / 选择器：玻璃输入框 */
.from-tiem input,
.from-tiem .uni-input,
.xytext {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 16rpx;
  color: var(--heli-text);
}

.from-tiem textarea {
  color: var(--heli-text);
}

/* 协议文字 */
.ysp {
  color: rgba(245, 249, 249, 0.55);
}

.ysp-a {
  color: var(--heli-light);
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

/* ===== TreeTitle 步骤标题 ===== */
.page ::v-deep .title-left text:nth-child(1) {
  color: #7fc9c9;
}

.page ::v-deep .title-left text:nth-child(2) {
  color: var(--heli-text);
}

.page ::v-deep .xian.xian {
  background-color: rgba(255, 255, 255, 0.25);
}

.page ::v-deep .xian.xian.active {
  background-color: var(--heli-light);
}
</style>
