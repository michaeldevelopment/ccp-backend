import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IVimeoService } from '@domain/class/services/IVimeoService';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { Attachment } from '@domain/class/entities/Class';
import { NotFoundError, ValidationError } from '@domain/shared/errors';
import { ClassResult, toClassResult } from './classResult';

interface UpdateClassInput {
  classId: string;
  title?: string;
  description?: string;
  vimeoUrl?: string;
  attachments?: Attachment[];
  publishedAt?: Date | null;
  isPublished?: boolean;
  notify?: boolean;
}

export class UpdateClassUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly vimeoService: IVimeoService,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: UpdateClassInput): Promise<ClassResult> {
    const cls = await this.classRepo.findById(input.classId);
    if (!cls) throw new NotFoundError('Clase no encontrada');

    // TODO: re-habilitar validación de Vimeo cuando haya VIMEO_ACCESS_TOKEN y URLs reales
    // if (input.vimeoUrl && input.vimeoUrl !== cls.vimeoUrl) {
    //   const vimeo = await this.vimeoService.validateUrl(input.vimeoUrl);
    //   if (!vimeo.valid) throw new BusinessLogicError(vimeo.message ?? 'URL de Vimeo inválida');
    // }

    const publishingNow = input.isPublished === true && !cls.isPublished;

    if (input.publishedAt && input.publishedAt <= new Date() && !publishingNow) {
      throw new ValidationError('publishedAt debe ser una fecha futura');
    }

    const { classId, ...data } = input;

    if (publishingNow && data.publishedAt == null) {
      data.publishedAt = new Date();
    }

    const updated = await this.classRepo.update(classId, data);

    if (publishingNow && updated.notify) {
      const emails = await this.classRepo.findActiveStudentEmailsForModule(updated.moduleNumber);
      await Promise.all(
        emails.map((email) =>
          this.emailService.sendNewClassEmail(email, updated.title, updated.moduleNumber)
        )
      );
    }

    return toClassResult(updated);
  }
}
