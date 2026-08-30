import { Router } from 'express';
import { ReassignmentController } from '../controllers/ReassignmentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const ctrl = new ReassignmentController();

router.get('/', authenticate, authorize('COACH'), ctrl.list);
router.post('/:id/resolve', authenticate, authorize('COACH'), ctrl.resolve);
router.post('/:id/graduate', authenticate, authorize('COACH'), ctrl.graduate);
router.post('/:id/undo', authenticate, authorize('COACH'), ctrl.undo);

export { router as reassignmentRouter };
