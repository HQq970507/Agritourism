// =====================================================
// 采摘园地图模块通用工具与请求封装
//
// 后端设施接口契约（后端 Agent 并行开发中）：
//   GET /travel/facilities/map?type=采摘园   设施点位（data 为数组）
//     元素字段：{ id, name, type, city, longitude, latitude,
//                 description, opening_hours, contact, cover_image }
//   type 取值：采摘园 / 农家乐 / 民宿 / 研学基地（可选，不传返回全部）
//
// 响应统一为 { status, code, message, data }，code === 0 为成功
// =====================================================
import { useTokenStore } from "@/stores/token";
import { NewAccesstoken, BaseUrl } from "./request";
import { pickList } from "./adoption";
// 真实宁夏省界数据（阿里云 DataV 公开 GeoJSON，5 个地级市真实轮廓）
import ningxiaGeo from "@/static/map/ningxia.json";

// -------- 宁夏真实省界投影（H5 简易线性投影，不依赖 d3-geo） --------
// 投影边界：运行时从真实省界 GeoJSON 递归计算（约 lon 104.29-107.66 / lat 35.24-39.38），
// 不硬编码，保证省界 / 城市标注 / 设施标记用同一套投影精准对齐
const computeGeoBounds = (geo) => {
  let lonMin = Infinity;
  let lonMax = -Infinity;
  let latMin = Infinity;
  let latMax = -Infinity;
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number") {
      const lon = coords[0];
      const lat = coords[1];
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      return;
    }
    coords.forEach(walk);
  };
  (geo.features || []).forEach((f) => {
    if (f && f.geometry) walk(f.geometry.coordinates);
  });
  return { lonMin, lonMax, latMin, latMax };
};

export const NX_BOUNDS = computeGeoBounds(ningxiaGeo);

// 地图画布比例（viewBox 宽:高 = 100 : 123，与真实经纬跨度比例一致，省界不变形）
export const NX_MAP_VIEW = { width: 100, height: 123 };

// 宁夏五市真实坐标（地图城市标注）
export const NX_CITIES = [
  { name: "银川", longitude: 106.28, latitude: 38.47 },
  { name: "石嘴山", longitude: 106.38, latitude: 38.98 },
  { name: "吴忠", longitude: 106.2, latitude: 37.99 },
  { name: "固原", longitude: 106.28, latitude: 36.01 },
  { name: "中卫", longitude: 105.19, latitude: 37.5 },
];

// 分市边界：从 GeoJSON 提取 5 市的全部多边形环（兼容 Polygon / MultiPolygon，
// 飞地/岛屿逐环保留，洞也保留以便 evenodd 镂空）
export const NX_REGIONS = (ningxiaGeo.features || []).map((feature) => {
  const props = feature.properties || {};
  const geometry = feature.geometry || {};
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates || [];
  const rings = [];
  (polygons || []).forEach((poly) => {
    (poly || []).forEach((ring) => {
      if (Array.isArray(ring) && ring.length && Array.isArray(ring[0])) {
        rings.push(ring);
      }
    });
  });
  const centroid = props.centroid || props.center || [0, 0];
  return {
    name: props.name || "",
    adcode: props.adcode || 0,
    rings,
    centerLat: Number(centroid[1]) || 0,
  };
});

// 分市着色：5 档绿色渐变（由北到南 浅 -> 深）
export const NX_REGION_FILLS = ["#e8f5e9", "#d7ecd9", "#c5e3c9", "#b4dab8", "#a3d1a8"];

// 市 -> 填充色映射（按质心纬度由北到南排序，保证渐变方向正确）
export const NX_REGION_COLORS = [...NX_REGIONS]
  .sort((a, b) => b.centerLat - a.centerLat)
  .map((r, i) => ({ adcode: r.adcode, fill: NX_REGION_FILLS[i % NX_REGION_FILLS.length] }));

// 某市填充色（按 adcode）
export const regionFill = (adcode) => {
  const meta = NX_REGION_COLORS.find((c) => c.adcode === adcode);
  return (meta && meta.fill) || NX_REGION_FILLS[NX_REGION_FILLS.length - 1];
};

/**
 * 某市全部环 -> SVG path d（"M ... L ... Z"，fill-rule=evenodd 可正确镂空洞）
 * @param {{rings: number[][][]}} region NX_REGIONS 元素
 * @param {number} viewW viewBox 宽
 * @param {number} viewH viewBox 高
 */
