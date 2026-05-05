const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i;
  if (!allowed.test(file.originalname)) {
    const err = new Error('仅支持图片(jpg/png/gif/webp)或视频(mp4/webm/mov)');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 12,
  },
});

function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件过大（视频最大100MB，图片最大5MB）' });
    }
    return res.status(400).json({ success: false, message: err.message || '上传失败' });
  }
  if (err && err.status === 400 && err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}

/** Per-file size check: images 5MB, videos 100MB */
function validateMediaSizes(req, res, next) {
  if (!req.files || !req.files.length) return next();
  for (const file of req.files) {
    const isVideo = /\.(mp4|webm|mov)$/i.test(file.originalname);
    const max = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > max) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
      return res.status(400).json({
        success: false,
        message: isVideo ? '单个视频不能超过100MB' : '单张图片不能超过5MB',
      });
    }
  }
  next();
}

module.exports = {
  upload,
  uploadsDir,
  multerErrorHandler,
  validateMediaSizes,
};
