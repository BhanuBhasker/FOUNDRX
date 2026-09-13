import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import skillRoutes from './skill.routes.js';
import discoverRoutes from './discover.routes.js';
import applicationRoutes from './application.routes.js';
import startupRoutes from './startup.routes.js';
import projectRoutes from './project.routes.js';
import milestoneRoutes from './milestone.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'FOUNDRX API is running' }));

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/skills', skillRoutes);
router.use('/discover', discoverRoutes);
router.use('/applications', applicationRoutes);
router.use('/startups', startupRoutes);
router.use('/projects', projectRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

export default router;
