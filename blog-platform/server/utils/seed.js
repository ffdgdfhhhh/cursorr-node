const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Channel,
  Post,
  Conversation,
  Message,
  Follow,
} = require('../models');

const CHANNEL_NAMES = ['推荐', '热门', '视频', '图文', '生活', '科技', '美食', '旅行'];

const POST_TYPES_CYCLE = ['text', 'image', 'video', 'mixed'];

async function seed() {
  const hash = await bcrypt.hash('123456', 10);

  const [user1] = await User.findOrCreate({
    where: { email: 'user1@example.com' },
    defaults: {
      username: 'user1',
      email: 'user1@example.com',
      password: hash,
      bio: '我是测试用户 user1，欢迎来创享社区～',
    },
  });
  const [user2] = await User.findOrCreate({
    where: { email: 'user2@example.com' },
    defaults: {
      username: 'user2',
      email: 'user2@example.com',
      password: hash,
      bio: '我是测试用户 user2',
    },
  });

  if (user1.password !== hash) {
    user1.password = hash;
    await user1.save();
  }
  if (user2.password !== hash) {
    user2.password = hash;
    await user2.save();
  }

  let order = 0;
  for (const name of CHANNEL_NAMES) {
    await Channel.findOrCreate({
      where: { name },
      defaults: { sort_order: order++ },
    });
  }

  const existingPosts = await Post.count();
  if (existingPosts >= CHANNEL_NAMES.length * 3) {
    return { skippedPosts: true };
  }

  let idx = 0;
  for (const channel of CHANNEL_NAMES) {
    for (let i = 0; i < 3; i++) {
      const type = POST_TYPES_CYCLE[(idx + i) % POST_TYPES_CYCLE.length];
      const authorId = i % 2 === 0 ? user1.id : user2.id;
      const titles = {
        text: `${channel} · 文字动态 ${i + 1}`,
        image: `${channel} · 九宫格美图分享`,
        video: `${channel} · 短视频记录`,
        mixed: `${channel} · 图文混搭帖子`,
      };
      const bodies = {
        text: `这是一条来自「${channel}」频道的文字帖。#创享社区 和你一起记录生活 ✨`,
        image: `今日分享｜${channel} 频道精选配图帖（演示数据，可上传真实图片替换）。`,
        video: `短视频封面文案：${channel} 频道演示视频帖，点击播放器即可观看（可替换为实际上传文件）。`,
        mixed: `图文混合：${channel} 频道内容更丰富。\n\n附：图片与文字结合的浏览体验更接近真实社区。`,
      };

      let media_urls = [];
      if (type === 'image' || type === 'mixed') {
        media_urls = [
          'https://picsum.photos/seed/cx1/800/600',
          'https://picsum.photos/seed/cx2/800/600',
        ];
      }
      if (type === 'video') {
        media_urls = ['https://www.w3schools.com/html/mov_bbb.mp4'];
      }

      await Post.create({
        user_id: authorId,
        type,
        title: titles[type],
        content: bodies[type],
        media_urls,
        channel,
        likes_count: Math.floor(Math.random() * 50),
        comments_count: Math.floor(Math.random() * 20),
        status: 'active',
      });
    }
    idx += 1;
  }

  const u1 = Math.min(user1.id, user2.id);
  const u2 = Math.max(user1.id, user2.id);
  const [conv] = await Conversation.findOrCreate({
    where: { user1_id: u1, user2_id: u2 },
    defaults: {
      last_message: '嗨，这是一条演示私信～',
      updated_at: new Date(),
    },
  });

  const msgCount = await Message.count({ where: { conversation_id: conv.id } });
  if (msgCount === 0) {
    await Message.bulkCreate([
      {
        conversation_id: conv.id,
        sender_id: user1.id,
        content: '你好 user2，欢迎使用创享社区私信～',
        is_read: true,
      },
      {
        conversation_id: conv.id,
        sender_id: user2.id,
        content: '你好 user1，收到啦！',
        is_read: false,
      },
    ]);
  }

  await Follow.findOrCreate({
    where: { follower_id: user1.id, following_id: user2.id },
  });

  return { ok: true };
}

module.exports = { seed };
