import { app } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { startPublicationJob } from '@infrastructure/jobs/publicationJob';
import { PrismaClassRepository } from '@infrastructure/persistence/prisma/PrismaClassRepository';
import { EmailService } from '@infrastructure/email/EmailService';

app.listen(env.PORT, () => {
  logger.info('Servidor CCP listo', { port: env.PORT, env: env?.NODE_ENV });
  startPublicationJob(new PrismaClassRepository(), new EmailService());
});
