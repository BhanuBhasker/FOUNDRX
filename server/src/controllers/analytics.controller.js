import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as Analytics from '../models/analytics.model.js';

/** GET /api/admin/analytics — platform-wide stats for the minimal admin view. */
export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [overview, topSkills, statusBreakdown, byCategory, signups] = await Promise.all([
    Analytics.platformOverview(),
    Analytics.topSkills(10),
    Analytics.applicationStatusBreakdown(),
    Analytics.startupsByCategory(),
    Analytics.signupsOverTime(30),
  ]);
  sendSuccess(res, {
    message: 'Platform analytics',
    data: { overview, topSkills, statusBreakdown, byCategory, signups },
  });
});
