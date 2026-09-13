import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as Analytics from '../models/analytics.model.js';

/** GET /api/dashboard — Blueprint §7 "Dashboard". */
export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await Analytics.personalDashboardStats(req.user.user_id);
  sendSuccess(res, { message: 'Dashboard stats', data: { stats } });
});

/** GET /api/dashboard/analytics — Blueprint §5, page 15 "Analytics". */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [topSkills, statusBreakdown, compatibility, activity] = await Promise.all([
    Analytics.topSkills(10),
    Analytics.personalApplicationStatusBreakdown(req.user.user_id),
    Analytics.personalCompatibilityStats(req.user.user_id),
    Analytics.startupActivityOverTime(req.user.user_id, 30),
  ]);
  sendSuccess(res, {
    message: 'Dashboard analytics',
    data: { topSkills, statusBreakdown, compatibility, activity },
  });
});
