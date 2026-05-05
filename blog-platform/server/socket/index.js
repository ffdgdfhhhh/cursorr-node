const jwt = require('jsonwebtoken');
const { Conversation, Message, User } = require('../models');

function initSocket(httpServer, ioOptions = {}) {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    ...ioOptions,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers.authorization &&
          socket.handshake.headers.authorization.replace(/^Bearer\s+/i, ''));
      if (!token) {
        const err = new Error('未授权');
        err.data = { code: 'NO_TOKEN' };
        return next(err);
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      socket.userId = payload.userId;
      next();
    } catch (e) {
      const err = new Error('令牌无效');
      err.data = { code: 'BAD_TOKEN' };
      next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', async ({ conversationId }, cb) => {
      try {
        const conv = await Conversation.findByPk(conversationId);
        if (!conv || (conv.user1_id !== socket.userId && conv.user2_id !== socket.userId)) {
          if (cb) cb({ success: false, message: '无权加入会话' });
          return;
        }
        socket.join(`conv:${conversationId}`);
        if (cb) cb({ success: true });
      } catch (e) {
        if (cb) cb({ success: false, message: e.message });
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, content }, cb) => {
      try {
        const text = content != null ? String(content).trim().slice(0, 5000) : '';
        if (!text) {
          if (cb) cb({ success: false, message: '消息不能为空' });
          return;
        }
        const conv = await Conversation.findByPk(conversationId);
        if (!conv || (conv.user1_id !== socket.userId && conv.user2_id !== socket.userId)) {
          if (cb) cb({ success: false, message: '会话不存在' });
          return;
        }

        const msg = await Message.create({
          conversation_id: conversationId,
          sender_id: socket.userId,
          content: text,
          is_read: false,
        });

        conv.last_message = text.slice(0, 500);
        conv.updated_at = new Date();
        await conv.save();

        const full = await Message.findByPk(msg.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] }],
        });

        const payload = { success: true, message: full.toJSON() };
        io.to(`conv:${conversationId}`).emit('receive_message', payload);
        if (cb) cb(payload);
      } catch (e) {
        if (cb) cb({ success: false, message: e.message });
      }
    });

    socket.on('mark_read', async ({ conversationId }, cb) => {
      try {
        const { Op } = require('sequelize');
        const conv = await Conversation.findByPk(conversationId);
        if (!conv || (conv.user1_id !== socket.userId && conv.user2_id !== socket.userId)) {
          if (cb) cb({ success: false });
          return;
        }
        await Message.update(
          { is_read: true },
          {
            where: {
              conversation_id: conversationId,
              sender_id: { [Op.ne]: socket.userId },
              is_read: false,
            },
          }
        );
        io.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: socket.userId,
        });
        if (cb) cb({ success: true });
      } catch (e) {
        if (cb) cb({ success: false });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
