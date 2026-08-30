import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { NotFoundError, ValidationError } from '@domain/shared/errors';
import { ClassResult, toClassResult } from './classResult';

interface PublishClassInput {
  classId: string;
  publishedAt?: Date;
  notify?: boolean;
}

export class PublishClassUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: PublishClassInput): Promise<ClassResult> {
    const cls = await this.classRepo.findById(input.classId);
    if (!cls) throw new NotFoundError('Clase no encontrada');

    if (input.publishedAt && input.publishedAt <= new Date()) {
      throw new ValidationError('publishedAt debe ser una fecha futura');
    }

    if (!input.publishedAt) {
      const published = await this.classRepo.markPublished(input.classId);

      if (input.notify !== false) {
        const emails = await this.classRepo.findActiveStudentEmailsForModule(
          published.moduleNumber
        );
        await Promise.all(
          emails.map((email) =>
            this.emailService.sendNewClassEmail(email, published.title, published.moduleNumber)
          )
        );
      }

      return toClassResult(published);
    }

    const scheduled = await this.classRepo.update(input.classId, {
      publishedAt: input.publishedAt,
    });
    return toClassResult(scheduled);
  }
}
