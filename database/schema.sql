-- =====================================================================
-- FOUNDRX — Relational Schema (MySQL 8+)
-- Aligned with the Final Project Blueprint v1.0.
-- Normalized to 3NF. Junction tables handle every many-to-many mapping.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS foundrx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foundrx;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS SavedProfiles;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Milestones;
DROP TABLE IF EXISTS ProjectMembers;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS Applications;
DROP TABLE IF EXISTS StartupRequiredSkills;
DROP TABLE IF EXISTS StartupMembers;
DROP TABLE IF EXISTS Startups;
DROP TABLE IF EXISTS UserInterests;
DROP TABLE IF EXISTS Interests;
DROP TABLE IF EXISTS UserSkills;
DROP TABLE IF EXISTS Skills;
DROP TABLE IF EXISTS Profiles;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Users : authentication and account information (DB auth + Google OAuth)
-- ---------------------------------------------------------------------
CREATE TABLE Users (
  user_id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(120)  NOT NULL,
  email              VARCHAR(190)  NOT NULL,
  password_hash      VARCHAR(255)  NULL,                 -- NULL for Google-only accounts
  auth_provider      ENUM('local','google') NOT NULL DEFAULT 'local',
  google_id          VARCHAR(190)  NULL,
  avatar_url         VARCHAR(500)  NULL,
  user_role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  status             ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_google_id UNIQUE (google_id),
  CONSTRAINT chk_users_auth CHECK (
    (auth_provider = 'local' AND password_hash IS NOT NULL) OR
    (auth_provider = 'google' AND google_id IS NOT NULL)
  )
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Profiles : extended, one-to-one professional profile
-- ---------------------------------------------------------------------
CREATE TABLE Profiles (
  profile_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            INT UNSIGNED NOT NULL,
  bio                TEXT NULL,
  primary_role       ENUM('developer','designer','business','marketing','product','other') NOT NULL DEFAULT 'other',
  experience_level   ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'beginner',
  availability_hours ENUM('full_time','part_time','weekends','not_available') NOT NULL DEFAULT 'not_available',
  startup_goal       ENUM('find_cofounder','join_startup','build_projects','explore_ideas') NOT NULL DEFAULT 'explore_ideas',
  profile_visibility ENUM('public','private') NOT NULL DEFAULT 'public',
  location           VARCHAR(120) NULL,
  headline           VARCHAR(160) NULL,
  linkedin_url       VARCHAR(300) NULL,
  github_url         VARCHAR(300) NULL,
  profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_profiles_user UNIQUE (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3/4. Skills master list + Users M:M Skills
-- ---------------------------------------------------------------------
CREATE TABLE Skills (
  skill_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  skill_name         VARCHAR(80) NOT NULL,
  category           VARCHAR(60) NOT NULL DEFAULT 'general',
  CONSTRAINT uq_skills_name UNIQUE (skill_name)
) ENGINE=InnoDB;

CREATE TABLE UserSkills (
  user_id            INT UNSIGNED NOT NULL,
  skill_id           INT UNSIGNED NOT NULL,
  proficiency_level  ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_userskills_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_userskills_skill FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5/6. Interests master list + Users M:M Interests
-- ---------------------------------------------------------------------
CREATE TABLE Interests (
  interest_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  interest_name      VARCHAR(80) NOT NULL,
  CONSTRAINT uq_interests_name UNIQUE (interest_name)
) ENGINE=InnoDB;

CREATE TABLE UserInterests (
  user_id            INT UNSIGNED NOT NULL,
  interest_id        INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  CONSTRAINT fk_userinterests_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_userinterests_interest FOREIGN KEY (interest_id) REFERENCES Interests(interest_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7/8. Startups (1 owner : M startups) + StartupMembers (M:M with role)
-- ---------------------------------------------------------------------
CREATE TABLE Startups (
  startup_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id           INT UNSIGNED NOT NULL,
  name               VARCHAR(140) NOT NULL,
  tagline            VARCHAR(200) NULL,
  description        TEXT NULL,
  category           VARCHAR(80) NOT NULL DEFAULT 'general',
  stage              ENUM('idea','validating','building','active','paused') NOT NULL DEFAULT 'idea',
  status             ENUM('active','paused','closed') NOT NULL DEFAULT 'active',
  max_team_size      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_startups_owner FOREIGN KEY (owner_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_startups_team_size CHECK (max_team_size BETWEEN 1 AND 50)
) ENGINE=InnoDB;

CREATE TABLE StartupMembers (
  startup_id         INT UNSIGNED NOT NULL,
  user_id            INT UNSIGNED NOT NULL,
  team_role          VARCHAR(80) NOT NULL DEFAULT 'Member',
  member_status      ENUM('active','removed') NOT NULL DEFAULT 'active',
  joined_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (startup_id, user_id),
  CONSTRAINT fk_startupmembers_startup FOREIGN KEY (startup_id) REFERENCES Startups(startup_id) ON DELETE CASCADE,
  CONSTRAINT fk_startupmembers_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. StartupRequiredSkills : Startups M:M Skills, with priority
-- ---------------------------------------------------------------------
CREATE TABLE StartupRequiredSkills (
  startup_id         INT UNSIGNED NOT NULL,
  skill_id           INT UNSIGNED NOT NULL,
  priority           ENUM('required','nice_to_have') NOT NULL DEFAULT 'required',
  PRIMARY KEY (startup_id, skill_id),
  CONSTRAINT fk_startupreqskills_startup FOREIGN KEY (startup_id) REFERENCES Startups(startup_id) ON DELETE CASCADE,
  CONSTRAINT fk_startupreqskills_skill FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. Applications : collaboration requests + startup applications + invites
-- ---------------------------------------------------------------------
CREATE TABLE Applications (
  application_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type               ENUM('cofounder_request','startup_application','team_invitation') NOT NULL DEFAULT 'cofounder_request',
  sender_id          INT UNSIGNED NOT NULL,
  receiver_id        INT UNSIGNED NOT NULL,
  startup_id         INT UNSIGNED NULL,   -- required for startup_application / team_invitation
  message            VARCHAR(600) NULL,
  compatibility_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status             ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_sender FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_receiver FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_startup FOREIGN KEY (startup_id) REFERENCES Startups(startup_id) ON DELETE CASCADE,
  CONSTRAINT chk_applications_not_self CHECK (sender_id <> receiver_id),
  CONSTRAINT chk_applications_startup_required CHECK (
    (type = 'cofounder_request') OR (startup_id IS NOT NULL)
  )
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. Projects (1 startup : M projects) + ProjectMembers (M:M)
-- ---------------------------------------------------------------------
CREATE TABLE Projects (
  project_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  startup_id         INT UNSIGNED NOT NULL,
  title              VARCHAR(140) NOT NULL,
  description        TEXT NULL,
  status             ENUM('planning','in_progress','on_hold','completed') NOT NULL DEFAULT 'planning',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_startup FOREIGN KEY (startup_id) REFERENCES Startups(startup_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ProjectMembers (
  project_id         INT UNSIGNED NOT NULL,
  user_id            INT UNSIGNED NOT NULL,
  project_role       VARCHAR(80) NOT NULL DEFAULT 'Contributor',
  PRIMARY KEY (project_id, user_id),
  CONSTRAINT fk_projectmembers_project FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE,
  CONSTRAINT fk_projectmembers_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. Milestones (1 project : M milestones)
-- ---------------------------------------------------------------------
CREATE TABLE Milestones (
  milestone_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id         INT UNSIGNED NOT NULL,
  title              VARCHAR(160) NOT NULL,
  description        TEXT NULL,
  due_date           DATE NULL,
  status             ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  completed_at       TIMESTAMP NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Reviews : post-collaboration feedback (kept as a bonus beyond blueprint
-- v1.0 scope — listed there under "Future Version", left in since it was
-- already built and doesn't conflict with anything in the must-have list)
-- ---------------------------------------------------------------------
CREATE TABLE Reviews (
  review_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reviewer_id        INT UNSIGNED NOT NULL,
  reviewed_id        INT UNSIGNED NOT NULL,
  startup_id         INT UNSIGNED NULL,
  rating             TINYINT UNSIGNED NOT NULL,
  comment            VARCHAR(600) NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewed FOREIGN KEY (reviewed_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_startup FOREIGN KEY (startup_id) REFERENCES Startups(startup_id) ON DELETE SET NULL,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_reviews_not_self CHECK (reviewer_id <> reviewed_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. Notifications
-- ---------------------------------------------------------------------
CREATE TABLE Notifications (
  notification_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            INT UNSIGNED NOT NULL,
  type               ENUM('application_received','application_accepted','application_rejected',
                           'team_invitation','milestone_due','review_received','system') NOT NULL DEFAULT 'system',
  message            VARCHAR(400) NOT NULL,
  reference_id       INT UNSIGNED NULL,
  is_read            TINYINT(1) NOT NULL DEFAULT 0,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. SavedProfiles (optional) : a user bookmarking a builder profile
-- ---------------------------------------------------------------------
CREATE TABLE SavedProfiles (
  user_id            INT UNSIGNED NOT NULL,
  saved_user_id      INT UNSIGNED NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, saved_user_id),
  CONSTRAINT fk_savedprofiles_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_savedprofiles_saved FOREIGN KEY (saved_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_savedprofiles_not_self CHECK (user_id <> saved_user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Indexes (per blueprint §10.2, plus the platform's other hot paths)
-- ---------------------------------------------------------------------
CREATE INDEX idx_profiles_primary_role      ON Profiles(primary_role);
CREATE INDEX idx_skills_skill_name          ON Skills(skill_name);
CREATE INDEX idx_applications_status        ON Applications(status);
CREATE INDEX idx_startups_category          ON Startups(category);

CREATE INDEX idx_userskills_skill           ON UserSkills(skill_id);
CREATE INDEX idx_userinterests_interest     ON UserInterests(interest_id);
CREATE INDEX idx_applications_receiver      ON Applications(receiver_id, status);
CREATE INDEX idx_applications_sender        ON Applications(sender_id, status);
CREATE INDEX idx_startupmembers_user        ON StartupMembers(user_id);
CREATE INDEX idx_startupreqskills_skill     ON StartupRequiredSkills(skill_id);
CREATE INDEX idx_notifications_user_read    ON Notifications(user_id, is_read);
CREATE INDEX idx_startups_stage_status      ON Startups(stage, status);
