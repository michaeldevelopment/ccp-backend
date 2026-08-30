import { Router } from 'express';
import { ModuleController } from '../controllers/ModuleController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const ctrl = new ModuleController();

router.get('/', authenticate, authorize('STUDENT', 'TEACHER', 'COACH'), ctrl.list);
router.get('/:number', authenticate, authorize('STUDENT', 'TEACHER', 'COACH'), ctrl.getByNumber);
router.put('/:number', authenticate, authorize('COACH'), ctrl.update);

export { router as moduleRouter };
