# 创享社区（Chuangxiang Blog Platform）

全栈博客社交平台：Vue 3 + Vite 前端，Node.js + Express + Sequelize + MySQL 后端，JWT 认证，Socket.io 实时私信，本地 `/uploads` 静态文件存储。

## 功能概览

- 账号：注册 / 登录 / JWT、`/api/auth/me`
- **前端会话**：登录成功后后端下发的 Token 写入 `localStorage`；Axios 请求自动附加 `Authorization: Bearer <token>`；路由 **`requiresAuth`** 无 Token 时跳转登录页；JWT 过期或接口返回 **401**（除登录/注册密码错误）会清理会话并在需登录页带回登录（地址栏可带 `expired=1` 提示）；**登录或注册成功后固定进入首页 `/`**，不使用 `redirect` 回到上一页（避免例如从私信退出后再登录仍落在私信）。
- 帖子：列表筛选（频道、类型、分页）、详情、发布（multipart 多文件）、删除、点赞切换、评论（二级）、举报（举报后对举报人隐藏）
- 频道：后端初始化 8 个频道 + 种子帖子
- 用户：公开资料、用户帖子流、资料修改、头像上传、点赞列表、举报记录、修改密码
- 私信：会话列表、消息分页、Socket.io `send_message` / `receive_message` / `mark_read`，进入会话 REST 标记已读
- **布局**：首页、关注、我的、私信、帖子详情等主要页面均挂载 **`BottomNav`**（小屏底栏 / 大屏左侧主导航），避免从首页进入详情后侧栏消失。

## 环境要求

- Node.js 18+
- MySQL 8.0

## 常见问题：前端 `ECONNREFUSED` / 登录网络错误 / `status code 500`

这通常表示 **后端没在跑或没在 3000 端口**。Vite 将 `/api`、`/uploads` 代理到 `http://127.0.0.1:3000`，目标不可达时浏览器侧有时会表现为 **500** 或网络错误，请以终端是否出现 **`connect ECONNREFUSED 127.0.0.1:3000`** 为准。

请先确认后端终端：

- 若出现 `Access denied ... (using password: NO)`：说明 **没有读到数据库密码**。请在下列 **任一位置** 新建名为 **`.env`** 的文件（不要叫 `.env.example`，也不要是 `.env.txt`），并写入 **`DB_PASSWORD=你的MySQL密码`** 等变量：
  - `blog-platform/server/.env`（推荐）
  - `blog-platform/.env`
  - 若你把仓库放在 `cursorr node/blog-platform` 下，也可使用上一级 **`cursorr node/.env`**
  - 保存后重启后端；启动成功时会打印 `[env] 已加载: ...` 以便确认读到的路径。
- 确认后端日志里有：`创享社区 API & Socket 监听 http://localhost:3000`。
- 若报端口占用（`EADDRINUSE`），结束占用 **3000** 的进程，或修改 `server/.env` 的 **`PORT`**，并同步修改 `client/vite.config.js` 里代理的 **`target`** 端口。

## 数据库配置

1. 创建数据库（可选用仓库根目录 `database.sql`）：

   ```bash
   mysql -u root -p < database.sql
   ```

2. 复制服务端环境变量：

   ```bash
   cd server
   cp .env.example .env
   ```

   编辑 `server/.env` 中的 `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`JWT_SECRET`、`CLIENT_ORIGIN`（默认 `http://localhost:5173`）。

首次启动时 Sequelize 会 `sync()` 自动建表；种子脚本会写入频道、测试用户与演示帖子（若帖子数量不足会自动补齐）。

## 安装依赖

在项目根目录分别安装（Windows PowerShell 若不支持 `&&`，请分两步 `cd` 再执行 `npm install`）：

```bash
cd server && npm install
cd ../client && npm install
```

## 启动命令

**后端（默认端口 3000）**

```bash
cd server
npm run dev
```

**前端（默认端口 5173，已代理 `/api` 与 `/uploads`）**

```bash
cd client
npm run dev
```

浏览器访问：http://localhost:5173

**注意**：前端与后端需 **各开一个终端** 常驻运行；仅启动前端会导致接口代理失败。

若前端独立域名部署，请在 `client/.env` 中配置：

```
VITE_API_BASE=http://你的后端域名
VITE_SOCKET_URL=http://你的后端域名
```

## 默认测试账号

| 用户名 | 邮箱               | 密码   |
|--------|--------------------|--------|
| user1  | user1@example.com  | 123456 |
| user2  | user2@example.com  | 123456 |

## API 前缀

- REST：`http://localhost:3000/api/...`
- 静态文件：`http://localhost:3000/uploads/...`
- Socket.IO：与 HTTP 同端口，前端开发环境默认连接 `http://localhost:3000`（见 `client/.env.example`）

## 目录结构

```
blog-platform/
├── client/          # Vue 3 + Vite + Pinia + Tailwind
├── server/          # Express + Sequelize + Socket.io
├── database.sql     # MySQL 初始化参考脚本
└── README.md
```

前端与会话相关的辅助代码示例：`client/src/utils/authStorage.js`（Token 存储与 JWT 过期调度）、`client/src/api/http.js`（请求头与 401 拦截）、`client/src/stores/auth.js`。

## 安全与说明

- 密码使用 bcrypt 存储；接口对字符串长度与邮箱格式做基础校验。
- 前端 Vue 文本插值默认转义 HTML，帖子正文按纯文本展示以降低 XSS 风险。
- Token 存于浏览器本地存储，请勿在公共设备勾选「记住」敏感场景；生产环境请务必更换强随机 `JWT_SECRET`，并配置 HTTPS 与反向代理。

## 已实现加分项（部分）

- 图片 `loading="lazy"`
- 首页帖子列表使用 `Intersection Observer` 触发加载更多
