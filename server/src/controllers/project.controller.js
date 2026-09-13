import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as ProjectModel from '../models/project.model.js';
import * as MilestoneModel from '../models/milestone.model.js';
import { isStartupOwner } from '../models/startup.model.js';

async function assertStartupAccess(startupId, userId) {
  const isOwner = await isStartupOwner(startupId, userId);
  if (!isOwner) throw ApiError.forbidden('Only the startup owner can manage projects');
}

/** POST /api/projects — flat resource; the target startup is in the body. */
export const createProject = asyncHandler(async (req, res) => {
  const { startupId } = req.body;
  if (!startupId) throw ApiError.badRequest('startupId is required');
  await assertStartupAccess(startupId, req.user.user_id);
  const project = await ProjectModel.createProject(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Project created', data: { project } });
});

export const getProjectsByStartup = asyncHandler(async (req, res) => {
  const projects = await ProjectModel.listProjectsByStartup(Number(req.params.startupId));
  sendSuccess(res, { message: 'Projects fetched', data: { projects } });
});

export const getProjectDetail = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await ProjectModel.getProjectById(projectId);
  if (!project) throw ApiError.notFound('Project not found');
  const [members, milestones] = await Promise.all([
    ProjectModel.listProjectMembers(projectId),
    MilestoneModel.listMilestonesByProject(projectId),
  ]);
  sendSuccess(res, { message: 'Project detail', data: { project, members, milestones } });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await ProjectModel.getProjectById(Number(req.params.id));
  if (!project) throw ApiError.notFound('Project not found');
  await assertStartupAccess(project.startup_id, req.user.user_id);
  const updated = await ProjectModel.updateProject(project.project_id, req.body);
  sendSuccess(res, { message: 'Project updated', data: { project: updated } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await ProjectModel.getProjectById(Number(req.params.id));
  if (!project) throw ApiError.notFound('Project not found');
  await assertStartupAccess(project.startup_id, req.user.user_id);
  await ProjectModel.deleteProject(project.project_id);
  sendSuccess(res, { message: 'Project deleted' });
});

export const addProjectMember = asyncHandler(async (req, res) => {
  const project = await ProjectModel.getProjectById(Number(req.params.id));
  if (!project) throw ApiError.notFound('Project not found');
  await assertStartupAccess(project.startup_id, req.user.user_id);
  await ProjectModel.addProjectMember(project.project_id, req.body.userId, req.body.projectRole);
  const members = await ProjectModel.listProjectMembers(project.project_id);
  sendSuccess(res, { message: 'Member added to project', data: { members } });
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await ProjectModel.getProjectById(Number(req.params.id));
  if (!project) throw ApiError.notFound('Project not found');
  await assertStartupAccess(project.startup_id, req.user.user_id);
  await ProjectModel.removeProjectMember(project.project_id, Number(req.params.userId));
  const members = await ProjectModel.listProjectMembers(project.project_id);
  sendSuccess(res, { message: 'Member removed from project', data: { members } });
});
