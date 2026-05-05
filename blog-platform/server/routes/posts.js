const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { upload, multerErrorHandler, validateMediaSizes } = require('../middleware/upload');

router.get('/', optionalAuth, postController.list);
router.get('/:id', optionalAuth, postController.getById);

router.post(
  '/',
  requireAuth,
  upload.array('files', 12),
  multerErrorHandler,
  validateMediaSizes,
  postController.create
);

router.delete('/:id', requireAuth, postController.remove);
router.post('/:id/like', requireAuth, postController.toggleLike);
router.get('/:id/comments', postController.listComments);
router.post('/:id/comments', requireAuth, postController.addComment);
router.post('/:id/report', requireAuth, postController.report);

module.exports = router;
