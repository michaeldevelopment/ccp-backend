import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const authController = new AuthController();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    },
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Intenta de nuevo más tarde.' },
  },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Intenta de nuevo en 1 hora.' },
  },
});

const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    },
  },
});

router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.get('/activate', activationLimiter, authController.validateActivationToken);
router.post('/activate', activationLimiter, authController.activateAccount);
router.post('/password/reset', resetLimiter, authController.requestPasswordReset);
router.post('/password/reset/confirm', resetLimiter, authController.consumePasswordReset);
router.post('/password/change', authenticate, authController.changePassword);

export { router as authRouter };
