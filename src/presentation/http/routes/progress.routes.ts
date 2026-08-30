import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { studentCheck } from '../middleware/studentCheck';

const router = Router();
const ctrl = new ProgressController();

router.get('/', authenticate, authorize('STUDENT', 'TEACHER', 'COACH'), studentCheck, ctrl.get);
router.put('/', authenticate, authorize('STUDENT', 'TEACHER', 'COACH'), studentCheck, ctrl.upsert);

export { router as progressRouter };
