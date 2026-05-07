const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret';

/** 未显式提供用户名时，从邮箱本地部分生成默认用户名（仅用于占用展示名，仍保证唯一） */
function deriveUsernameFromEmail(email) {
  const local = String(email).split('@')[0] || 'user';
  const cleaned = local
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const base = (cleaned || 'user').slice(0, 50);
  return base;
}

async function allocateUniqueUsername(preferred) {
  let candidate = preferred.slice(0, 50);
  for (let attempt = 0; attempt < 80; attempt++) {
    const exists = await User.findOne({ where: { username: candidate } });
    if (!exists) return candidate;
    const rnd = `${Date.now()}${Math.random()}`.replace(/\D/g, '').slice(-8);
    candidate = `${preferred.slice(0, 41)}_${rnd}`.slice(0, 50);
  }
  return `user_${Date.now()}`.slice(0, 50);
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET(), { expiresIn: '7d' });
}

function sanitizeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.password;
  return u;
}

exports.register = async (req, res, next) => {
  try {
    const { username: rawUsername, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和密码必填' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }
    const emailNorm = String(email).slice(0, 100).toLowerCase();
    const emailTaken = await User.findOne({ where: { email: emailNorm } });
    if (emailTaken) {
      return res.status(409).json({ success: false, message: '该邮箱已被注册' });
    }

    let username =
      rawUsername && String(rawUsername).trim() ? String(rawUsername).trim().slice(0, 50) : '';
    if (!username) {
      username = deriveUsernameFromEmail(emailNorm);
    }
    username = await allocateUniqueUsername(username);

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: emailNorm,
      password: hash,
    });
    const token = signToken(user.id);
    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(user), token },
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和密码必填' });
    }
    const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const token = signToken(user.id);
    res.json({
      success: true,
      data: { user: sanitizeUser(user), token },
    });
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ success: true, data: sanitizeUser(req.user) });
  } catch (e) {
    next(e);
  }
};
