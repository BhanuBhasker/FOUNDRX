import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { listUsersForAdmin, updateUserStatus, updateUserRole } from '../models/user.model.js';
import { listStartups, deleteStartup } from '../models/startup.model.js';
import { createSkill, deleteSkill, listSkills } from '../models/skill.model.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { rows, total } = await listUsersForAdmin({ limit, offset, search: req.query.search });
  sendSuccess(res, { message: 'Users fetched', data: { users: rows }, meta: buildMeta({ page, limit, total }) });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  await updateUserStatus(Number(req.params.id), req.body.status);
  sendSuccess(res, { message: 'User status updated' });
});

export const setUserRole = asyncHandler(async (req, res) => {
  await updateUserRole(Number(req.params.id), req.body.role);
  sendSuccess(res, { message: 'User role updated' });
});

export const getAllStartupsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { rows, total } = await listStartups({ search: req.query.search, limit, offset });
  sendSuccess(res, { message: 'Startups fetched', data: { startups: rows }, meta: buildMeta({ page, limit, total }) });
});

export const removeStartupAdmin = asyncHandler(async (req, res) => {
  await deleteStartup(Number(req.params.id));
  sendSuccess(res, { message: 'Startup removed' });
});

export const getSkillsAdmin = asyncHandler(async (req, res) => {
  const skills = await listSkills();
  sendSuccess(res, { message: 'Skills fetched', data: { skills } });
});

export const addSkillAdmin = asyncHandler(async (req, res) => {
  const skill = await createSkill(req.body.skillName, req.body.category);
  sendSuccess(res, { statusCode: 201, message: 'Skill added', data: { skill } });
});

export const removeSkillAdmin = asyncHandler(async (req, res) => {
  await deleteSkill(Number(req.params.id));
  sendSuccess(res, { message: 'Skill removed' });
});
