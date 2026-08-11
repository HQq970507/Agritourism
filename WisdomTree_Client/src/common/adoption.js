// =====================================================
// 认领模块通用工具与请求封装
//
// 后端认领接口契约（后端 Agent 并行开发中）：
//   POST /adoption               body: { productId, wish?, area?, nickname? }
//   GET  /adoption/my
//   GET  /adoption/:id
//   POST /adoption/:id/diary     body: { stage, description, temperature?, humidity?, mediaUrl? }
//   GET  /adoption/:id/diary
//
// 响应统一为 { status, code, message, data }，code === 0 为成功
// =====================================================
import { useTokenStore } from "@/stores/token";
import { NewAccesstoken, BaseUrl } from "./request";

// 生长阶段选项（与后端契约一一对应）
export const STAGE_OPTIONS = [
  { value: "seedling", label: "幼苗期" },
  { value: "growing", label: "生长期" },
  { value: "flowering", label: "开花期" },
  { value: "fruiting", label: "结果期" },
  { value: "harvest", label: "收获期" },
];

// 阶段 value -> 中文文案
export const STAGE_LABELS = STAGE_OPTIONS.reduce((map, item) => {
  map[item.value] = item.label;
  return map;
}, {});

// 认领状态文案
export const STATUS_LABELS = {
  pending: "待确认",
  adopted: "已认领",
  growing: "生长中",
  flowering: "开花期",
  fruiting: "结果期",
  harvest: "已收获",
  completed: "已完成",
  cancelled: "已取消",
};

// 认领区域选项（可选）
export const AREA_OPTIONS = ["东篱园", "南山田", "溪谷地", "云上圃", "阳光棚"];

/**
 * 认领记录字段归一化
 * 后端联调阶段字段名可能不同，这里做防御性兼容
 */
export const normalizeAdoption = (item = {}) => {
  const media = item.mediaUrl || item.media_url || item.media || [];
  const avatar =
    item.avatar ||
    item.image ||
    (Array.isArray(media) && media.length ? media[0] : media) ||
    "";
  return {
    id: item.id,
    adoptionId: item.adoption_id || item.adoptionId || "",
    traceCode: item.traceCode || item.trace_code || "",
    productId: item.productId || item.product_id || item.categoryId || "",
    productName:
      item.product_name || item.productName || item.name || "未命名产品",
    avatar,
    status: item.status || "growing",
    area: item.area || "",
    wish: item.wish || "",
    nickname: item.nickname || item.nickName || "",
    diaryCount:
      item.diary_count ?? item.diaryCount ?? item.diaryNum ?? item.diary_num ?? 0,
    adoptedAt: item.adopted_at || item.created_at || item.adopt_time || "",
  };
};

/**
 * 生长日记字段归一化
 */
export const normalizeDiary = (item = {}) => ({
  id: item.id,
  stage: item.stage || "growing",
  description: item.description || "",
  temperature: item.temperature || "",
  humidity: item.humidity || "",
  mediaUrl: item.media_url || item.mediaUrl || "",
  createdAt: item.created_at || item.createdAt || "",
  dayCount: item.day_count ?? item.dayCount ?? 0,
});

/**
 * 统一请求：token 校验 -> 请求 -> 401 刷新重试 -> code===0 判定
 * @param {{url:string, method?:string, data?:object}} options
 * @returns {Promise<any>} 后端 data 字段
 */
export const adoptionRequest = async ({ url, method = "GET", data = {} }) => {
  const tokenStore = useTokenStore();

  // 先校验/刷新 token（与现有页面统一做法一致）
  let verify = await NewAccesstoken();
  if (!verify) throw new Error("登录已过期，请重新登录");

  const doRequest = () =>
    uni.request({
      url: `${BaseUrl}${url}`,
      method,
      header: { authorization: `Bearer ${tokenStore.Accesstoken}` },
      data,
    });

  let res = await doRequest();

  // 401：刷新 token 后重试一次
  if (res.statusCode === 401) {
    verify = await NewAccesstoken();
    if (!verify) throw new Error("登录已过期，请重新登录");
    res = await doRequest();
  }

  const body = res.data || {};
  if (body.code !== 0 && body.status !== 200) {
    throw new Error(body.message || "请求失败，请稍后重试");
  }
  return body.data;
};

/**
 * 从「列表接口」响应中安全取出数组
 * 兼容 data 直接为数组 或 { list/records/adoptions/items }
 */
export const pickList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return data.list || data.records || data.adoptions || data.items || [];
};

/**
 * 安全的 URL 参数解码（避免重复解码异常）
 */
export const safeDecode = (value = "") => {
  if (!value) return value;
  let result = String(value);
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch (e) {
      break;
    }
  }
  return result;
};
