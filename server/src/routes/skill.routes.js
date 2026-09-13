import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSkills, getInterests } from '../controllers/skill.controller.js';

const router = Router();

router.get('/', requireAuth, getSkills);
router.get('/interests', requireAuth, getInterests);

export default router;
