import { Router } from 'express';
import { MeController } from '../controllers/MeController';
import { authenticate } from '../middleware/authenticate';
import { studentCheck } from '../middleware/studentCheck';

const router = Router();
const ctrl = new MeController();

router.get('/', authenticate, ctrl.getMe);
router.patch('/', authenticate, ctrl.updateMe);
router.get('/progress', authenticate, studentCheck, ctrl.getProgress);
router.get('/modules', authenticate, studentCheck, ctrl.getModules);
router.get('/classes', authenticate, studentCheck, ctrl.getClasses);

export { router as meRouter };
