import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendApplicationSchema, updateApplicationStatusSchema } from '../validators/application.validators.js';
import {
  sendApplication,
  getApplications,
  updateApplicationStatus,
  getApplicationStats,
} from '../controllers/application.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getApplications);
router.get('/stats', getApplicationStats);
router.post('/', validate(sendApplicationSchema), sendApplication);
router.put('/:id/status', validate(updateApplicationStatusSchema), updateApplicationStatus);

export default router;
