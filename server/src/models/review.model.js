import { pool } from '../config/db.js';

export async function createReview({ reviewerId, reviewedId, startupId, rating, comment }) {
  const [result] = await pool.query(
    `INSERT INTO Reviews (reviewer_id, reviewed_id, startup_id, rating, comment) VALUES (?, ?, ?, ?, ?)`,
    [reviewerId, reviewedId, startupId ?? null, rating, comment ?? null]
  );
  const [rows] = await pool.query(`SELECT * FROM Reviews WHERE review_id = ?`, [result.insertId]);

  await pool.query(
    `INSERT INTO Notifications (user_id, type, message, reference_id)
     VALUES (?, 'review_received', 'Someone left feedback on your collaboration.', ?)`,
    [reviewedId, result.insertId]
  );

  return rows[0];
}

export async function listReviewsForUser(userId) {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar
     FROM Reviews r JOIN Users u ON u.user_id = r.reviewer_id
     WHERE r.reviewed_id = ? ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function averageRatingForUser(userId) {
  const [[row]] = await pool.query(
    `SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS review_count FROM Reviews WHERE reviewed_id = ?`,
    [userId]
  );
  return row;
}
