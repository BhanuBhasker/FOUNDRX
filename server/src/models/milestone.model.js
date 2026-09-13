import { pool } from '../config/db.js';

export async function createMilestone({ projectId, title, description, dueDate, status }) {
  const [result] = await pool.query(
    `INSERT INTO Milestones (project_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)`,
    [projectId, title, description ?? null, dueDate ?? null, status ?? 'not_started']
  );
  return getMilestoneById(result.insertId);
}

export async function getMilestoneById(milestoneId) {
  const [rows] = await pool.query(
    `SELECT m.*, p.startup_id, p.title AS project_title
     FROM Milestones m JOIN Projects p ON p.project_id = m.project_id
     WHERE m.milestone_id = ? LIMIT 1`,
    [milestoneId]
  );
  return rows[0] || null;
}

export async function listMilestonesByProject(projectId) {
  const [rows] = await pool.query(
    `SELECT * FROM Milestones WHERE project_id = ? ORDER BY due_date IS NULL, due_date ASC`,
    [projectId]
  );
  return rows;
}

export async function updateMilestone(milestoneId, { title, description, dueDate, status }) {
  await pool.query(
    `UPDATE Milestones SET title = ?, description = ?, due_date = ?, status = ? WHERE milestone_id = ?`,
    [title, description ?? null, dueDate ?? null, status, milestoneId]
  );
  return getMilestoneById(milestoneId);
}

export async function deleteMilestone(milestoneId) {
  await pool.query(`DELETE FROM Milestones WHERE milestone_id = ?`, [milestoneId]);
}
