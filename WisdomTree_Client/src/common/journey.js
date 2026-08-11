// =====================================================
// 旅程模块通用工具与请求封装
//
// 后端旅程接口契约（后端 Agent 并行开发中）：
//   GET  /travel/journeys?type=template|mine|all   旅程列表（data 为数组，含 stops[]）
//   GET  /travel/journeys/:id                      旅程详情（含 stops[]）
//   POST /travel/journeys/save                     保存旅程
//   POST /travel/journeys/:id/adjust               调整站点顺序
//   POST /travel/agent/save-journey                从 AI 结果保存旅程
//   POST /agent/chat                               AI 对话（trip_planning 返回行程数据）
//   POST /travel/reserve                           模板旅程预约
//
// 响应统一为 { status, code, message, data }，code === 0 为成功
// =====================================================
import { useTokenStore } from "@/stores/token";
import { NewAccesstoken, BaseUrl } from "./request";
import { pickList, safeDecode } from "./adoption";

// 默认封面图（后端未返回封面或加载失败时使用渐变占位）
export const DEFAULT_COVER = "http://127.0.0.1:8080/static/mrtree.png";

// 旅程分类选项
export const CATEGORY_OPTIONS = ["采摘", "研学", "康养", "美食", "观光", "智能"];

// 站点类型 -> 徽标配色（采摘绿/餐饮橙/住宿蓝/观光紫/体验青/研学黄）
export const STOP_TYPE_META = {
  采摘: { cls: "green", text: "采摘" },
  餐饮: { cls: "orange", text: "餐饮" },
  住宿: { cls: "blue", text: "住宿" },
  观光: { cls: "purple", text: "观光" },
  体验: { cls: "cyan", text: "体验" },
  研学: { cls: "yellow", text: "研学" },
};

/**
 * 根据站点类型获取徽标配置（兼容后端返回任意类型字符串）
 */
export const stopTypeMeta = (type = "") => {
  const meta = STOP_TYPE_META[type];
  if (meta) return meta;
  const key = Object.keys(STOP_TYPE_META).find(
    (k) => type && type.includes(k)
  );
  if (key) return STOP_TYPE_META[key];
  return { cls: "purple", text: type || "观光" };
};

/**
 * 旅程字段归一化（兼容驼峰 / 下划线）
 * @param {object} item
 * @param {{ isTemplate?: boolean }} [opts] 调用方可强指旅程来源
 */
export const normalizeJourney = (item = {}, opts = {}) => {
  const rawStops = item.stops || item.stop_list || item.stopList || [];
  const isTemplate =
    opts.isTemplate ??
    (item.is_template === true ||
      item.isTemplate === true ||
      item.source === "template" ||
      item.source === "templates" ||
      false);
  return {
    id: item.id,
    name: item.name || item.title || "未命名旅程",
    title: item.title || item.name || "",
    category: item.category || "观光",
    coverImage: item.cover_image || item.coverImage || item.image || "",
    description: item.description || item.intro || "",
    durationHours: item.duration_hours ?? item.durationHours ?? 0,
    distanceKm: item.distance_km ?? item.distanceKm ?? 0,
    difficulty: item.difficulty || "简单",
    bestSeason: item.best_season || item.bestSeason || "",
    isTemplate,
    source: item.source || (isTemplate ? "template" : "mine"),
    stops: Array.isArray(rawStops) ? rawStops.map(normalizeStop) : [],
  };
};

/**
 * 旅程站点字段归一化（兼容驼峰 / 下划线）
 */
export const normalizeStop = (item = {}) => ({
  id: item.id ?? item.stop_id ?? "",
  orderIndex: item.order_index ?? item.orderIndex ?? item.order ?? 0,
  name: item.name || item.stop_name || "未命名站点",
  type: item.type || "观光",
  timeSlot: item.time_slot || item.timeSlot || item.time || "",
  durationMinutes:
    item.duration_minutes ?? item.durationMinutes ?? item.duration ?? 0,
  description: item.description || item.content || "",
  location: item.location || item.address || "",
});

