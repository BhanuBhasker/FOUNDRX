/**
 * Transparent, rule-based compatibility score (0-100) between the current
 * user and a candidate builder. Deliberately simple and explainable —
 * FOUNDRX intentionally avoids an ML-based recommender (Blueprint §9,
 * "keep the primary calculation in application/backend logic").
 *
 * Weights (Blueprint §9 "Suggested Version 1 weighting"):
 *   Complementary Skills     30%
 *   Shared Interests         25%
 *   Availability             15%
 *   Experience Compatibility 15%
 *   Role Complementarity     10%
 *   Startup Goal Match        5%
 */
const AVAILABILITY_RANK = { full_time: 3, part_time: 2, weekends: 1, not_available: 0 };
const EXPERIENCE_RANK = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function jaccard(setA, setB) {
  if (setA.length === 0 && setB.length === 0) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * "Complementary" skills means the candidate brings skill CATEGORIES
 * (e.g. design, backend, marketing) you don't already have yourself —
 * the whole point of looking for a co-founder rather than a clone.
 * Score = fraction of the candidate's skill categories that are new to you.
 */
function complementarySkillScore(myCategories, candidateCategories) {
  if (candidateCategories.length === 0) return 0;
  const mine = new Set(myCategories);
  const newCategories = candidateCategories.filter((c) => !mine.has(c));
  return newCategories.length / candidateCategories.length;
}

function rankDistanceScore(rankMap, a, b) {
  const rankA = rankMap[a] ?? 0;
  const rankB = rankMap[b] ?? 0;
  const diff = Math.abs(rankA - rankB);
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0.15;
}

function roleComplementarityScore(myRole, candidateRole) {
  if (!myRole || !candidateRole) return 0.5;
  return myRole === candidateRole ? 0.3 : 1;
}

function startupGoalScore(myGoal, candidateGoal) {
  if (!myGoal || !candidateGoal) return 0.3;
  return myGoal === candidateGoal ? 1 : 0.3;
}

export function computeCompatibilityScore(currentUser, candidate) {
  const candidateCategories = [...new Set((candidate.skills || []).map((s) => s.category).filter(Boolean))];
  const candidateInterestIds = (candidate.interests || []).map((i) => i.interest_id);

  const skillScore = complementarySkillScore(currentUser.skill_categories || [], candidateCategories);
  const interestScore = jaccard(currentUser.interest_ids || [], candidateInterestIds);
  const availabilityScore = rankDistanceScore(AVAILABILITY_RANK, currentUser.availability_hours, candidate.availability_hours);
  const experienceScore = rankDistanceScore(EXPERIENCE_RANK, currentUser.experience_level, candidate.experience_level);
  const roleScore = roleComplementarityScore(currentUser.primary_role, candidate.primary_role);
  const goalScore = startupGoalScore(currentUser.startup_goal, candidate.startup_goal);

  const total =
    skillScore * 30 + interestScore * 25 + availabilityScore * 15 + experienceScore * 15 + roleScore * 10 + goalScore * 5;

  return {
    score: Math.round(total * 100) / 100,
    breakdown: {
      complementarySkillsPct: Math.round(skillScore * 100),
      sharedInterestsPct: Math.round(interestScore * 100),
      availabilityPct: Math.round(availabilityScore * 100),
      experiencePct: Math.round(experienceScore * 100),
      roleComplementarityPct: Math.round(roleScore * 100),
      startupGoalPct: Math.round(goalScore * 100),
    },
  };
}
