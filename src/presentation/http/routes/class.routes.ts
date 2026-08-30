import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { studentCheck } from '../middleware/studentCheck';

const router = Router();
const ctrl = new ClassController();

// validate-vimeo MUST be registered before /:id to avoid param collision
router.post('/validate-vimeo', authenticate, authorize('TEACHER', 'COACH'), ctrl.validateVimeo);

router.get('/', authenticate, authorize('TEACHER', 'COACH'), ctrl.list);
router.get(
  '/:id',
  authenticate,
  authorize('STUDENT', 'TEACHER', 'COACH'),
  studentCheck,
  ctrl.getById
);
router.post('/', authenticate, authorize('TEACHER', 'COACH'), ctrl.create);
router.put('/:id', authenticate, authorize('TEACHER', 'COACH'), ctrl.update);
router.patch('/:id', authenticate, authorize('TEACHER', 'COACH'), ctrl.update);
router.delete('/:id', authenticate, authorize('TEACHER', 'COACH'), ctrl.remove);
router.post('/:id/publish', authenticate, authorize('TEACHER', 'COACH'), ctrl.publish);

export { router as classRouter };
