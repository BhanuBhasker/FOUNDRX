import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as MilestoneModel from '../models/milestone.model.js';
import { getProjectById } from '../models/project.model.js';
import { isStartupOwner } from '../models/startup.model.js';

async function assertProjectAccess(projectId, userId) {
  const project = await getProjectById(projectId);
  if (!project) throw ApiError.notFound('Project not found');
  const isOwner = await isStartupOwner(project.startup_id, userId);
  if (!isOwner) throw ApiError.forbidden('Only the startup owner can manage milestones');
  return project;
}

/** POST /api/milestones — flat resource; the target project is in the body. */
export const createMilestone = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) throw ApiError.badRequest('projectId is required');
  await assertProjectAccess(projectId, req.user.user_id);
  const milestone = await MilestoneModel.createMilestone(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Milestone created', data: { milestone } });
});

export const getMilestone = asyncHandler(async (req, res) => {
  const milestone = await MilestoneModel.getMilestoneById(Number(req.params.id));
  if (!milestone) throw ApiError.notFound('Milestone not found');
  sendSuccess(res, { message: 'Milestone fetched', data: { milestone } });
});

export const updateMilestone = asyncHandler(async (req, res) => {
  const milestone = await MilestoneModel.getMilestoneById(Number(req.params.id));
  if (!milestone) throw ApiError.notFound('Milestone not found');
  await assertProjectAccess(milestone.project_id, req.user.user_id);
  const updated = await MilestoneModel.updateMilestone(milestone.milestone_id, req.body);
  sendSuccess(res, { message: 'Milestone updated', data: { milestone: updated } });
});

export const deleteMilestone = asyncHandler(async (req, res) => {
  const milestone = await MilestoneModel.getMilestoneById(Number(req.params.id));
  if (!milestone) throw ApiError.notFound('Milestone not found');
  await assertProjectAccess(milestone.project_id, req.user.user_id);
  await MilestoneModel.deleteMilestone(milestone.milestone_id);
  sendSuccess(res, { message: 'Milestone deleted' });
});
