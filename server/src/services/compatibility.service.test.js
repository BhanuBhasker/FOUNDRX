import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCompatibilityScore } from './compatibility.service.js';

test('a fully complementary, aligned candidate scores 100', () => {
  const user = {
    skill_categories: ['backend'],
    interest_ids: [10],
    availability_hours: 'full_time',
    experience_level: 'advanced',
    primary_role: 'developer',
    startup_goal: 'find_cofounder',
  };
  const candidate = {
    skills: [{ category: 'design' }], // entirely new category → fully complementary
    interests: [{ interest_id: 10 }], // full interest overlap
    availability_hours: 'full_time',
    experience_level: 'advanced',
    primary_role: 'designer', // different role → complementary
    startup_goal: 'find_cofounder',
  };
  const { score } = computeCompatibilityScore(user, candidate);
  assert.equal(score, 100);
});

test('an identical clone (same skills, same role) scores lower on those factors', () => {
  const user = {
    skill_categories: ['backend'],
    interest_ids: [],
    availability_hours: 'not_available',
    experience_level: 'beginner',
    primary_role: 'developer',
    startup_goal: 'explore_ideas',
  };
  const candidate = {
    skills: [{ category: 'backend' }], // same category → not complementary
    interests: [],
    availability_hours: 'not_available',
    experience_level: 'beginner',
    primary_role: 'developer', // same role → not complementary
    startup_goal: 'explore_ideas',
  };
  const { breakdown } = computeCompatibilityScore(user, candidate);
  assert.equal(breakdown.complementarySkillsPct, 0);
  assert.equal(breakdown.roleComplementarityPct, 30);
});

test('breakdown reports each weighted factor independently', () => {
  const user = { skill_categories: [], interest_ids: [], availability_hours: 'weekends', experience_level: 'intermediate', primary_role: 'product', startup_goal: 'join_startup' };
  const candidate = {
    skills: [{ category: 'marketing' }, { category: 'design' }],
    interests: [],
    availability_hours: 'part_time', // one rank apart → partial credit
    experience_level: 'advanced', // one rank apart → partial credit
    primary_role: 'marketing',
    startup_goal: 'build_projects',
  };
  const { breakdown } = computeCompatibilityScore(user, candidate);
  assert.equal(breakdown.complementarySkillsPct, 100);
  assert.equal(breakdown.availabilityPct, 50);
  assert.equal(breakdown.experiencePct, 50);
});
