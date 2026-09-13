import { pool } from '../config/db.js';
import { parseJsonAgg } from '../utils/sqlJson.js';

export async function createStartup(ownerId, fields) {
  const [result] = await pool.query(
    `INSERT INTO Startups (owner_id, name, tagline, description, category, stage, max_team_size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ownerId, fields.name, fields.tagline ?? null, fields.description ?? null, fields.category ?? 'general', fields.stage ?? 'idea', fields.maxTeamSize ?? 5]
  );
  if (fields.requiredSkills?.length) {
    await setRequiredSkills(result.insertId, fields.requiredSkills);
  }
  return getStartupById(result.insertId);
}

export async function getStartupById(startupId) {
  const [rows] = await pool.query(
    `SELECT s.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM StartupMembers sm WHERE sm.startup_id = s.startup_id AND sm.member_status = 'active') AS member_count,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('skill_id', sk.skill_id, 'skill_name', sk.skill_name, 'priority', srs.priority))
           FROM StartupRequiredSkills srs JOIN Skills sk ON sk.skill_id = srs.skill_id WHERE srs.startup_id = s.startup_id) AS required_skills
     FROM Startups s JOIN Users u ON u.user_id = s.owner_id
     WHERE s.startup_id = ? LIMIT 1`,
    [startupId]
  );
  const row = rows[0];
  if (!row) return null;
  return { ...row, required_skills: parseJsonAgg(row.required_skills) };
}

export async function listStartups({ search, category, stage, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(s.name LIKE ? OR s.tagline LIKE ? OR s.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push('s.category = ?');
    params.push(category);
  }
  if (stage) {
    conditions.push('s.stage = ?');
    params.push(stage);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT s.startup_id, s.name, s.tagline, s.category, s.stage, s.status, s.max_team_size, s.created_at,
        u.name AS owner_name, u.user_id AS owner_id,
        (SELECT COUNT(*) FROM StartupMembers sm WHERE sm.startup_id = s.startup_id AND sm.member_status = 'active') AS member_count
     FROM Startups s JOIN Users u ON u.user_id = s.owner_id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Startups s ${whereClause}`,
    params
  );
  return { rows, total };
}

export async function updateStartup(startupId, fields) {
  await pool.query(
    `UPDATE Startups SET name = ?, tagline = ?, description = ?, category = ?, stage = ?, status = ?, max_team_size = ?
     WHERE startup_id = ?`,
    [fields.name, fields.tagline ?? null, fields.description ?? null, fields.category, fields.stage, fields.status, fields.maxTeamSize ?? 5, startupId]
  );
  if (fields.requiredSkills) {
    await setRequiredSkills(startupId, fields.requiredSkills);
  }
  return getStartupById(startupId);
}

export async function deleteStartup(startupId) {
  await pool.query(`DELETE FROM Startups WHERE startup_id = ?`, [startupId]);
}

export async function setRequiredSkills(startupId, requiredSkills) {
  await pool.query(`DELETE FROM StartupRequiredSkills WHERE startup_id = ?`, [startupId]);
  if (!requiredSkills.length) return;
  const values = requiredSkills.map((r) => [startupId, r.skillId, r.priority || 'required']);
  await pool.query(`INSERT INTO StartupRequiredSkills (startup_id, skill_id, priority) VALUES ?`, [values]);
}

export async function listStartupMembers(startupId) {
  const [rows] = await pool.query(
    `SELECT sm.user_id, sm.team_role, sm.joined_at, u.name, u.avatar_url, p.headline
     FROM StartupMembers sm
     JOIN Users u ON u.user_id = sm.user_id
     LEFT JOIN Profiles p ON p.user_id = u.user_id
     WHERE sm.startup_id = ? AND sm.member_status = 'active'
     ORDER BY sm.joined_at ASC`,
    [startupId]
  );
  return rows;
}

export async function addStartupMember(startupId, userId, teamRole = 'Member') {
  await pool.query(
    `INSERT INTO StartupMembers (startup_id, user_id, team_role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE team_role = VALUES(team_role), member_status = 'active'`,
    [startupId, userId, teamRole]
  );
}

export async function updateStartupMemberRole(startupId, userId, teamRole) {
  await pool.query(
    `UPDATE StartupMembers SET team_role = ? WHERE startup_id = ? AND user_id = ?`,
    [teamRole, startupId, userId]
  );
}

export async function removeStartupMember(startupId, userId) {
  await pool.query(`DELETE FROM StartupMembers WHERE startup_id = ? AND user_id = ?`, [startupId, userId]);
}

export async function isStartupOwner(startupId, userId) {
  const [rows] = await pool.query(`SELECT 1 FROM Startups WHERE startup_id = ? AND owner_id = ?`, [startupId, userId]);
  return rows.length > 0;
}

export async function isStartupMember(startupId, userId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM StartupMembers WHERE startup_id = ? AND user_id = ? AND member_status = 'active'`,
    [startupId, userId]
  );
  return rows.length > 0;
}

export async function listStartupsForUser(userId) {
  const [rows] = await pool.query(
    `SELECT s.startup_id, s.name, s.tagline, s.category, s.stage, s.status, sm.team_role
     FROM StartupMembers sm JOIN Startups s ON s.startup_id = sm.startup_id
     WHERE sm.user_id = ? AND sm.member_status = 'active'
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getStartupProgress(startupId) {
  const [rows] = await pool.query(`SELECT * FROM startup_progress WHERE startup_id = ?`, [startupId]);
  return rows[0] || null;
}
