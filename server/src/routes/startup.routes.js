import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStartupSchema, updateStartupSchema, addMemberSchema, updateMemberRoleSchema } from '../validators/startup.validators.js';
import * as StartupController from '../controllers/startup.controller.js';
import { getProjectsByStartup } from '../controllers/project.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', validate(createStartupSchema), StartupController.createStartup);
router.get('/', StartupController.getStartups);
router.get('/mine', StartupController.getMyStartups);
router.get('/:id', StartupController.getStartupDetail);
router.put('/:id', validate(updateStartupSchema), StartupController.updateStartup);
router.delete('/:id', StartupController.deleteStartup);

router.get('/:id/members', StartupController.getMembers);
router.post('/:id/members', validate(addMemberSchema), StartupController.addMember);
router.put('/:id/members/:userId', validate(updateMemberRoleSchema), StartupController.updateMemberRole);
router.delete('/:id/members/:userId', StartupController.removeMember);

// Convenience read: a startup's projects (creation happens via POST /api/projects).
router.get('/:startupId/projects', getProjectsByStartup);

export default router;
