import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookieName);
}
