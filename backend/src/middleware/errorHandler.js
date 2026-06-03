import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  // Mongoose cast (bad ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Multer
  if (err.name === 'MulterError') {
    status = 400;
    message = err.message;
  }

  if (status >= 500 && !env.isProd) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export { errorHandler, notFoundHandler };
