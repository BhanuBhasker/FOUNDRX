import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import * as ApplicationModel from '../models/application.model.js';
import { getCurrentUserMatchProfile } from '../models/discover.model.js';
import { getFullProfile } from '../models/profile.model.js';
import { isStartupOwner, isStartupMember } from '../models/startup.model.js';
import { computeCompatibilityScore } from '../services/compatibility.service.js';

export const sendApplication = asyncHandler(async (req, res) => {
  const { type, receiverId, startupId, message } = req.body;
  if (receiverId === req.user.user_id) throw ApiError.badRequest('You cannot send a request to yourself');

  if (type === 'startup_application') {
    if (!startupId) throw ApiError.badRequest('startupId is required to apply to a startup');
    const ownerMatch = await isStartupOwner(startupId, receiverId);
    if (!ownerMatch) throw ApiError.badRequest('receiverId must be the owner of the given startup');
    if (await isStartupMember(startupId, req.user.user_id)) throw ApiError.conflict('You are already a member of this startup');
  } else if (type === 'team_invitation') {
    if (!startupId) throw ApiError.badRequest('startupId is required to send a team invitation');
    const isOwner = await isStartupOwner(startupId, req.user.user_id);
    if (!isOwner) throw ApiError.forbidden('Only the startup owner can send team invitations');
    if (await isStartupMember(startupId, receiverId)) throw ApiError.conflict('That user is already a member of this startup');
  }

  const existingPending = await ApplicationModel.findPendingBetween(req.user.user_id, receiverId, type, startupId);
  if (existingPending) throw ApiError.conflict('A pending request already exists between these users');

  const [currentUserMatch, receiverProfile] = await Promise.all([
    getCurrentUserMatchProfile(req.user.user_id),
    getFullProfile(receiverId),
  ]);

  let compatibilityScore = 0;
  if (currentUserMatch && receiverProfile) {
    compatibilityScore = computeCompatibilityScore(currentUserMatch, receiverProfile).score;
  }

  const application = await ApplicationModel.createApplication({
    type,
    senderId: req.user.user_id,
    receiverId,
    startupId,
    message,
    compatibilityScore,
  });
  sendSuccess(res, { statusCode: 201, message: 'Request sent', data: { application } });
});

/**
 * GET /api/applications?direction=received|sent|all&type=&status=
 * Unified request center backing the Received / Sent / Startup
 * Applications tabs (Blueprint §5, page 5).
 */
export const getApplications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { direction, type, status } = req.query;
  const { rows, total } = await ApplicationModel.listApplications(req.user.user_id, { direction, type, status, limit, offset });
  sendSuccess(res, { message: 'Applications fetched', data: { applications: rows }, meta: buildMeta({ page, limit, total }) });
});

/**
 * PUT /api/applications/:id/status — unified accept/reject/cancel.
 */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const applicationId = Number(req.params.id);
  const { status } = req.body;

  if (status === 'accepted') {
    try {
      const application = await ApplicationModel.acceptApplication(applicationId, req.user.user_id);
      return sendSuccess(res, { message: 'Request accepted', data: { application } });
    } catch (err) {
      if (err.sqlState === '45000') throw ApiError.badRequest(err.sqlMessage || err.message);
      throw err;
    }
  }

  if (status === 'rejected') {
    const ok = await ApplicationModel.rejectApplication(applicationId, req.user.user_id);
    if (!ok) throw ApiError.badRequest('Request not found or already resolved');
    return sendSuccess(res, { message: 'Request declined' });
  }

  // status === 'cancelled'
  const ok = await ApplicationModel.cancelApplication(applicationId, req.user.user_id);
  if (!ok) throw ApiError.badRequest('Request not found or already resolved');
  return sendSuccess(res, { message: 'Request cancelled' });
});

export const getApplicationStats = asyncHandler(async (req, res) => {
  const stats = await ApplicationModel.applicationStatsForUser(req.user.user_id);
  sendSuccess(res, { message: 'Application stats', data: { stats } });
});
