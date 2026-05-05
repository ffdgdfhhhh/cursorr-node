const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

router.get('/conversations', requireAuth, messageController.listConversations);
router.post('/conversations', requireAuth, messageController.getOrCreateConversation);
router.get('/conversations/:id', requireAuth, messageController.listMessages);
router.put('/conversations/:id/read', requireAuth, messageController.markConversationRead);

module.exports = router;
