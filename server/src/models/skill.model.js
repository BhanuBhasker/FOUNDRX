import { pool } from '../config/db.js';

export async function listSkills() {
  const [rows] = await pool.query(`SELECT skill_id, skill_name, category FROM Skills ORDER BY skill_name`);
  return rows;
}

export async function listInterests() {
  const [rows] = await pool.query(`SELECT interest_id, interest_name FROM Interests ORDER BY interest_name`);
  return rows;
}

export async function skillPopularity() {
  const [rows] = await pool.query(`SELECT * FROM skill_popularity`);
  return rows;
}

export async function createSkill(skillName, category = 'general') {
  const [result] = await pool.query(
    `INSERT INTO Skills (skill_name, category) VALUES (?, ?)`,
    [skillName, category]
  );
  return { skill_id: result.insertId, skill_name: skillName, category };
}

export async function deleteSkill(skillId) {
  await pool.query(`DELETE FROM Skills WHERE skill_id = ?`, [skillId]);
}
