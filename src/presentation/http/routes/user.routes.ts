import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const ctrl = new UserController();

router.get('/', authenticate, authorize('TEACHER', 'COACH'), ctrl.list);
router.get('/:id', authenticate, authorize('TEACHER', 'COACH'), ctrl.getById);
router.post('/', authenticate, authorize('COACH'), ctrl.create);
router.put('/:id', authenticate, authorize('COACH', 'TEACHER'), ctrl.update);
router.patch('/:id', authenticate, authorize('COACH', 'TEACHER'), ctrl.update);
router.delete('/:id', authenticate, authorize('COACH'), ctrl.remove);
router.get('/:id/progress', authenticate, authorize('TEACHER', 'COACH'), ctrl.getProgress);

export { router as userRouter };