/**
 * 统一请求：token 校验 -> 请求 -> 401 刷新重试 -> code===0 判定
 * 与 adoptionRequest 同一套逻辑
 * @param {{url:string, method?:string, data?:object}} options
 * @returns {Promise<any>} 后端 data 字段
 */
export const journeyRequest = async ({ url, method = "GET", data = {} }) => {
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
 * 从「旅程列表接口」响应中安全取出数组
 * 兼容 data 直接为数组 或 { list/records/items/journeys/templates }
 */
export const pickJourneyList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return (
    data.list ||
    data.records ||
    data.items ||
    data.journeys ||
    data.templates ||
    []
  );
};

/**
 * 从 AI 对话接口响应中提取结构化行程结果
 * /agent/chat 返回 data，trip_planning 时可能带 toolsResult/toolResult/tool_result/result/data
 * 提取后统一为 { schedule, products, scenic, tips, summary, message, reply, intent }
 */
export const extractAIResult = (data = {}) => {
  if (!data || typeof data !== "object") return null;
  const trip =
    data.toolsResult ||
    data.toolResult ||
    data.tool_result ||
    data.result ||
    (data.data && typeof data.data === "object" ? data.data : null) ||
    null;
  const t = trip && typeof trip === "object" ? trip : {};
  return {
    schedule: Array.isArray(t.schedule) ? t.schedule : [],
    products: Array.isArray(t.products) ? t.products : [],
    scenic: Array.isArray(t.scenic) ? t.scenic : [],
    tips: Array.isArray(t.tips) ? t.tips : [],
    summary: t.summary || null,
    message: t.message || "",
    found: t.found,
    reply: data.reply || "",
    intent: data.intent || "",
    sessionId: data.sessionId || "",
  };
};

/**
 * 将 AI 行程 schedule 转为可提交的站点 stops
 */
export const scheduleToStops = (schedule = []) =>
  schedule.map((s = {}) => ({
    name: s.activity || s.name || "行程活动",
    type: "观光",
    timeSlot: s.time || "",
    durationMinutes: parseDurationMinutes(s.duration),
    description: s.description || "",
    location: s.location || "",
  }));

/**
 * 时长字符串 -> 分钟数（"约2小时" -> 120，兼容 "1.5小时" / "90分钟" / 数字）
 */
export const parseDurationMinutes = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const str = String(value);
  const hour = str.match(/(\d+(?:\.\d+)?)\s*小时/);
  if (hour) return Math.round(parseFloat(hour[1]) * 60);
  const min = str.match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (min) return Math.round(parseFloat(min[1]));
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
};

/**
 * 时长（小时）格式化展示
 */
export const formatHours = (hours) => {
  if (hours == null || hours === "") return "";
  const n = Number(hours);
  if (Number.isNaN(n)) return String(hours);
  if (n <= 0) return "";
  return n >= 1 ? `${n}小时` : `${Math.round(n * 60)}分钟`;
};

/**
 * 里程（公里）格式化展示
 */
export const formatDistance = (km) => {
  if (km == null || km === "") return "";
  const n = Number(km);
  if (Number.isNaN(n)) return String(km);
  if (n <= 0) return "";
  return n >= 1 ? `${n}公里` : `${Math.round(n * 1000)}米`;
};

/**
 * 上移/下移站点，返回新数组（不修改入参）
 */
export const moveStop = (stops, index, delta) => {
  const target = index + delta;
  if (target < 0 || target >= stops.length) return stops;
  const next = stops.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

/**
 * 删除站点，返回新数组
 */
export const removeStop = (stops, index) => stops.filter((_, i) => i !== index);

/**
 * 组装「调整旅程」提交 payload（未改动的字段原样回传，新增站点无 id）
 */
export const buildAdjustPayload = (stops = []) =>
  stops.map((s = {}) => ({
    id: s.id || undefined,
    name: s.name || "",
    type: s.type || "观光",
    timeSlot: s.timeSlot || "",
    durationMinutes: s.durationMinutes || 0,
    description: s.description || "",
    location: s.location || "",
  }));

export { pickList, safeDecode };
