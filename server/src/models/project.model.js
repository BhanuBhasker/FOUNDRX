import { pool } from '../config/db.js';

export async function createProject({ startupId, title, description, status }) {
  const [result] = await pool.query(
    `INSERT INTO Projects (startup_id, title, description, status) VALUES (?, ?, ?, ?)`,
    [startupId, title, description ?? null, status ?? 'planning']
  );
  return getProjectById(result.insertId);
}

export async function getProjectById(projectId) {
  const [rows] = await pool.query(
    `SELECT p.*, s.name AS startup_name, s.owner_id
     FROM Projects p JOIN Startups s ON s.startup_id = p.startup_id
     WHERE p.project_id = ? LIMIT 1`,
    [projectId]
  );
  return rows[0] || null;
}

export async function listProjectsByStartup(startupId) {
  const [rows] = await pool.query(
    `SELECT * FROM Projects WHERE startup_id = ? ORDER BY created_at DESC`,
    [startupId]
  );
  return rows;
}

export async function updateProject(projectId, { title, description, status }) {
  await pool.query(
    `UPDATE Projects SET title = ?, description = ?, status = ? WHERE project_id = ?`,
    [title, description ?? null, status, projectId]
  );
  return getProjectById(projectId);
}

export async function deleteProject(projectId) {
  await pool.query(`DELETE FROM Projects WHERE project_id = ?`, [projectId]);
}

export async function listProjectMembers(projectId) {
  const [rows] = await pool.query(
    `SELECT pm.user_id, pm.project_role, u.name, u.avatar_url
     FROM ProjectMembers pm JOIN Users u ON u.user_id = pm.user_id
     WHERE pm.project_id = ?`,
    [projectId]
  );
  return rows;
}

export async function addProjectMember(projectId, userId, projectRole = 'Contributor') {
  await pool.query(
    `INSERT INTO ProjectMembers (project_id, user_id, project_role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE project_role = VALUES(project_role)`,
    [projectId, userId, projectRole]
  );
}

export async function removeProjectMember(projectId, userId) {
  await pool.query(`DELETE FROM ProjectMembers WHERE project_id = ? AND user_id = ?`, [projectId, userId]);
}
