import cron from 'node-cron';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { logger } from '@config/logger';

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export function startPausedTransitionJob(userRepo: IUserRepository): void {
  cron.schedule('0 * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - FOUR_WEEKS_MS);
      const expired = await userRepo.findExpiredPaused(threshold);
      for (const user of expired) {
        await userRepo.updateStatus(user.id, 'PENDING_REASSIGNMENT');
        logger.info({
          message: 'Usuario transicionado a PENDING_REASSIGNMENT tras 4 semanas de pausa',
          userId: user.id,
          pausedAt: user.pausedAt,
        });
      }
    } catch (err) {
      logger.error({ message: 'Error en job de transición de pausa', error: err });
    }
  });
}
