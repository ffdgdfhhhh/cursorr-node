const { Channel } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const rows = await Channel.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] });
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
};
