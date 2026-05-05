function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: '接口不存在' });
}

module.exports = { errorHandler, notFoundHandler };
