import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as ProfileController from '../controllers/profile.controller.js';
import { upsertProfileSchema } from '../validators/profile.validators.js';

const router = Router();

router.use(requireAuth);
router.get('/me', ProfileController.getMyProfile);
router.put('/me', validate(upsertProfileSchema), ProfileController.updateMyProfile);
router.get('/saved', ProfileController.getSavedProfiles);
router.post('/saved/:userId', ProfileController.saveProfile);
router.delete('/saved/:userId', ProfileController.unsaveProfile);
router.get('/:userId', ProfileController.getProfileByUserId);

export default router;
