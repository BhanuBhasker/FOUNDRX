import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findUserById } from '../models/user.model.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.[env.cookieName]) return req.cookies[env.cookieName];
  return null;
}

/** Requires a valid session; attaches req.user. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await findUserById(payload.sub);
  if (!user || user.status !== 'active') {
    throw ApiError.unauthorized('Account not available');
  }

  req.user = user;
  next();
});

/** Attaches req.user when present, but never rejects the request. */
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await findUserById(payload.sub);
    if (user && user.status === 'active') req.user = user;
  } catch {
    // ignore invalid tokens on optional-auth routes
  }
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}
