<template>
  <view class="page">
    <AutoBackVue />

    <!-- #ifdef H5 -->
    <!-- 图表容器 -->
    <view class="chart-container">
      <!-- 近7天步数折线图 -->
      <view class="chart-card">
        <l-echart
          ref="lineChart"
          style="height: 500rpx"
          :option="lineOption"
        ></l-echart>
      </view>

      <!-- 领养树木类型饼图 -->
      <view class="chart-card">
        <l-echart
          ref="pieChart"
          style="height: 600rpx"
          :option="pieOption"
        ></l-echart>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <!-- 小程序端：echarts 图表需 canvas 适配，显示占位提示 -->
    <view class="chart-container">
      <view class="chart-card">
        <text class="chart-placeholder-text">数据图表请在小程序端查看简化版</text>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import AutoBackVue from "../../../components/AutoBack.vue";
import { useTokenStore } from "@/stores/token";
import { BaseUrl } from "../../../common/request";
import { NewAccesstoken } from "../../../common/request";
import { ref, onMounted, nextTick } from "vue";
// #ifdef H5
import * as echarts from "echarts";
// #endif

const tokenStore = useTokenStore();

const stepsData = ref([]);
const treeTypesData = ref([]);

// 折线图配置
const lineOption = ref({
  title: {
    text: "每日步数趋势",
    left: "center",
    textStyle: {
      color: "#f5f9f9",
      fontSize: 18,
      fontWeight: "500",
      fontFamily: "Helvetica Neue",
    },
  },
  tooltip: {
    trigger: "axis",
    formatter: "{b}\n步数：{c} 步",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#e5e5e5",
    textStyle: {
      color: "#666",
      fontSize: 14,
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "10%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    axisLine: {
      lineStyle: {
        color: "rgba(245, 249, 249, 0.25)",
      },
    },
    axisLabel: {
      color: "rgba(245, 249, 249, 0.65)",
      interval: 0, // 强制显示所有标签
      rotate: 30, // 标签旋转角度
      margin: 15, // 调整标签边距
      fontSize: 12, // 适当缩小字体
    },
  },
  yAxis: {
    type: "value",
    splitLine: {
      lineStyle: {
        type: "dashed",
        color: ["rgba(245, 249, 249, 0.14)"],
      },
    },
    axisLabel: {
      color: "rgba(245, 249, 249, 0.55)",
    },
  },
  series: [
    {
      data: [4200, 5800, 4500, 6200, 7500, 8200, 6800],
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      itemStyle: {
        color: "#5fb4b4",
        borderColor: "#1a5c5c",
        borderWidth: 2,
      },
      lineStyle: {
        width: 3,
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#2f8f8f",
            },
            {
              offset: 1,
              color: "#5fb4b4",
            },
          ],
        },
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "rgba(95, 180, 180, 0.35)",
            },
            {
              offset: 1,
              color: "rgba(47, 143, 143, 0.05)",
            },
          ],
        },
      },
    },
  ],
});

// 饼图配置
const pieOption = ref({
  title: {
    text: "树木领养类型",
    left: "center",
    textStyle: {
      color: "#f5f9f9",
      fontSize: 18,
      fontWeight: "500",
      fontFamily: "Helvetica Neue",
    },
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} \n{b} : {c} 颗({d}%)",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#e5e5e5",
  },
  legend: {
    orient: "vertical",
    right: -5,
    top: "middle",
    textStyle: {
      color: "rgba(245, 249, 249, 0.7)",
    },
  },
  series: [
    {
      name: "树木类型",
      type: "pie",
      radius: ["45%", "65%"],
      center: ["40%", "50%"],
      avoidLabelOverlap: true, // 必须开启防重叠
      label: {
        show: true,
        formatter: "{d}%",
        color: "rgba(245, 249, 249, 0.75)",
        fontSize: 14,
      },
      itemStyle: {
        borderRadius: 8,
        borderColor: "#1a5c5c",
        borderWidth: 2,
      },
      data: [
        {
          value: 335,
          name: "樱花树",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#FFB3BA",
                },
                {
                  offset: 1,
                  color: "#FF758C",
                },
              ],
            },
          },
        },
        {
          value: 310,
          name: "松树",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#2f8f8f",
                },
                {
                  offset: 1,
                  color: "#5fb4b4",
                },
              ],
            },
          },
        },
        {
          value: 234,
          name: "枫树",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#d4af37",
                },
                {
                  offset: 1,
                  color: "#e8c96a",
                },
              ],
            },
          },
        },
        {
          value: 135,
          name: "银杏",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#5fb4b4",
                },
                {
                  offset: 1,
                  color: "#2f6b8f",
                },
              ],
            },
          },
        },
      ],
    },
  ],
});

// 初始化图表
const lineChart = ref(null);
const pieChart = ref(null);

