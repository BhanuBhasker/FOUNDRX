import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { listSkills, listInterests, createSkill, deleteSkill } from '../models/skill.model.js';

export const getSkills = asyncHandler(async (req, res) => {
  const skills = await listSkills();
  sendSuccess(res, { message: 'Skills fetched', data: { skills } });
});

export const getInterests = asyncHandler(async (req, res) => {
  const interests = await listInterests();
  sendSuccess(res, { message: 'Interests fetched', data: { interests } });
});

export const addSkill = asyncHandler(async (req, res) => {
  const { skillName, category } = req.body;
  const skill = await createSkill(skillName, category);
  sendSuccess(res, { statusCode: 201, message: 'Skill added', data: { skill } });
});

export const removeSkill = asyncHandler(async (req, res) => {
  await deleteSkill(Number(req.params.skillId));
  sendSuccess(res, { message: 'Skill removed' });
});
