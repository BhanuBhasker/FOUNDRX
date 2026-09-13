import { pool } from '../config/db.js';
import { parseJsonAgg } from '../utils/sqlJson.js';

/**
 * Search/filter/sort candidate builder profiles.
 * Skills/interests are aggregated as JSON arrays per user so the caller
 * can compute a transparent compatibility score against the current user.
 */
export async function searchBuilders({
  excludeUserId,
  search,
  primaryRole,
  availabilityHours,
  startupGoal,
  skillIds,
  interestIds,
  sortBy,
  limit,
  offset,
}) {
  const conditions = ['u.status = "active"', 'p.profile_id IS NOT NULL', "p.profile_visibility = 'public'"];
  const params = [];

  if (excludeUserId) {
    conditions.push('u.user_id <> ?');
    params.push(excludeUserId);
  }
  if (search) {
    conditions.push('(u.name LIKE ? OR p.headline LIKE ? OR p.primary_role LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (primaryRole) {
    conditions.push('p.primary_role = ?');
    params.push(primaryRole);
  }
  if (availabilityHours) {
    conditions.push('p.availability_hours = ?');
    params.push(availabilityHours);
  }
  if (startupGoal) {
    conditions.push('p.startup_goal = ?');
    params.push(startupGoal);
  }
  if (skillIds?.length) {
    conditions.push(
      `u.user_id IN (SELECT user_id FROM UserSkills WHERE skill_id IN (${skillIds.map(() => '?').join(',')}))`
    );
    params.push(...skillIds);
  }
  if (interestIds?.length) {
    conditions.push(
      `u.user_id IN (SELECT user_id FROM UserInterests WHERE interest_id IN (${interestIds.map(() => '?').join(',')}))`
    );
    params.push(...interestIds);
  }

  const orderByMap = {
    experience: `FIELD(p.experience_level, 'expert', 'advanced', 'intermediate', 'beginner')`,
    newest: 'u.created_at DESC',
    name: 'u.name ASC',
  };
  const orderBy = orderByMap[sortBy] || 'u.created_at DESC';

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT
        u.user_id, u.name, u.avatar_url,
        p.headline, p.primary_role, p.experience_level, p.availability_hours, p.startup_goal, p.location,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('skill_id', sk.skill_id, 'skill_name', sk.skill_name, 'category', sk.category))
           FROM UserSkills us JOIN Skills sk ON sk.skill_id = us.skill_id WHERE us.user_id = u.user_id) AS skills,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('interest_id', it.interest_id, 'interest_name', it.interest_name))
           FROM UserInterests ui JOIN Interests it ON it.interest_id = ui.interest_id WHERE ui.user_id = u.user_id) AS interests
     FROM Users u
     JOIN Profiles p ON p.user_id = u.user_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Users u JOIN Profiles p ON p.user_id = u.user_id ${whereClause}`,
    params
  );

  const parsed = rows.map((row) => ({
    ...row,
    skills: parseJsonAgg(row.skills),
    interests: parseJsonAgg(row.interests),
  }));

  return { rows: parsed, total };
}

export async function getCurrentUserMatchProfile(userId) {
  const [rows] = await pool.query(
    `SELECT
        p.primary_role, p.experience_level, p.availability_hours, p.startup_goal,
        (SELECT JSON_ARRAYAGG(skill_id) FROM UserSkills WHERE user_id = ?) AS skill_ids,
        (SELECT JSON_ARRAYAGG(sk.category) FROM UserSkills us JOIN Skills sk ON sk.skill_id = us.skill_id WHERE us.user_id = ?) AS skill_categories,
        (SELECT JSON_ARRAYAGG(interest_id) FROM UserInterests WHERE user_id = ?) AS interest_ids
     FROM Profiles p WHERE p.user_id = ? LIMIT 1`,
    [userId, userId, userId, userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    primary_role: row.primary_role,
    experience_level: row.experience_level,
    availability_hours: row.availability_hours,
    startup_goal: row.startup_goal,
    skill_ids: parseJsonAgg(row.skill_ids),
    skill_categories: parseJsonAgg(row.skill_categories),
    interest_ids: parseJsonAgg(row.interest_ids),
  };
}

/**
 * Search/filter/sort active startup opportunities — the second half of
 * FOUNDRX's "Dual Discovery" differentiator.
 */
export async function searchStartupOpportunities({ search, category, stage, skillIds, hasOpenSeats, limit, offset }) {
  const conditions = ["s.status = 'active'"];
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
  if (skillIds?.length) {
    conditions.push(
      `s.startup_id IN (SELECT startup_id FROM StartupRequiredSkills WHERE skill_id IN (${skillIds.map(() => '?').join(',')}))`
    );
    params.push(...skillIds);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const havingClause = hasOpenSeats ? 'HAVING current_team_size < s.max_team_size' : '';

  const [rows] = await pool.query(
    `SELECT
        s.startup_id, s.name, s.tagline, s.description, s.category, s.stage, s.max_team_size, s.created_at,
        u.name AS owner_name, u.user_id AS owner_id,
        (SELECT COUNT(*) FROM StartupMembers sm WHERE sm.startup_id = s.startup_id AND sm.member_status = 'active') AS current_team_size,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('skill_id', sk.skill_id, 'skill_name', sk.skill_name, 'priority', srs.priority))
           FROM StartupRequiredSkills srs JOIN Skills sk ON sk.skill_id = srs.skill_id WHERE srs.startup_id = s.startup_id) AS required_skills
     FROM Startups s
     JOIN Users u ON u.user_id = s.owner_id
     ${whereClause}
     ${havingClause}
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM (
       SELECT s.startup_id,
         (SELECT COUNT(*) FROM StartupMembers sm WHERE sm.startup_id = s.startup_id AND sm.member_status = 'active') AS current_team_size
       FROM Startups s
       ${whereClause}
       ${havingClause}
     ) AS counted`,
    params
  );

  const parsed = rows.map((row) => ({
    ...row,
    required_skills: parseJsonAgg(row.required_skills),
  }));

  return { rows: parsed, total: countRows[0].total };
}
