import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { milestoneSchema } from '../validators/startup.validators.js';
import * as MilestoneController from '../controllers/milestone.controller.js';

// Flat resource, per Blueprint §7: POST /api/milestones, GET/PUT/DELETE /api/milestones/:id.
const router = Router();

router.use(requireAuth);
router.post('/', validate(milestoneSchema), MilestoneController.createMilestone);
router.get('/:id', MilestoneController.getMilestone);
router.put('/:id', validate(milestoneSchema), MilestoneController.updateMilestone);
router.delete('/:id', MilestoneController.deleteMilestone);

export default router;
