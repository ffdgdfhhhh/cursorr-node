const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(jpe?g|png|gif|webp)$/i.test(file.originalname)) {
      const err = new Error('头像仅支持 jpg/png/gif/webp');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

router.get('/me/liked-posts', requireAuth, userController.myLikedPosts);
router.get('/me/reports', requireAuth, userController.myReports);
router.get('/me/following', requireAuth, userController.myFollowing);
router.put('/profile', requireAuth, userController.updateProfile);
router.put('/profile/password', requireAuth, userController.changePassword);
function avatarMiddleware(req, res, next) {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      const msg = err.message || '头像上传失败';
      const status = err.status || 400;
      return res.status(status).json({ success: false, message: msg });
    }
    next();
  });
}

router.put('/avatar', requireAuth, avatarMiddleware, userController.updateAvatar);

router.post('/:id/follow', requireAuth, userController.follow);
router.delete('/:id/follow', requireAuth, userController.unfollow);

router.get('/:id/posts', optionalAuth, userController.userPosts);
router.get('/:id', optionalAuth, userController.getPublic);

module.exports = router;
