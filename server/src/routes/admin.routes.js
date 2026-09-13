import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as AdminController from '../controllers/admin.controller.js';
import { getPlatformAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/analytics', getPlatformAnalytics);

router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/status', validate(z.object({ status: z.enum(['active', 'suspended']) })), AdminController.setUserStatus);
router.patch('/users/:id/role', validate(z.object({ role: z.enum(['user', 'admin']) })), AdminController.setUserRole);

router.get('/startups', AdminController.getAllStartupsAdmin);
router.delete('/startups/:id', AdminController.removeStartupAdmin);

router.get('/skills', AdminController.getSkillsAdmin);
router.post('/skills', validate(z.object({ skillName: z.string().trim().min(2).max(80), category: z.string().trim().max(60).default('general') })), AdminController.addSkillAdmin);
router.delete('/skills/:id', AdminController.removeSkillAdmin);

export default router;
