import { pool } from '../config/db.js';
import { parseJsonAgg } from '../utils/sqlJson.js';

export async function getFullProfile(userId) {
  const [rows] = await pool.query(`SELECT * FROM user_full_profiles WHERE user_id = ? LIMIT 1`, [userId]);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    skills: parseJsonAgg(row.skills),
    interests: parseJsonAgg(row.interests),
  };
}

export async function upsertProfile(userId, fields) {
  const [existing] = await pool.query(`SELECT profile_id FROM Profiles WHERE user_id = ?`, [userId]);

  const values = [
    fields.headline ?? null,
    fields.bio ?? null,
    fields.primaryRole ?? 'other',
    fields.experienceLevel ?? 'beginner',
    fields.availabilityHours ?? 'not_available',
    fields.startupGoal ?? 'explore_ideas',
    fields.profileVisibility ?? 'public',
    fields.location ?? null,
    fields.linkedinUrl ?? null,
    fields.githubUrl ?? null,
  ];

  if (existing.length === 0) {
    await pool.query(
      `INSERT INTO Profiles
        (user_id, headline, bio, primary_role, experience_level, availability_hours, startup_goal, profile_visibility, location, linkedin_url, github_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, ...values]
    );
  } else {
    await pool.query(
      `UPDATE Profiles SET
        headline = ?, bio = ?, primary_role = ?, experience_level = ?, availability_hours = ?,
        startup_goal = ?, profile_visibility = ?, location = ?, linkedin_url = ?, github_url = ?
       WHERE user_id = ?`,
      [...values, userId]
    );
  }
  return getFullProfile(userId);
}

export async function setUserSkills(userId, skillIds) {
  await pool.query(`DELETE FROM UserSkills WHERE user_id = ?`, [userId]);
  if (skillIds.length === 0) return;
  const values = skillIds.map((skillId) => [userId, skillId, 'intermediate']);
  await pool.query(`INSERT INTO UserSkills (user_id, skill_id, proficiency_level) VALUES ?`, [values]);
}

export async function setUserInterests(userId, interestIds) {
  await pool.query(`DELETE FROM UserInterests WHERE user_id = ?`, [userId]);
  if (interestIds.length === 0) return;
  const values = interestIds.map((interestId) => [userId, interestId]);
  await pool.query(`INSERT INTO UserInterests (user_id, interest_id) VALUES ?`, [values]);
}

export async function saveProfile(userId, savedUserId) {
  await pool.query(
    `INSERT IGNORE INTO SavedProfiles (user_id, saved_user_id) VALUES (?, ?)`,
    [userId, savedUserId]
  );
}

export async function unsaveProfile(userId, savedUserId) {
  await pool.query(`DELETE FROM SavedProfiles WHERE user_id = ? AND saved_user_id = ?`, [userId, savedUserId]);
}

export async function listSavedProfiles(userId) {
  const [rows] = await pool.query(
    `SELECT sp.saved_user_id AS user_id, sp.created_at AS saved_at, u.name, u.avatar_url, p.headline, p.primary_role
     FROM SavedProfiles sp
     JOIN Users u ON u.user_id = sp.saved_user_id
     LEFT JOIN Profiles p ON p.user_id = u.user_id
     WHERE sp.user_id = ?
     ORDER BY sp.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function isProfileSaved(userId, savedUserId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM SavedProfiles WHERE user_id = ? AND saved_user_id = ? LIMIT 1`,
    [userId, savedUserId]
  );
  return rows.length > 0;
}
