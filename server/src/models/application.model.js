import { pool } from '../config/db.js';

export async function createApplication({ type, senderId, receiverId, startupId, message, compatibilityScore }) {
  const [result] = await pool.query(
    `INSERT INTO Applications (type, sender_id, receiver_id, startup_id, message, compatibility_score)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [type, senderId, receiverId, startupId ?? null, message ?? null, compatibilityScore ?? 0]
  );
  return getApplicationById(result.insertId);
}

export async function getApplicationById(applicationId) {
  const [rows] = await pool.query(
    `SELECT a.*, su.name AS sender_name, su.avatar_url AS sender_avatar,
            ru.name AS receiver_name, ru.avatar_url AS receiver_avatar,
            s.name AS startup_name
     FROM Applications a
     JOIN Users su ON su.user_id = a.sender_id
     JOIN Users ru ON ru.user_id = a.receiver_id
     LEFT JOIN Startups s ON s.startup_id = a.startup_id
     WHERE a.application_id = ? LIMIT 1`,
    [applicationId]
  );
  return rows[0] || null;
}

export async function findPendingBetween(senderId, receiverId, type, startupId) {
  const conditions = ['sender_id = ?', 'receiver_id = ?', "status = 'pending'", 'type = ?'];
  const params = [senderId, receiverId, type];
  if (startupId) {
    conditions.push('startup_id = ?');
    params.push(startupId);
  }
  const [rows] = await pool.query(
    `SELECT application_id FROM Applications WHERE ${conditions.join(' AND ')} LIMIT 1`,
    params
  );
  return rows[0] || null;
}

/**
 * Unified application listing per Blueprint §7 (`GET /api/applications`).
 * `direction` selects the caller's side of the request: 'received',
 * 'sent', or 'all' (used by the "Startup Applications" tab, which spans
 * both directions filtered down by `type`).
 */
export async function listApplications(userId, { direction = 'all', type, status, limit, offset }) {
  const conditions = [];
  const params = [];

  if (direction === 'received') {
    conditions.push('a.receiver_id = ?');
    params.push(userId);
  } else if (direction === 'sent') {
    conditions.push('a.sender_id = ?');
    params.push(userId);
  } else {
    conditions.push('(a.sender_id = ? OR a.receiver_id = ?)');
    params.push(userId, userId);
  }

  if (type) {
    conditions.push('a.type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT a.*, su.name AS sender_name, su.avatar_url AS sender_avatar,
            ru.name AS receiver_name, ru.avatar_url AS receiver_avatar,
            s.name AS startup_name
     FROM Applications a
     JOIN Users su ON su.user_id = a.sender_id
     JOIN Users ru ON ru.user_id = a.receiver_id
     LEFT JOIN Startups s ON s.startup_id = a.startup_id
     ${whereClause}
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Applications a ${whereClause}`, params);
  return { rows, total };
}

export async function rejectApplication(applicationId, receiverId) {
  const [result] = await pool.query(
    `UPDATE Applications SET status = 'rejected' WHERE application_id = ? AND receiver_id = ? AND status = 'pending'`,
    [applicationId, receiverId]
  );
  return result.affectedRows > 0;
}

export async function cancelApplication(applicationId, senderId) {
  const [result] = await pool.query(
    `UPDATE Applications SET status = 'cancelled' WHERE application_id = ? AND sender_id = ? AND status = 'pending'`,
    [applicationId, senderId]
  );
  return result.affectedRows > 0;
}

/** Runs the sp_accept_application stored procedure as a single transaction. */
export async function acceptApplication(applicationId, receiverId) {
  await pool.query(`CALL sp_accept_application(?, ?)`, [applicationId, receiverId]);
  return getApplicationById(applicationId);
}

export async function applicationStatsForUser(userId) {
  const [rows] = await pool.query(`SELECT * FROM application_stats_by_user WHERE user_id = ?`, [userId]);
  return rows[0] || { total_received: 0, pending_count: 0, accepted_count: 0, rejected_count: 0, avg_compatibility: 0 };
}
