import { pool } from '../config/db.js';

export async function createLocalUser({ name, email, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO Users (name, email, password_hash, auth_provider) VALUES (?, ?, ?, 'local')`,
    [name, email, passwordHash]
  );
  return findUserById(result.insertId);
}

export async function createGoogleUser({ name, email, googleId, avatarUrl }) {
  const [result] = await pool.query(
    `INSERT INTO Users (name, email, google_id, avatar_url, auth_provider) VALUES (?, ?, ?, ?, 'google')`,
    [name, email, googleId, avatarUrl]
  );
  return findUserById(result.insertId);
}

export async function findUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, avatar_url, user_role AS role, status, auth_provider, created_at
     FROM Users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(`SELECT * FROM Users WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

export async function findUserByGoogleId(googleId) {
  const [rows] = await pool.query(`SELECT * FROM Users WHERE google_id = ? LIMIT 1`, [googleId]);
  return rows[0] || null;
}

export async function linkGoogleAccount(userId, { googleId, avatarUrl }) {
  await pool.query(
    `UPDATE Users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE user_id = ?`,
    [googleId, avatarUrl, userId]
  );
  return findUserById(userId);
}

export async function listUsersForAdmin({ limit, offset, search }) {
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE u.name LIKE ? OR u.email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  const [rows] = await pool.query(
    `SELECT u.user_id, u.name, u.email, u.user_role AS role, u.status, u.auth_provider, u.created_at
     FROM Users u ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Users u ${where}`,
    params
  );
  return { rows, total };
}

export async function updateUserStatus(userId, status) {
  await pool.query(`UPDATE Users SET status = ? WHERE user_id = ?`, [status, userId]);
}

export async function updateUserRole(userId, role) {
  await pool.query(`UPDATE Users SET user_role = ? WHERE user_id = ?`, [role, userId]);
}

export async function countUsers() {
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Users`);
  return total;
}
