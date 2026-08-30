import cron from 'node-cron';
import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { logger } from '@config/logger';

export function startPublicationJob(
  classRepo: IClassRepository,
  emailService: IEmailService
): void {
  cron.schedule('* * * * *', async () => {
    try {
      const due = await classRepo.findDueForPublication();

      for (const cls of due) {
        await classRepo.markPublished(cls.id);

        if (cls.notify) {
          const emails = await classRepo.findActiveStudentEmailsForModule(cls.moduleNumber);
          await Promise.all(
            emails.map((email) =>
              emailService.sendNewClassEmail(email, cls.title, cls.moduleNumber)
            )
          );
        }

        logger.info({
          message: 'Clase publicada automáticamente',
          classId: cls.id,
          title: cls.title,
        });
      }
    } catch (err) {
      logger.error({ message: 'Error en job de publicación', error: err });
    }
  });
}