// 获取步数数据
const fetchStepData = async () => {
  try {
    uni.showLoading({ title: "加载中..." });
    const verify = await NewAccesstoken();
    if (!verify) return;

    // 获取微信登录code
    const loginRes = await uni.login({ provider: "weixin" });

    // 获取微信运动数据
    const runRes = await uni.getWeRunData();

    const res = await uni.request({
      url: `${BaseUrl}/datachart/user/step-data`,
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
      stepsData.value = res.data.data;
      updateLineChart();
    }
  } catch (error) {
    console.error("步数获取失败:", error);
    uni.showToast({ title: "步数数据加载失败", icon: "none" });
  }
};

// 获取领养分布数据
const fetchTreeTypes = async () => {
  try {
    uni.showLoading({ title: "加载中..." });
    const verify = await NewAccesstoken();
    if (!verify) return;

    const res = await uni.request({
      url: `${BaseUrl}/datachart/user/treetype-user`,
      method: "GET",
      header: {
        authorization: `Bearer ${tokenStore.Accesstoken}`,
      },
    });

    if (res.data.code === 0) {
      treeTypesData.value = res.data.data;
      updatePieChart();
    }
  } catch (error) {
    console.error("树种分布获取失败:", error);
    uni.showToast({ title: "领养分布加载失败", icon: "none" });
  }
};

// 更新折线图
const updateLineChart = () => {
  lineOption.value = {
    ...lineOption.value,
    xAxis: {
      ...lineOption.value.xAxis,
      data: stepsData.value.map((item) => item.date),
    },
    series: [
      {
        ...lineOption.value.series[0],
        data: stepsData.value.map((item) => item.step),
      },
    ],
  };
};

// 更新饼图
const updatePieChart = () => {
  const testColors = [
    { start: "#FFB3BA", end: "#FF758C" },
    { start: "#2f8f8f", end: "#5fb4b4" },
    { start: "#d4af37", end: "#e8c96a" },
    { start: "#5fb4b4", end: "#2f6b8f" },
    { start: "#A8E6CF", end: "#7EDBB0" },
    { start: "#D4B3FF", end: "#B28FCE" },
    { start: "#FFAAA5", end: "#FF6B6B" },
    { start: "#89F7C2", end: "#52C6A3" },
    { start: "#FFC3A0", end: "#FF677D" },
    { start: "#2f6b8f", end: "#5fb4b4" },
    { start: "#EAC7A3", end: "#C1916E" },
    { start: "#FFB6E6", end: "#C77DFF" },
    { start: "#E2FF70", end: "#B3D933" },
    { start: "#B5C7D3", end: "#8FA9BE" },
  ];

  pieOption.value = {
    ...pieOption.value,
    series: [
      {
        ...pieOption.value.series[0],
        labelLine: {
          // 需要在此处重新设置
          length: 5, // 调整为需要的数值
          length2: 5,
        },
        data: treeTypesData.value.map((item, index) => ({
          value: item.count,
          name: item.treeType,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: testColors[index % 14].start },
                { offset: 1, color: testColors[index % 14].end },
              ],
            },
          },
        })),
      },
    ],
  };
};

onMounted(async () => {
  try {
    await Promise.all([fetchStepData(), fetchTreeTypes()]);

    // 确保数据更新后再初始化
    await nextTick();

    // #ifdef H5
    // 统一初始化方法（echarts 图表仅 H5 渲染，小程序端需 canvas 适配，显示占位）
    const initCharts = () => {
      if (lineChart.value) {
        lineChart.value.init(echarts).then((chart) => {
          chart.setOption(lineOption.value);
          chart.resize();
        });
      }
      if (pieChart.value) {
        pieChart.value.init(echarts).then((chart) => {
          chart.setOption(pieOption.value);
          chart.resize();
        });
      }
    };

    nextTick(initCharts);
    // #endif
  } finally {
    uni.hideLoading();
  }
});
</script>

<style lang="scss" scoped>
/* ===== 贺兰青 · 毛玻璃数据图表（与首页同一设计语言） ===== */
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

  background: linear-gradient(180deg, #0d2828 0%, #123f3f 45%, #1a5c5c 100%);
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
}

.chart-container {
  margin-top: 40rpx;
}

.chart-card {
  background: var(--glass-strong);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 2rpx solid var(--glass-border);
  border-radius: 24rpx;
  box-shadow: var(--shadow-deep), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
  margin-bottom: 32rpx;
  padding: 30rpx;
}

.chart-title {
  text-align: center;
  color: var(--heli-text);
  font-size: 28rpx;
  margin-top: 20rpx;
  font-weight: 400;
  letter-spacing: 1rpx;
}

.chart-placeholder-text {
  display: block;
  padding: 120rpx 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: rgba(245, 249, 249, 0.6);
}
</style>
