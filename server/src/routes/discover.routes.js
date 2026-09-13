import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { discoverBuilders, discoverStartups } from '../controllers/discover.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/builders', discoverBuilders);
router.get('/startups', discoverStartups);

export default router;
