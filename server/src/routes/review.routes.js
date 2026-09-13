import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../validators/application.validators.js';
import { postReview, getUserReviews } from '../controllers/review.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', validate(reviewSchema), postReview);
router.get('/:userId', getUserReviews);

export default router;
