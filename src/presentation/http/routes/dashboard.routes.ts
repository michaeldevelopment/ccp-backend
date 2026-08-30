import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const ctrl = new DashboardController();

const dashboardRouter = Router();
dashboardRouter.get('/summary', authenticate, authorize('TEACHER', 'COACH'), ctrl.summary);

const notificationsRouter = Router();
notificationsRouter.get('/', authenticate, authorize('TEACHER', 'COACH'), ctrl.notifications);

export { dashboardRouter, notificationsRouter };
