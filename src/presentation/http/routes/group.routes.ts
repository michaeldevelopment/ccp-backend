import { Router } from 'express';
import { GroupController } from '../controllers/GroupController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const ctrl = new GroupController();

router.get('/', authenticate, authorize('TEACHER', 'COACH'), ctrl.list);
router.get('/:id', authenticate, authorize('TEACHER', 'COACH'), ctrl.getById);
router.post('/', authenticate, authorize('COACH'), ctrl.create);
router.put('/:id', authenticate, authorize('COACH'), ctrl.update);
router.delete('/:id', authenticate, authorize('COACH'), ctrl.remove);
router.post('/:id/advance', authenticate, authorize('COACH'), ctrl.advance);
router.post('/:id/retreat', authenticate, authorize('COACH'), ctrl.retreat);

export { router as groupRouter };
