import { pool } from '../config/db.js';

export async function listNotifications(userId, { limit, offset, unreadOnly }) {
  const conditions = ['user_id = ?'];
  const params = [userId];
  if (unreadOnly) conditions.push('is_read = 0');
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.query(
    `SELECT * FROM Notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Notifications ${whereClause}`, params);
  const [[{ unread }]] = await pool.query(
    `SELECT COUNT(*) AS unread FROM Notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return { rows, total, unread };
}

export async function markNotificationRead(notificationId, userId) {
  await pool.query(`UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`, [notificationId, userId]);
}

export async function markAllNotificationsRead(userId) {
  await pool.query(`UPDATE Notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
}