export const regionPathData = (
  region,
  viewW = NX_MAP_VIEW.width,
  viewH = NX_MAP_VIEW.height
) =>
  (region.rings || [])
    .map((ring) => {
      const d = ring
        .map(([lon, lat]) => {
          const p = projectPoint(lon, lat);
          return `${(p.x * viewW).toFixed(2)},${(p.y * viewH).toFixed(2)}`;
        })
        .join(" L ");
      return `M ${d} Z`;
    })
    .join(" ");

/**
 * 全省轮廓：全部市的所有环合并为单个 SVG path d
 * @param {Array} regions NX_REGIONS
 * @param {number} viewW viewBox 宽
 * @param {number} viewH viewBox 高
 */
export const regionsPathData = (
  regions = NX_REGIONS,
  viewW = NX_MAP_VIEW.width,
  viewH = NX_MAP_VIEW.height
) => regions.map((r) => regionPathData(r, viewW, viewH)).join(" ");

// -------- 设施类型 -> 颜色/样式映射 --------
// 采摘园绿 / 农家乐橙 / 民宿蓝 / 研学黄 / 其他紫（与任务要求一致）
export const FACILITY_TYPE_META = {
  采摘园: { color: "#4c8c3b", cls: "green", text: "采摘园" },
  农家乐: { color: "#d9822b", cls: "orange", text: "农家乐" },
  民宿: { color: "#3d6fc0", cls: "blue", text: "民宿" },
  研学基地: { color: "#b3862a", cls: "yellow", text: "研学基地" },
};

export const FACILITY_TYPE_OTHER = { color: "#8a5ac9", cls: "purple", text: "其他" };

// 底部筛选 chips 配置
export const FACILITY_TABS = [
  { type: "", label: "全部" },
  { type: "采摘园", label: "采摘园" },
  { type: "农家乐", label: "农家乐" },
  { type: "民宿", label: "民宿" },
  { type: "研学基地", label: "研学基地" },
];

/**
 * 根据设施类型获取颜色/样式配置（兼容后端任意类型字符串）
 */
export const facilityTypeMeta = (type = "") => {
  const meta = FACILITY_TYPE_META[type];
  if (meta) return meta;
  const key = Object.keys(FACILITY_TYPE_META).find(
    (k) => type && type.includes(k)
  );
  if (key) return FACILITY_TYPE_META[key];
  return { ...FACILITY_TYPE_OTHER, text: type || FACILITY_TYPE_OTHER.text };
};

// -------- 设施字段归一化（兼容驼峰 / 下划线） --------
export const normalizeFacility = (item = {}) => ({
  id: item.id,
  name: item.name || "未命名设施",
  type: item.type || "其他",
  city: item.city || "",
  longitude: Number(item.longitude ?? item.lng ?? item.lon ?? 0),
  latitude: Number(item.latitude ?? item.lat ?? 0),
  description: item.description || "",
  openingHours: item.opening_hours || item.openingHours || "",
  contact: item.contact || item.phone || "",
  coverImage: item.cover_image || item.coverImage || "",
});

// -------- 简易线性投影：经纬度 -> 0..1 归一化坐标（x 向右，y 向下，北在上） --------
export const projectPoint = (longitude, latitude) => {
  const { lonMin, lonMax, latMin, latMax } = NX_BOUNDS;
  const lon = Number(longitude) || 0;
  const lat = Number(latitude) || 0;
  const x = (lon - lonMin) / (lonMax - lonMin);
  const y = (latMax - lat) / (latMax - latMin);
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
};

/**
 * 城市标注投影（附加归一化坐标）
 */
export const projectCity = (city) => ({
  ...city,
  ...projectPoint(city.longitude, city.latitude),
});

// -------- 请求封装（与 journeyRequest 同一套逻辑） --------
/**
 * 统一请求：token 校验 -> 请求 -> 401 刷新重试 -> code===0 判定
 * @param {{url:string, method?:string, data?:object}} options
 * @returns {Promise<any>} 后端 data 字段
 */
export const farmRequest = async ({ url, method = "GET", data = {} }) => {
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
 * 从「设施点位接口」响应中安全取出数组
 * 兼容 data 直接为数组 或 { list/records/items/facilities }
 */
export const pickFacilityList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return data.list || data.records || data.items || data.facilities || [];
};

export { pickList };
