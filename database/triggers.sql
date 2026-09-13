-- =====================================================================
-- FOUNDRX — Triggers
-- =====================================================================
USE foundrx;

DELIMITER $$

-- Profiles cannot UPDATE its own table from within a trigger it fired
-- (MySQL forbids that, even indirectly through a stored procedure), so
-- these use BEFORE triggers that set NEW.profile_completion directly —
-- using the same scoring rules as fn_calculate_profile_completion, just
-- inlined against NEW.* instead of a fresh SELECT of the row being written.
DROP TRIGGER IF EXISTS trg_profiles_before_insert $$
CREATE TRIGGER trg_profiles_before_insert
BEFORE INSERT ON Profiles
FOR EACH ROW
BEGIN
  DECLARE v_skill_count INT DEFAULT 0;
  DECLARE v_interest_count INT DEFAULT 0;
  DECLARE v_score INT DEFAULT 0;

  SELECT COUNT(*) INTO v_skill_count FROM UserSkills WHERE user_id = NEW.user_id;
  SELECT COUNT(*) INTO v_interest_count FROM UserInterests WHERE user_id = NEW.user_id;

  IF NEW.headline IS NOT NULL AND NEW.headline <> '' THEN SET v_score = v_score + 15; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio <> '' THEN SET v_score = v_score + 15; END IF;
  IF NEW.location IS NOT NULL AND NEW.location <> '' THEN SET v_score = v_score + 10; END IF;
  IF NEW.primary_role <> 'other' THEN SET v_score = v_score + 10; END IF;
  IF NEW.startup_goal IS NOT NULL THEN SET v_score = v_score + 10; END IF;
  SET v_score = v_score + LEAST(v_skill_count * 10, 25);
  SET v_score = v_score + LEAST(v_interest_count * 5, 15);

  SET NEW.profile_completion = LEAST(v_score, 100);
END $$

DROP TRIGGER IF EXISTS trg_profiles_before_update $$
CREATE TRIGGER trg_profiles_before_update
BEFORE UPDATE ON Profiles
FOR EACH ROW
BEGIN
  DECLARE v_skill_count INT DEFAULT 0;
  DECLARE v_interest_count INT DEFAULT 0;
  DECLARE v_score INT DEFAULT 0;

  SELECT COUNT(*) INTO v_skill_count FROM UserSkills WHERE user_id = NEW.user_id;
  SELECT COUNT(*) INTO v_interest_count FROM UserInterests WHERE user_id = NEW.user_id;

  IF NEW.headline IS NOT NULL AND NEW.headline <> '' THEN SET v_score = v_score + 15; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio <> '' THEN SET v_score = v_score + 15; END IF;
  IF NEW.location IS NOT NULL AND NEW.location <> '' THEN SET v_score = v_score + 10; END IF;
  IF NEW.primary_role <> 'other' THEN SET v_score = v_score + 10; END IF;
  IF NEW.startup_goal IS NOT NULL THEN SET v_score = v_score + 10; END IF;
  SET v_score = v_score + LEAST(v_skill_count * 10, 25);
  SET v_score = v_score + LEAST(v_interest_count * 5, 15);

  SET NEW.profile_completion = LEAST(v_score, 100);
END $$

-- Recalculate completion when a skill is added/removed.
DROP TRIGGER IF EXISTS trg_userskills_after_insert $$
CREATE TRIGGER trg_userskills_after_insert
AFTER INSERT ON UserSkills
FOR EACH ROW
BEGIN
  CALL sp_recalculate_profile_completion(NEW.user_id);
END $$

DROP TRIGGER IF EXISTS trg_userskills_after_delete $$
CREATE TRIGGER trg_userskills_after_delete
AFTER DELETE ON UserSkills
FOR EACH ROW
BEGIN
  CALL sp_recalculate_profile_completion(OLD.user_id);
END $$

-- Recalculate completion when an interest is added/removed.
DROP TRIGGER IF EXISTS trg_userinterests_after_insert $$
CREATE TRIGGER trg_userinterests_after_insert
AFTER INSERT ON UserInterests
FOR EACH ROW
BEGIN
  CALL sp_recalculate_profile_completion(NEW.user_id);
END $$

DROP TRIGGER IF EXISTS trg_userinterests_after_delete $$
CREATE TRIGGER trg_userinterests_after_delete
AFTER DELETE ON UserInterests
FOR EACH ROW
BEGIN
  CALL sp_recalculate_profile_completion(OLD.user_id);
END $$

-- Notify a user whenever a new application (request/apply/invite) is
-- created for them.
DROP TRIGGER IF EXISTS trg_applications_after_insert $$
CREATE TRIGGER trg_applications_after_insert
AFTER INSERT ON Applications
FOR EACH ROW
BEGIN
  INSERT INTO Notifications (user_id, type, message, reference_id)
  VALUES (
    NEW.receiver_id,
    CASE WHEN NEW.type = 'team_invitation' THEN 'team_invitation' ELSE 'application_received' END,
    CASE
      WHEN NEW.type = 'cofounder_request' THEN 'You have received a new co-founder request.'
      WHEN NEW.type = 'startup_application' THEN 'Someone applied to join your startup.'
      ELSE 'You have been invited to join a startup team.'
    END,
    NEW.application_id
  );
END $$

-- Per Blueprint §10.5: when an application's status changes, automatically
-- create a notification for rejections. (Acceptances are notified inside
-- sp_accept_application itself, as part of the same transaction, since
-- accepting also needs to know which user to add to the startup team —
-- information this row-level trigger doesn't have.)
DROP TRIGGER IF EXISTS trg_applications_after_update $$
CREATE TRIGGER trg_applications_after_update
AFTER UPDATE ON Applications
FOR EACH ROW
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    INSERT INTO Notifications (user_id, type, message, reference_id)
    VALUES (NEW.sender_id, 'application_rejected', 'A request you sent was declined.', NEW.application_id);
  END IF;
END $$

-- Automatically add a startup's owner as its first team member (Founder).
DROP TRIGGER IF EXISTS trg_startups_after_insert $$
CREATE TRIGGER trg_startups_after_insert
AFTER INSERT ON Startups
FOR EACH ROW
BEGIN
  INSERT INTO StartupMembers (startup_id, user_id, team_role)
  VALUES (NEW.startup_id, NEW.owner_id, 'Founder');
END $$

-- Stamp completed_at when a milestone is created already-completed.
DROP TRIGGER IF EXISTS trg_milestones_before_insert $$
CREATE TRIGGER trg_milestones_before_insert
BEFORE INSERT ON Milestones
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' THEN
    SET NEW.completed_at = NOW();
  END IF;
END $$

-- Stamp completed_at the moment a milestone is marked completed.
DROP TRIGGER IF EXISTS trg_milestones_before_update $$
CREATE TRIGGER trg_milestones_before_update
BEFORE UPDATE ON Milestones
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    SET NEW.completed_at = NOW();
  ELSEIF NEW.status <> 'completed' THEN
    SET NEW.completed_at = NULL;
  END IF;
END $$

DELIMITER ;
