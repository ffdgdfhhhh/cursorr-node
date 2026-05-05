const { Op } = require('sequelize');
const { Conversation, Message, User } = require('../models');

function peerUser(conv, myId) {
  return conv.user1_id === myId ? conv.user2 : conv.user1;
}

exports.listConversations = async (req, res, next) => {
  try {
    const myId = req.userId;
    const rows = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1_id: myId }, { user2_id: myId }],
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'avatar'] },
      ],
      order: [['updated_at', 'DESC']],
    });

    const data = await Promise.all(
      rows.map(async (c) => {
        const j = c.toJSON();
        const peer = peerUser(j, myId);
        const unread = await Message.count({
          where: {
            conversation_id: c.id,
            sender_id: { [Op.ne]: myId },
            is_read: false,
          },
        });
        return {
          id: c.id,
          peer,
          last_message: j.last_message,
          updated_at: j.updated_at,
          unread_count: unread,
        };
      })
    );

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const myId = req.userId;
    const peerId = parseInt(req.body.userId || req.body.peerId, 10);
    if (!peerId || peerId === myId) {
      return res.status(400).json({ success: false, message: '无效的用户' });
    }
    const peer = await User.findByPk(peerId, { attributes: ['id'] });
    if (!peer) return res.status(404).json({ success: false, message: '用户不存在' });

    const u1 = Math.min(myId, peerId);
    const u2 = Math.max(myId, peerId);

    let conv = await Conversation.findOne({
      where: { user1_id: u1, user2_id: u2 },
    });
    if (!conv) {
      conv = await Conversation.create({
        user1_id: u1,
        user2_id: u2,
        last_message: '',
        updated_at: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        id: conv.id,
        peerId,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.listMessages = async (req, res, next) => {
  try {
    const convId = req.params.id;
    const myId = req.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const conv = await Conversation.findByPk(convId);
    if (!conv || (conv.user1_id !== myId && conv.user2_id !== myId)) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }

    const { rows, count } = await Message.findAndCountAll({
      where: { conversation_id: convId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      data: rows.reverse(),
      meta: { page, limit, total: count },
    });
  } catch (e) {
    next(e);
  }
};

exports.markConversationRead = async (req, res, next) => {
  try {
    const convId = req.params.id;
    const myId = req.userId;
    const conv = await Conversation.findByPk(convId);
    if (!conv || (conv.user1_id !== myId && conv.user2_id !== myId)) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    await Message.update(
      { is_read: true },
      {
        where: {
          conversation_id: convId,
          sender_id: { [Op.ne]: myId },
          is_read: false,
        },
      }
    );
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
