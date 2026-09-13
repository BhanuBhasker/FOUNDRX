import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : err.statusCode || 500;

  if (!isApiError) {
    console.error('[unhandled error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    details: isApiError ? err.details : undefined,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
  });
}
