-- =====================================================================
-- FOUNDRX — Views
-- =====================================================================
USE foundrx;

-- Active startups currently looking for members (Dual Discovery: startup
-- opportunities side). "Looking for members" = active status and current
-- team below its max_team_size.
CREATE OR REPLACE VIEW active_startup_opportunities AS
SELECT
  s.startup_id, s.name, s.tagline, s.description, s.category, s.stage, s.status,
  s.max_team_size,
  u.name AS owner_name, u.user_id AS owner_id,
  (SELECT COUNT(*) FROM StartupMembers sm WHERE sm.startup_id = s.startup_id AND sm.member_status = 'active') AS current_team_size,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('skill_id', sk.skill_id, 'skill_name', sk.skill_name, 'priority', srs.priority))
    FROM StartupRequiredSkills srs JOIN Skills sk ON sk.skill_id = srs.skill_id
    WHERE srs.startup_id = s.startup_id
  ) AS required_skills,
  s.created_at
FROM Startups s
JOIN Users u ON u.user_id = s.owner_id
WHERE s.status = 'active';

-- Full builder profile view: user + profile + aggregated skills/interests
CREATE OR REPLACE VIEW user_full_profiles AS
SELECT
  u.user_id, u.name, u.email, u.avatar_url, u.user_role AS account_role, u.status,
  p.profile_id, p.headline, p.bio, p.primary_role, p.experience_level, p.availability_hours,
  p.startup_goal, p.profile_visibility, p.location, p.linkedin_url, p.github_url, p.profile_completion,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('skill_id', sk.skill_id, 'skill_name', sk.skill_name, 'category', sk.category, 'proficiency_level', us.proficiency_level))
    FROM UserSkills us JOIN Skills sk ON sk.skill_id = us.skill_id
    WHERE us.user_id = u.user_id
  ) AS skills,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('interest_id', it.interest_id, 'interest_name', it.interest_name))
    FROM UserInterests ui JOIN Interests it ON it.interest_id = ui.interest_id
    WHERE ui.user_id = u.user_id
  ) AS interests
FROM Users u
LEFT JOIN Profiles p ON p.user_id = u.user_id;

-- Skill popularity analytics
CREATE OR REPLACE VIEW skill_popularity AS
SELECT sk.skill_id, sk.skill_name, sk.category, COUNT(us.user_id) AS user_count
FROM Skills sk
LEFT JOIN UserSkills us ON us.skill_id = sk.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
ORDER BY user_count DESC;

-- Application funnel statistics per user (as receiver)
CREATE OR REPLACE VIEW application_stats_by_user AS
SELECT
  receiver_id AS user_id,
  COUNT(*) AS total_received,
  SUM(status = 'pending')   AS pending_count,
  SUM(status = 'accepted')  AS accepted_count,
  SUM(status = 'rejected')  AS rejected_count,
  ROUND(AVG(compatibility_score), 2) AS avg_compatibility
FROM Applications
GROUP BY receiver_id;

-- Startup progress: milestone completion rollup
CREATE OR REPLACE VIEW startup_progress AS
SELECT
  s.startup_id, s.name,
  COUNT(m.milestone_id) AS total_milestones,
  SUM(m.status = 'completed') AS completed_milestones,
  CASE WHEN COUNT(m.milestone_id) = 0 THEN 0
       ELSE ROUND(SUM(m.status = 'completed') / COUNT(m.milestone_id) * 100, 1)
  END AS completion_pct
FROM Startups s
LEFT JOIN Projects pr ON pr.startup_id = s.startup_id
LEFT JOIN Milestones m ON m.project_id = pr.project_id
GROUP BY s.startup_id, s.name;
