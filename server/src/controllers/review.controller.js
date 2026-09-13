import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { createReview, listReviewsForUser, averageRatingForUser } from '../models/review.model.js';

export const postReview = asyncHandler(async (req, res) => {
  if (req.body.reviewedId === req.user.user_id) throw ApiError.badRequest('You cannot review yourself');
  const review = await createReview({ reviewerId: req.user.user_id, ...req.body });
  sendSuccess(res, { statusCode: 201, message: 'Review submitted', data: { review } });
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const [reviews, summary] = await Promise.all([listReviewsForUser(userId), averageRatingForUser(userId)]);
  sendSuccess(res, { message: 'Reviews fetched', data: { reviews, summary } });
});
