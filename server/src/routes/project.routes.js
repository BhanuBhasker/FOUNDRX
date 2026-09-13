import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { projectSchema, addMemberSchema } from '../validators/startup.validators.js';
import * as ProjectController from '../controllers/project.controller.js';

// Flat resource, per Blueprint §7: POST /api/projects, GET/PUT/DELETE /api/projects/:id.
const router = Router();

router.use(requireAuth);
router.post('/', validate(projectSchema), ProjectController.createProject);
router.get('/:id', ProjectController.getProjectDetail);
router.put('/:id', validate(projectSchema), ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);
router.post('/:id/members', validate(addMemberSchema), ProjectController.addProjectMember);
router.delete('/:id/members/:userId', ProjectController.removeProjectMember);

export default router;
