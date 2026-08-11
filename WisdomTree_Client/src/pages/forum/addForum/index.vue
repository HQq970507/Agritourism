<script setup>
import { ref } from "vue";
import { useTokenStore } from "@/stores/token";
import { BaseUrl } from "../../../common/request";
import { NewAccesstoken } from "../../../common/request";
import AutoBackVue from "../../../components/AutoBack.vue";

const tokenStore = useTokenStore();

// 图片上传
const imageValue = ref([]);

// 表单引用
const formRef = ref(null);
const filePicker = ref(null);

// 表单数据
const form = ref({
  title: "",
  content: "",
  type: 0,
  images: [], // 存储图片
});

// 帖子类型选项
const typeOptions = ["日常", "反馈"];

// 处理类型选择
const handleTypeChange = (e) => {
  console.log(e);
  form.value.type = e.detail.value;
};

// 上传图片
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
  // 存入数组
  form.value.images.push(resdata.path);
  console.log(form.value.images);
};

// 删除头像
const del = (e) => {
  form.value.images.splice(e.index, 1);
};

// 表单校验规则
const rules = {
  title: { required: true, message: "请输入帖子标题", trigger: "blur" },
  content: { required: true, message: "请输入帖子内容", trigger: "blur" },
  type: {
    validator: (rule, value) => value !== -1,
    message: "请选择帖子类型",
    trigger: "change",
  },
  images: {
    validator: (rule, value) => value.length > 0,
    message: "请至少上传一张图片",
    trigger: "change",
  },
};

// 后端提交表单
const handleSubmit = async () => {
  try {
    const verify = await NewAccesstoken();
    if (verify) {
      const res = await uni.request({
        url: `${BaseUrl}/posts/create`,
        method: "POST",
        header: {
          authorization: `Bearer ${tokenStore.Accesstoken}`,
        },
        data: {
          ...form.value,
          type: typeOptions[form.value.type],
        },
      });

      if (res.data.status === 200) {
        console.log(res.data);
      } else {
        throw new Error("发布失败");
      }
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "发布失败，请稍后重试",
      icon: "error",
    });
  }
  // 清空表单
  form.value = {
    title: "",
    content: "",
    type: 0,
    images: [],
  };
  imageValue.value = [];
  uni.navigateBack();
  uni.showToast({
    title: "发布成功，环保能量增加了5g哟🤩",
    icon: "none",
  });
};

// 提交表单
const submitForm = () => {
  formRef.value
    .validate()
    .then(() => {
      handleSubmit();
    })
    .catch(() => {
      uni.showToast({ title: "请填写完整信息", icon: "none" });
    });
};
</script>

<template>
  <AutoBackVue />
  <view class="form-container">
    <uni-forms ref="formRef" :modelValue="form" :rules="rules">
      <!-- 帖子标题 -->
      <uni-forms-item label="标题" name="title">
        <uni-easyinput v-model="form.title" placeholder="请输入帖子标题" />
      </uni-forms-item>

      <!-- 帖子内容 -->
      <uni-forms-item label="内容" name="content">
        <uni-easyinput
          type="textarea"
          v-model="form.content"
          placeholder="请输入帖子内容"
        />
      </uni-forms-item>

      <!-- 帖子类型 -->
      <uni-forms-item label="类型" name="type">
        <picker
          @change="handleTypeChange"
          :value="form.type"
          :range="typeOptions"
        >
          <view class="picker">{{
            typeOptions[form.type] || "请选择类型"
          }}</view>
        </picker>
      </uni-forms-item>

      <!-- 图片上传 -->
      <uni-forms-item label=" 配图">
        <uni-file-picker
          v-model="imageValue"
          ref="filePicker"
          file-mediatype="image"
          :limit="6"
          @select="select"
          @delete="del"
        />
      </uni-forms-item>

      <!-- 提交按钮 -->
      <button type="primary" @click="submitForm">提交帖子</button>
    </uni-forms>
  </view>
</template>

