const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`[${new Date().toISOString()}] ERROR ${status}: ${message}`);
  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      type: status === 400 ? 'invalid_request_error' : status < 500 ? 'api_error' : 'server_error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    request_id: req.headers['x-request-id'] || null,
  });
};

module.exports = { errorHandler, createError };
