-- =====================================================================
-- FOUNDRX — Stored Procedures, Functions & Transaction Workflows
-- =====================================================================
USE foundrx;

DELIMITER $$

-- ---------------------------------------------------------------------
-- FUNCTION: fn_skill_overlap_pct — a simple, explainable overlap measure
-- between two users' skill sets (0-100). This is the "database function"
-- demonstration; the platform's real, weighted compatibility score is
-- computed in application code (see server/src/services/compatibility.service.js)
-- so it can be unit-tested and explained without SQL round-trips.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_skill_overlap_pct $$
CREATE FUNCTION fn_skill_overlap_pct(p_user_a INT UNSIGNED, p_user_b INT UNSIGNED)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_intersection INT DEFAULT 0;
  DECLARE v_union INT DEFAULT 0;
  DECLARE v_result DECIMAL(5,2) DEFAULT 0;

  SELECT COUNT(*) INTO v_intersection
  FROM UserSkills a
  JOIN UserSkills b ON a.skill_id = b.skill_id AND b.user_id = p_user_b
  WHERE a.user_id = p_user_a;

  SELECT COUNT(DISTINCT skill_id) INTO v_union
  FROM UserSkills
  WHERE user_id IN (p_user_a, p_user_b);

  IF v_union = 0 THEN
    SET v_result = 0;
  ELSE
    SET v_result = (v_intersection / v_union) * 100;
  END IF;

  RETURN v_result;
END $$

-- ---------------------------------------------------------------------
-- FUNCTION: fn_calculate_profile_completion(user_id) — pure calculation,
-- 0-100, per Blueprint §10.4 ("CalculateProfileCompletion").
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_profile_completion $$
CREATE FUNCTION fn_calculate_profile_completion(p_user_id INT UNSIGNED)
RETURNS TINYINT UNSIGNED
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_score INT DEFAULT 0;
  DECLARE v_headline VARCHAR(160);
  DECLARE v_bio TEXT;
  DECLARE v_location VARCHAR(120);
  DECLARE v_primary_role VARCHAR(20);
  DECLARE v_startup_goal VARCHAR(20);
  DECLARE v_skill_count INT DEFAULT 0;
  DECLARE v_interest_count INT DEFAULT 0;

  SELECT headline, bio, location, primary_role, startup_goal
    INTO v_headline, v_bio, v_location, v_primary_role, v_startup_goal
  FROM Profiles WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_skill_count FROM UserSkills WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_interest_count FROM UserInterests WHERE user_id = p_user_id;

  IF v_headline IS NOT NULL AND v_headline <> '' THEN SET v_score = v_score + 15; END IF;
  IF v_bio IS NOT NULL AND v_bio <> '' THEN SET v_score = v_score + 15; END IF;
  IF v_location IS NOT NULL AND v_location <> '' THEN SET v_score = v_score + 10; END IF;
  IF v_primary_role IS NOT NULL AND v_primary_role <> 'other' THEN SET v_score = v_score + 10; END IF;
  IF v_startup_goal IS NOT NULL THEN SET v_score = v_score + 10; END IF;
  IF v_skill_count > 0 THEN SET v_score = v_score + LEAST(v_skill_count * 10, 25); END IF;
  IF v_interest_count > 0 THEN SET v_score = v_score + LEAST(v_interest_count * 5, 15); END IF;

  RETURN LEAST(v_score, 100);
END $$

-- ---------------------------------------------------------------------
-- PROCEDURE: sp_recalculate_profile_completion — writes the function's
-- result back onto Profiles.profile_completion. Kept as a separate
-- procedure because a FUNCTION should not perform DML in MySQL.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_recalculate_profile_completion $$
CREATE PROCEDURE sp_recalculate_profile_completion(IN p_user_id INT UNSIGNED)
BEGIN
  UPDATE Profiles
  SET profile_completion = fn_calculate_profile_completion(p_user_id)
  WHERE user_id = p_user_id;
END $$

-- ---------------------------------------------------------------------
-- PROCEDURE: sp_accept_application — Blueprint §10.3 "AcceptStartupApplication",
-- generalized to all three application types, as one ACID transaction.
-- Marks the application accepted and, when it concerns a startup
-- (startup_application or team_invitation), adds the relevant user to the
-- startup's team. Rolls back entirely on error.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_accept_application $$
CREATE PROCEDURE sp_accept_application(IN p_application_id INT UNSIGNED, IN p_receiver_id INT UNSIGNED)
BEGIN
  DECLARE v_sender_id INT UNSIGNED;
  DECLARE v_startup_id INT UNSIGNED;
  DECLARE v_type VARCHAR(30);
  DECLARE v_status VARCHAR(20);
  DECLARE v_member_to_add INT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT sender_id, startup_id, type, status INTO v_sender_id, v_startup_id, v_type, v_status
  FROM Applications
  WHERE application_id = p_application_id AND receiver_id = p_receiver_id
  FOR UPDATE;

  IF v_sender_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application not found for this receiver';
  END IF;

  IF v_status <> 'pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application already resolved';
  END IF;

  UPDATE Applications
  SET status = 'accepted'
  WHERE application_id = p_application_id;

  -- cofounder_request: receiver is the startup owner receiving an
  --   applicant → add the SENDER.
  -- team_invitation: receiver is the invited user accepting → add the
  --   RECEIVER (themselves).
  IF v_startup_id IS NOT NULL THEN
    IF v_type = 'team_invitation' THEN
      SET v_member_to_add = p_receiver_id;
    ELSE
      SET v_member_to_add = v_sender_id;
    END IF;

    INSERT INTO StartupMembers (startup_id, user_id, team_role)
    VALUES (v_startup_id, v_member_to_add, 'Member')
    ON DUPLICATE KEY UPDATE member_status = 'active';
  END IF;

  INSERT INTO Notifications (user_id, type, message, reference_id)
  VALUES (v_sender_id, 'application_accepted', 'Your request was accepted.', p_application_id);

  COMMIT;
END $$

DELIMITER ;
