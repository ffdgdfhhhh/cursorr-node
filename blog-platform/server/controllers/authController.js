const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret';

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
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '用户名、邮箱和密码必填' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }
    const exists = await User.findOne({
      where: { [require('sequelize').Op.or]: [{ email }, { username }] },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: String(username).slice(0, 50),
      email: String(email).slice(0, 100).toLowerCase(),
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