<style lang="scss">
.form-container {
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

  padding: 32rpx;
  min-height: 100vh;
  /* 贺兰青深色渐变背景 + 青金氛围光 */
  background:
    radial-gradient(1100rpx 800rpx at 90% -10%, rgba(95, 180, 180, 0.16) 0%, transparent 60%),
    radial-gradient(900rpx 700rpx at -10% 40%, rgba(26, 92, 92, 0.42) 0%, transparent 60%),
    linear-gradient(175deg, #0b2424 0%, #123a3a 52%, #0e2f2f 100%);
}

/* 表单标题样式 */
.uni-section {
  margin-bottom: 48rpx;

  ::v-deep .uni-section__header {
    padding: 0 0 24rpx;
    border: none;

    .uni-section__content-title {
      font-size: 40rpx;
      font-weight: 600;
      color: var(--heli-text);
      position: relative;
      padding-left: 32rpx;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6rpx;
        height: 36rpx;
        background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
        border-radius: 4rpx;
      }
    }
  }
}

/* 表单内容容器（毛玻璃卡） */
.uni-forms {
  background: var(--glass);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  padding: 32rpx;
  border-radius: 28rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
}

/* 表单项样式 */
.uni-forms-item {
  margin-bottom: 48rpx;

  ::v-deep .uni-forms-item__label {
    font-size: 32rpx;
    color: rgba(245, 249, 249, 0.85);
    margin-bottom: 24rpx;
    font-weight: 500;
  }
}

/* 紧凑输入框 */
.uni-easyinput {
  ::v-deep .uni-easyinput__content {
    min-height: 80rpx;
    padding: 20rpx 24rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.16);
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.08);

    &:focus-within {
      border-color: #5fb4b4;
      box-shadow: 0 0 0 2rpx rgba(95, 180, 180, 0.25);
    }
  }

  ::v-deep .uni-easyinput__content-input {
    color: var(--heli-text);
  }

  /* 文本域优化 */
  &[type="textarea"] {
    ::v-deep .uni-easyinput__content {
      min-height: 200rpx;
    }
  }
}

/* 选择器样式 */
.picker {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 16rpx;
  font-size: 32rpx;
  color: rgba(245, 249, 249, 0.85);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.3s;

  &:active {
    background-color: rgba(95, 180, 180, 0.18);
  }
}

/* 图片上传优化 */
.uni-file-picker {
  ::v-deep .uni-file-picker__container {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .uni-file-picker__input-box {
      width: 200rpx;
      height: 200rpx;
      border: 2rpx dashed rgba(95, 180, 180, 0.5);
      border-radius: 16rpx;
      background: rgba(255, 255, 255, 0.06);
      flex-direction: column;

      &::before {
        content: "点击上传";
        font-size: 24rpx;
        color: rgba(245, 249, 249, 0.6);
        margin-top: 16rpx;
      }

      .uni-icons {
        font-size: 48rpx !important;
        color: rgba(95, 180, 180, 0.7) !important;
      }
    }

    .uni-file-picker__lists {
      width: 200rpx !important;
      height: 200rpx !important;
      border-radius: 16rpx;
      overflow: hidden;
    }
  }
}

/* 表单项标签样式 */
.uni-forms-item {
  ::v-deep .uni-forms-item__label {
    position: relative;
    padding-left: 24rpx; // 为竖线留出空间
    font-size: 30rpx;
    color: rgba(245, 249, 249, 0.85);
    margin-bottom: 20rpx;

    // 渐变竖线装饰（贺兰青）
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4rpx;
      height: 28rpx;
      background: linear-gradient(180deg, #2f8f8f, #5fb4b4);
      border-radius: 2rpx;
      transition: height 0.2s ease;
    }

    // 聚焦状态动画
    .uni-forms-item__content:focus-within &::before {
      height: 32rpx;
      background: #5fb4b4;
    }
  }

  // 错误状态处理
  &.is-error ::v-deep .uni-forms-item__label::before {
    background: #ff4d4f;
  }
}

/* 提交按钮（贺兰青主色） */
button[type="primary"] {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #2f8f8f, #5fb4b4);
  color: #fff;
  font-size: 32rpx;
  letter-spacing: 2rpx;
  transition: transform 0.2s;
  box-shadow: 0 12rpx 32rpx rgba(6, 24, 24, 0.35), 0 0 0 2rpx rgba(95, 180, 180, 0.3);

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.98);
    background: linear-gradient(135deg, #1a5c5c, #2f8f8f);
  }
}

/* 错误提示样式 */
.uni-forms-item__error {
  padding: 8rpx 0;
  color: #ff4d4f;
  font-size: 24rpx;
}
</style>
