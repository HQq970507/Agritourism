# 智慧农旅平台（WisdomTree 农旅版）

> 「认领式农旅」—— 把"一次性旅游"变成"长期认领关系"：游客不只是来玩，而是"拥有"宁夏的一棵树、一亩地、一个果园的四季。

基于 **NestJS + Vue3/uni-app + Element Plus** 构建的 C 端游客 + B 端农户 + G 端政府三方协同的认领式农旅平台。

---

## 🏗️ 项目结构

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| `WisdomTree_Service` | 后端服务 | NestJS 11 + TypeORM + MySQL + JWT + DeepSeek |
| `WisdomTree_Client` | 用户端（H5 + 微信小程序） | uni-app 3.x（Vue3）+ Pinia + Vite |
| `WisdomTree_Admin` | 管理后台（B 端农户 + G 端政府 + 系统管理） | Vue 3.5 + Element Plus + ECharts + Three.js |

## 🧩 核心业务主线

```
看见 → 问路 → 成行 → 体验 → 认领 → 契约 → 成长 → 收获 → 复购
```

认领闭环：**认领下单 → 自动生成合约 → 溯源建档 → 生长日记 → 积分激励 → 积分兑换**

## ✅ 功能总览（六阶段全部完成）

| 阶段 | 内容 |
|------|------|
| **P0 认领闭环** | 认领下单 → 自动合约 → 溯源台账 → 生长日记 → 积分（认领+50/日记+1/发帖+2/回复+1）→ 积分兑换 |
| **P1 旅程合并** | 行程+线路合并为旅程；平台模板 / AI 生成 / 手动调整；旅程预约 |
| **P2 游客体验** | 首页贺兰青重设计（标语+季节推荐+采摘园地图入口）、真实省界地图（阿里云 GeoJSON）、收获管理（预约采摘/邮寄到家）、社区激活（首页动态区/种子帖子/活动） |
| **P3 农户端** | 农户入驻 / 名下产品 / 认领订单（确认种植/履约）/ 收益中心（85%分成）/ 数据看板 |
| **P4 政府端** | 数据驾驶舱（5 卡+7 天趋势）/ 商户监管（封禁/下架）/ 活动统筹 / 区域报告 |
| **P5 小程序** | TabBar 农旅化（首页/认领/旅程/采摘园/我的）、mp-weixin 编译支持、条件编译兼容 |

## 🔑 运行方式

### 后端（WisdomTree_Service）
```bash
cp .env.example .env   # 配置数据库与密钥
npm install
npm run start:dev      # http://localhost:8080
```
依赖 MySQL（本仓库使用 Docker：`docker run -d --name wisdom-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.4`），表结构由 TypeORM `synchronize` 自动创建。

### 用户端 H5（WisdomTree_Client）
```bash
npm install
npm run dev:h5         # http://localhost:5173
```

### 管理后台（WisdomTree_Admin）
```bash
npm install
npm run dev            # http://localhost:5174
```

### 微信小程序
```bash
cd WisdomTree_Client
npm run build:mp-weixin   # 产物 dist/build/mp-weixin，微信开发者工具导入
```

## 👤 演示账号（密码均为 123456）

| 角色 | 账号 | 登录端 |
|------|------|--------|
| 游客 | `testuser` | H5 / 小程序 |
| 农户 | `farmer`（绿野生态农场） | 管理后台 |
| 政府 | `gov` | 管理后台 |
| 管理员 | `admin` | 管理后台 |

## 🔒 安全说明

- `.env` / `*.sql` 已被 `.gitignore` 排除，密钥不入库
- 后端使用 `bcrypt` 密码加密 + JWT 双令牌（Access 10min / Refresh 30d）
- 三角色权限守卫：`JwtAuthGuard` / `FarmerGuard` / `GovernmentGuard`

## 📜 开发记录

各阶段开发验收记录见根目录 `P0~P5 开发记录.md`，总体方案见 `智慧农旅v2总体方案.md`、`主线落地改造方案.md`。
