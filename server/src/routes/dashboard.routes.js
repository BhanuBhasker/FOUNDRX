import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard, getDashboardAnalytics } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDashboard);
router.get('/analytics', getDashboardAnalytics);

export default router;
