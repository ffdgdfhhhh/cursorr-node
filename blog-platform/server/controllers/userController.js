const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Post, Like, Report, Follow } = require('../models');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const PUBLIC_USER_ATTRS = ['id', 'username', 'avatar', 'bio', 'created_at'];

async function buildReportedPostIds(userId) {
  const rows = await Report.findAll({
    where: { reporter_id: userId },
    attributes: ['post_id'],
    raw: true,
  });
  return rows.map((r) => r.post_id);
}

exports.getPublic = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: PUBLIC_USER_ATTRS,
    });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    const data = user.toJSON();
    const viewerId = req.user?.id;
    if (viewerId && viewerId !== user.id) {
      const rel = await Follow.findOne({
        where: { follower_id: viewerId, following_id: user.id },
      });
      data.followed_by_me = !!rel;
    } else {
      data.followed_by_me = false;
    }
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.follow = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ success: false, message: '无效的用户' });
    }
    if (targetId === req.userId) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }
    const target = await User.findByPk(targetId, { attributes: ['id'] });
    if (!target) return res.status(404).json({ success: false, message: '用户不存在' });
    await Follow.findOrCreate({
      where: { follower_id: req.userId, following_id: targetId },
    });
    res.json({ success: true, data: { following: true } });
  } catch (e) {
    next(e);
  }
};

exports.unfollow = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ success: false, message: '无效的用户' });
    }
    await Follow.destroy({
      where: { follower_id: req.userId, following_id: targetId },
    });
    res.json({ success: true, data: { following: false } });
  } catch (e) {
    next(e);
  }
};

exports.myFollowing = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const { count, rows } = await Follow.findAndCountAll({
      where: { follower_id: req.userId },
      include: [{ model: User, as: 'following', attributes: PUBLIC_USER_ATTRS }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const data = rows.map((r) => r.following.toJSON());
    res.json({
      success: true,
      data,
      meta: { page, limit, total: count },
    });
  } catch (e) {
    next(e);
  }
};

exports.userPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const viewerId = req.user?.id;
    const reportedIds = viewerId ? await buildReportedPostIds(viewerId) : [];

    const where = {
      user_id: userId,
      status: 'active',
      ...(reportedIds.length ? { id: { [Op.notIn]: reportedIds } } : {}),
    };

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    let likedSet = new Set();
    if (viewerId && rows.length) {
      const ids = rows.map((p) => p.id);
      const likes = await Like.findAll({
        where: { user_id: viewerId, post_id: { [Op.in]: ids } },
        attributes: ['post_id'],
        raw: true,
      });
      likedSet = new Set(likes.map((l) => l.post_id));
    }

    const data = rows.map((p) => {
      const j = p.toJSON();
      j.liked_by_me = viewerId ? likedSet.has(j.id) : false;
      return j;
    });

    res.json({
      success: true,
      data,
      meta: { page, limit, total: count },
    });
  } catch (e) {
    next(e);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    const user = await User.findByPk(req.userId);
    if (username !== undefined) {
      const u = String(username).trim().slice(0, 50);
      if (u) {
        const clash = await User.findOne({ where: { username: u, id: { [Op.ne]: req.userId } } });
        if (clash) return res.status(409).json({ success: false, message: '用户名已被占用' });
        user.username = u;
      }
    }
    if (bio !== undefined) user.bio = bio === null ? null : String(bio).slice(0, 500);
    await user.save();
    const out = user.toJSON();
    delete out.password;
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择头像文件' });
    }
    const user = await User.findByPk(req.userId);
    const prev = user.avatar;
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    if (prev && /^\/uploads\//.test(prev)) {
      const base = path.basename(prev);
      if (base && base !== path.basename(user.avatar)) {
        const fp = path.join(UPLOADS_DIR, base);
        if (fp.startsWith(UPLOADS_DIR) && fs.existsSync(fp)) {
          try {
            fs.unlinkSync(fp);
          } catch {
            /* ignore */
          }
        }
      }
    }
    const out = user.toJSON();
    delete out.password;
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
};

exports.myLikedPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const reportedIds = await buildReportedPostIds(req.userId);

    const postWhere = {
      status: 'active',
      ...(reportedIds.length ? { id: { [Op.notIn]: reportedIds } } : {}),
    };

    const { count, rows: likes } = await Like.findAndCountAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Post,
          as: 'post',
          required: true,
          where: postWhere,
          include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const data = likes.map((like) => {
      const j = like.post.toJSON();
      j.liked_by_me = true;
      return j;
    });

    res.json({
      success: true,
      data,
      meta: { page, limit, total: count },
    });
  } catch (e) {
    next(e);
  }
};

exports.myReports = async (req, res, next) => {
  try {
    const rows = await Report.findAll({
      where: { reporter_id: req.userId },
      include: [{ model: Post, attributes: ['id', 'title', 'channel', 'created_at'] }],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '请填写当前密码，新密码至少6位' });
    }
    const user = await User.findByPk(req.userId);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: '密码已更新' });
  } catch (e) {
    next(e);
  }
};
