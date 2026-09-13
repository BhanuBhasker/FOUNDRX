import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as ProfileModel from '../models/profile.model.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileModel.getFullProfile(req.user.user_id);
  sendSuccess(res, { message: 'Profile fetched', data: { profile } });
});

export const getProfileByUserId = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.userId);
  const profile = await ProfileModel.getFullProfile(targetId);
  if (!profile) throw ApiError.notFound('Profile not found');
  if (profile.profile_visibility === 'private' && targetId !== req.user.user_id) {
    throw ApiError.forbidden('This profile is private');
  }
  const isSaved = await ProfileModel.isProfileSaved(req.user.user_id, targetId);
  sendSuccess(res, { message: 'Profile fetched', data: { profile: { ...profile, isSaved } } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { skillIds, interestIds, ...fields } = req.body;
  await ProfileModel.upsertProfile(req.user.user_id, fields);
  await ProfileModel.setUserSkills(req.user.user_id, skillIds);
  await ProfileModel.setUserInterests(req.user.user_id, interestIds);
  const profile = await ProfileModel.getFullProfile(req.user.user_id);
  sendSuccess(res, { message: 'Profile updated', data: { profile } });
});

export const saveProfile = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.userId);
  if (targetId === req.user.user_id) throw ApiError.badRequest('You cannot save your own profile');
  await ProfileModel.saveProfile(req.user.user_id, targetId);
  sendSuccess(res, { message: 'Profile saved' });
});

export const unsaveProfile = asyncHandler(async (req, res) => {
  await ProfileModel.unsaveProfile(req.user.user_id, Number(req.params.userId));
  sendSuccess(res, { message: 'Profile removed from saved list' });
});

export const getSavedProfiles = asyncHandler(async (req, res) => {
  const profiles = await ProfileModel.listSavedProfiles(req.user.user_id);
  sendSuccess(res, { message: 'Saved profiles fetched', data: { profiles } });
});
