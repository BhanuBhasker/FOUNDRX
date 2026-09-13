import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../services/token.service.js';
import {
  createLocalUser,
  createGoogleUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  linkGoogleAccount,
} from '../models/user.model.js';

const googleClient = new OAuth2Client(env.googleClientId);
const SALT_ROUNDS = 12;

function publicUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createLocalUser({ name, email, passwordHash });

  const token = signToken(user.user_id);
  setAuthCookie(res, token);
  sendSuccess(res, { statusCode: 201, message: 'Account created', data: { user: publicUser(user), token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user || user.auth_provider !== 'local' || !user.password_hash) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') throw ApiError.forbidden('Account suspended');

  const token = signToken(user.user_id);
  setAuthCookie(res, token);
  sendSuccess(res, { message: 'Logged in', data: { user: publicUser(user), token } });
});

/**
 * Verifies a Google Identity Services ID token (sent by the frontend's
 * Google Sign-In button) and creates or logs in the matching account.
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google credential');
  }
  if (!payload?.email) throw ApiError.unauthorized('Google account has no email');

  let user = await findUserByGoogleId(payload.sub);

  if (!user) {
    const existingByEmail = await findUserByEmail(payload.email);
    if (existingByEmail) {
      user = await linkGoogleAccount(existingByEmail.user_id, { googleId: payload.sub, avatarUrl: payload.picture });
    } else {
      user = await createGoogleUser({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
      });
    }
  }

  if (user.status !== 'active') throw ApiError.forbidden('Account suspended');

  const token = signToken(user.user_id);
  setAuthCookie(res, token);
  sendSuccess(res, { message: 'Logged in with Google', data: { user: publicUser(user), token } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.user_id);
  sendSuccess(res, { message: 'Current session', data: { user } });
});
