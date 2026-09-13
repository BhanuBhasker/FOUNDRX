import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import * as StartupModel from '../models/startup.model.js';

async function assertOwner(startupId, userId) {
  const isOwner = await StartupModel.isStartupOwner(startupId, userId);
  if (!isOwner) throw ApiError.forbidden('Only the startup owner can perform this action');
}

export const createStartup = asyncHandler(async (req, res) => {
  const startup = await StartupModel.createStartup(req.user.user_id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Startup created', data: { startup } });
});

export const getStartups = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await StartupModel.listStartups({
    search: req.query.search,
    category: req.query.category,
    stage: req.query.stage,
    limit,
    offset,
  });
  sendSuccess(res, { message: 'Startups fetched', data: { startups: rows }, meta: buildMeta({ page, limit, total }) });
});

export const getMyStartups = asyncHandler(async (req, res) => {
  const startups = await StartupModel.listStartupsForUser(req.user.user_id);
  sendSuccess(res, { message: 'Your startups', data: { startups } });
});

export const getStartupDetail = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  const startup = await StartupModel.getStartupById(startupId);
  if (!startup) throw ApiError.notFound('Startup not found');
  const [members, progress, isMember] = await Promise.all([
    StartupModel.listStartupMembers(startupId),
    StartupModel.getStartupProgress(startupId),
    StartupModel.isStartupMember(startupId, req.user.user_id),
  ]);
  sendSuccess(res, { message: 'Startup detail', data: { startup, members, progress, isMember } });
});

export const updateStartup = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  await assertOwner(startupId, req.user.user_id);
  const startup = await StartupModel.updateStartup(startupId, req.body);
  sendSuccess(res, { message: 'Startup updated', data: { startup } });
});

export const deleteStartup = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  await assertOwner(startupId, req.user.user_id);
  await StartupModel.deleteStartup(startupId);
  sendSuccess(res, { message: 'Startup deleted' });
});

export const getMembers = asyncHandler(async (req, res) => {
  const members = await StartupModel.listStartupMembers(Number(req.params.id));
  sendSuccess(res, { message: 'Members fetched', data: { members } });
});

export const addMember = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  await assertOwner(startupId, req.user.user_id);
  await StartupModel.addStartupMember(startupId, req.body.userId, req.body.teamRole);
  const members = await StartupModel.listStartupMembers(startupId);
  sendSuccess(res, { message: 'Member added', data: { members } });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  await assertOwner(startupId, req.user.user_id);
  await StartupModel.updateStartupMemberRole(startupId, Number(req.params.userId), req.body.teamRole);
  const members = await StartupModel.listStartupMembers(startupId);
  sendSuccess(res, { message: 'Member role updated', data: { members } });
});

export const removeMember = asyncHandler(async (req, res) => {
  const startupId = Number(req.params.id);
  await assertOwner(startupId, req.user.user_id);
  await StartupModel.removeStartupMember(startupId, Number(req.params.userId));
  const members = await StartupModel.listStartupMembers(startupId);
  sendSuccess(res, { message: 'Member removed', data: { members } });
});
