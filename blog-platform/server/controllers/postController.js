const { Op } = require('sequelize');
const {
  Post,
  User,
  Like,
  Comment,
  Report,
  sequelize,
} = require('../models');

const PUBLIC_USER_ATTRS = ['id', 'username', 'avatar'];

async function buildReportedPostIds(userId) {
  if (!userId) return [];
  const rows = await Report.findAll({
    where: { reporter_id: userId },
    attributes: ['post_id'],
    raw: true,
  });
  return rows.map((r) => r.post_id);
}

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const channel = req.query.channel;
    const type = req.query.type;
    const userId = req.user?.id;

    const reportedIds = await buildReportedPostIds(userId);

    const where = {
      status: 'active',
      ...(channel && channel !== '全部' ? { channel } : {}),
      ...(type ? { type } : {}),
      ...(reportedIds.length ? { id: { [Op.notIn]: reportedIds } } : {}),
    };

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRS }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    let likedSet = new Set();
    if (userId && rows.length) {
      const ids = rows.map((p) => p.id);
      const likes = await Like.findAll({
        where: { user_id: userId, post_id: { [Op.in]: ids } },
        attributes: ['post_id'],
        raw: true,
      });
      likedSet = new Set(likes.map((l) => l.post_id));
    }

    const data = rows.map((p) => {
      const j = p.toJSON();
      j.liked_by_me = userId ? likedSet.has(j.id) : false;
      return j;
    });

    res.json({
      success: true,
      data,
      meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id;

    const post = await Post.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRS }],
    });
    if (!post || post.status === 'banned') {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    if (userId) {
      const rep = await Report.findOne({ where: { post_id: id, reporter_id: userId } });
      if (rep) {
        return res.status(404).json({ success: false, message: '该内容已举报并对你隐藏' });
      }
    }

    let liked_by_me = false;
    if (userId) {
      liked_by_me = !!(await Like.findOne({ where: { user_id: userId, post_id: id } }));
    }

    const j = post.toJSON();
    j.liked_by_me = liked_by_me;
    res.json({ success: true, data: j });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const userId = req.userId;
    let { title, content, channel, type } = req.body;

    const media_urls = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        media_urls.push(`/uploads/${f.filename}`);
      }
    }

    if (!channel) {
      return res.status(400).json({ success: false, message: '请选择频道' });
    }

    type = type || 'text';
    if (['image', 'video', 'mixed'].includes(type) && !media_urls.length && type !== 'text') {
      // allow text-only mixed as text visually
      if (type === 'image' || type === 'video') {
        return res.status(400).json({ success: false, message: '请上传媒体文件' });
      }
    }

    if (!content && !media_urls.length) {
      return res.status(400).json({ success: false, message: '内容或媒体至少填一项' });
    }

    const post = await Post.create({
      user_id: userId,
      title: title ? String(title).slice(0, 200) : null,
      content: content ? String(content).slice(0, 20000) : null,
      channel: String(channel).slice(0, 50),
      type,
      media_urls,
      status: 'active',
    });

    const full = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRS }],
    });
    const j = full.toJSON();
    j.liked_by_me = false;
    res.status(201).json({ success: true, data: j });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
    if (post.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: '无权删除' });
    }
    await post.destroy();
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    next(e);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const post = await Post.findByPk(postId);
    if (!post || post.status !== 'active') {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const existing = await Like.findOne({ where: { user_id: userId, post_id: postId } });
    let liked;
    if (existing) {
      await existing.destroy();
      await post.decrement('likes_count', { by: 1 });
      liked = false;
    } else {
      await Like.create({ user_id: userId, post_id: postId });
      await post.increment('likes_count', { by: 1 });
      liked = true;
    }
    await post.reload();
    res.json({
      success: true,
      data: { liked, likes_count: post.likes_count },
    });
  } catch (e) {
    next(e);
  }
};

exports.listComments = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const roots = await Comment.findAll({
      where: { post_id: postId, parent_id: null },
      include: [
        { model: User, as: 'author', attributes: PUBLIC_USER_ATTRS },
        {
          model: Comment,
          as: 'replies',
          separate: true,
          order: [['created_at', 'ASC']],
          include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRS }],
        },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: roots });
  } catch (e) {
    next(e);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { content, parent_id } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });

    const comment = await Comment.create({
      post_id: postId,
      user_id: req.userId,
      parent_id: parent_id || null,
      content: String(content).trim().slice(0, 2000),
    });
    await post.increment('comments_count', { by: 1 });

    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRS }],
    });
    res.status(201).json({ success: true, data: full });
  } catch (e) {
    next(e);
  }
};

exports.report = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { reason, description } = req.body;
    const allowed = ['spam', 'harassment', 'copyright', 'other'];
    if (!reason || !allowed.includes(reason)) {
      return res.status(400).json({ success: false, message: '请选择举报原因' });
    }
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });

    const [report, created] = await Report.findOrCreate({
      where: { post_id: postId, reporter_id: req.userId },
      defaults: {
        reason,
        description: description ? String(description).slice(0, 2000) : null,
        status: 'pending',
      },
    });
    if (!created) {
      return res.json({ success: true, message: '您已举报过该帖', data: { already: true } });
    }

    res.status(201).json({ success: true, message: '举报已提交', data: report });
  } catch (e) {
    next(e);
  }
};
