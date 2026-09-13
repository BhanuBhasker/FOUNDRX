import { pool } from '../config/db.js';

export async function personalDashboardStats(userId) {
  const [[applicationStats]] = await pool.query(
    `SELECT
        SUM(CASE WHEN receiver_id = ? THEN 1 ELSE 0 END) AS received,
        SUM(CASE WHEN sender_id = ? THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN receiver_id = ? AND status = 'pending' THEN 1 ELSE 0 END) AS pending_received,
        SUM(CASE WHEN status = 'accepted' AND (sender_id = ? OR receiver_id = ?) THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN (sender_id = ? OR receiver_id = ?) AND compatibility_score >= 70 THEN 1 ELSE 0 END) AS high_compatibility_count
     FROM Applications WHERE sender_id = ? OR receiver_id = ?`,
    [userId, userId, userId, userId, userId, userId, userId, userId, userId]
  );
  const [[startupCount]] = await pool.query(
    `SELECT COUNT(*) AS total FROM StartupMembers WHERE user_id = ? AND member_status = 'active'`,
    [userId]
  );
  const [[profileRow]] = await pool.query(
    `SELECT profile_completion FROM Profiles WHERE user_id = ?`,
    [userId]
  );
  return {
    applications: applicationStats,
    startupsJoined: startupCount.total,
    profileCompletion: profileRow?.profile_completion ?? 0,
  };
}

/** Per-user analytics for GET /api/dashboard/analytics (Blueprint §5, page 15). */
export async function personalApplicationStatusBreakdown(userId) {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS count FROM Applications WHERE sender_id = ? OR receiver_id = ? GROUP BY status`,
    [userId, userId]
  );
  return rows;
}

export async function personalCompatibilityStats(userId) {
  const [[row]] = await pool.query(
    `SELECT ROUND(AVG(compatibility_score), 2) AS avg_compatibility,
            MAX(compatibility_score) AS best_match,
            COUNT(*) AS total
     FROM Applications WHERE sender_id = ? OR receiver_id = ?`,
    [userId, userId]
  );
  return row;
}

/** Milestones completed over time, across every startup the user belongs to. */
export async function startupActivityOverTime(userId, days = 30) {
  const [rows] = await pool.query(
    `SELECT DATE(m.completed_at) AS day, COUNT(*) AS count
     FROM Milestones m
     JOIN Projects p ON p.project_id = m.project_id
     JOIN StartupMembers sm ON sm.startup_id = p.startup_id AND sm.user_id = ?
     WHERE m.completed_at IS NOT NULL AND m.completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(m.completed_at)
     ORDER BY day ASC`,
    [userId, days]
  );
  return rows;
}

export async function platformOverview() {
  const [[users]] = await pool.query(`SELECT COUNT(*) AS total FROM Users`);
  const [[startups]] = await pool.query(`SELECT COUNT(*) AS total FROM Startups WHERE status = 'active'`);
  const [[applications]] = await pool.query(`SELECT COUNT(*) AS total FROM Applications`);
  const [[projects]] = await pool.query(`SELECT COUNT(*) AS total FROM Projects`);
  return {
    totalUsers: users.total,
    activeStartups: startups.total,
    totalApplications: applications.total,
    totalProjects: projects.total,
  };
}

export async function topSkills(limit = 10) {
  const [rows] = await pool.query(`SELECT * FROM skill_popularity LIMIT ?`, [limit]);
  return rows;
}

export async function applicationStatusBreakdown() {
  const [rows] = await pool.query(`SELECT status, COUNT(*) AS count FROM Applications GROUP BY status`);
  return rows;
}

export async function startupsByCategory() {
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) AS count FROM Startups WHERE status = 'active' GROUP BY category HAVING COUNT(*) > 0 ORDER BY count DESC`
  );
  return rows;
}

export async function signupsOverTime(days = 30) {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS count
     FROM Users
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [days]
  );
  return rows;
}
