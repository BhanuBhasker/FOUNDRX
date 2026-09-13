import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import * as DiscoverModel from '../models/discover.model.js';
import { computeCompatibilityScore } from '../services/compatibility.service.js';

function parseIdList(value) {
  return value ? String(value).split(',').map(Number).filter(Boolean) : [];
}

/**
 * GET /api/discover/builders — Dual Discovery, half 1: find compatible
 * people. See Blueprint §5 "Discover Builders".
 */
export const discoverBuilders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, primaryRole, availabilityHours, startupGoal, sortBy } = req.query;
  const skillIds = parseIdList(req.query.skillIds);
  const interestIds = parseIdList(req.query.interestIds);

  const { rows, total } = await DiscoverModel.searchBuilders({
    excludeUserId: req.user.user_id,
    search,
    primaryRole,
    availabilityHours,
    startupGoal,
    skillIds,
    interestIds,
    sortBy,
    limit,
    offset,
  });

  const currentUserMatchProfile = await DiscoverModel.getCurrentUserMatchProfile(req.user.user_id);

  let builders = rows;
  if (currentUserMatchProfile) {
    builders = rows.map((candidate) => {
      const { score, breakdown } = computeCompatibilityScore(currentUserMatchProfile, candidate);
      return { ...candidate, compatibilityScore: score, compatibilityBreakdown: breakdown };
    });
    if (sortBy === 'compatibility' || !sortBy) {
      builders = builders.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }
  }

  sendSuccess(res, {
    message: 'Discovery results',
    data: { builders },
    meta: buildMeta({ page, limit, total }),
  });
});

/**
 * GET /api/discover/startups — Dual Discovery, half 2: find startup
 * opportunities that need someone like you. See Blueprint §5 "Discover
 * Startup Opportunities".
 */
export const discoverStartups = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, category, stage } = req.query;
  const skillIds = parseIdList(req.query.skillIds);
  const hasOpenSeats = req.query.hasOpenSeats === 'true';

  const { rows, total } = await DiscoverModel.searchStartupOpportunities({
    search,
    category,
    stage,
    skillIds,
    hasOpenSeats,
    limit,
    offset,
  });

  sendSuccess(res, {
    message: 'Startup opportunities',
    data: { startups: rows },
    meta: buildMeta({ page, limit, total }),
  });
});
