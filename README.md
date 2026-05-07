# cursorr-node

业务项目在 **`blog-platform/`** 目录（Vue 前端 + Node 后端 + MySQL）。

## 克隆与拉取更新

```bash
git clone https://github.com/ffdgdfhhhh/cursorr-node.git
cd cursorr-node/blog-platform
git pull
```

## 克隆后必做（不在仓库里的内容）

- 在 **`blog-platform/server/`**、**`blog-platform/client/`** 分别执行：`npm install`
- 复制 **`server/.env.example`** 为 **`server/.env`** 并填写数据库等配置（勿提交 `.env`）
- 前端生产构建产物目录 **`client/dist`** 由 `npm run build` 生成，默认不纳入 Git

本地开发与故障排查见 **`blog-platform/README.md`**；服务器部署见 **`blog-platform/部署教程.md`**，日常发版见 **`blog-platform/后续更新与维护.md`**。
