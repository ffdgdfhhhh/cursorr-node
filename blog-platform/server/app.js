const fs = require('fs');
const path = require('path');

(function loadEnv() {
  const candidates = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    require('dotenv').config({ path: found });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[env] 已加载: ${found}`);
    }
  } else {
    require('dotenv').config();
    console.warn('[env] 未找到 .env，已尝试下列路径（请任选其一新建文件并写入 DB_PASSWORD 等）：');
    candidates.forEach((p) => console.warn(`    - ${p}`));
    console.warn(
      '[env] Windows 若新建文件变成 .env.txt，请在资源管理器里开启「显示文件扩展名」后改名为 .env'
    );
  }
})();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { seed } = require('./utils/seed');
const { initSocket } = require('./socket');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '创享社区 API 运行中' });
});

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

initSocket(server);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seed();
    server.listen(PORT, () => {
      console.log(`创享社区 API & Socket 监听 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err.parent?.message || err.message || err);
    const code = err.parent?.code || err.original?.code;
    const sqlMsg = String(err.parent?.sqlMessage || err.original?.sqlMessage || '');
    if (code === 'ER_ACCESS_DENIED_ERROR') {
      if (sqlMsg.includes('using password: NO')) {
        console.error(
          '\n[数据库] MySQL 拒绝了连接：未携带密码。\n' +
            '- 请在 .env 中设置 DB_PASSWORD=你的密码（Windows 下勿加引号也可）\n' +
            '- 确认 .env 在 server 目录或 blog-platform 根目录，且变量名是 DB_PASSWORD\n'
        );
      } else {
        console.error(
          '\n[数据库] 账号或密码不正确，请检查 DB_USER、DB_PASSWORD 是否与 MySQL 一致。\n'
        );
      }
    }
    process.exit(1);
  }
}

bootstrap();
