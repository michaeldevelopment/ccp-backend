import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IVimeoService } from '@domain/class/services/IVimeoService';
import { Attachment } from '@domain/class/entities/Class';
import { NotFoundError, ValidationError } from '@domain/shared/errors';
import { ClassResult, toClassResult } from './classResult';

interface CreateClassInput {
  moduleNumber: number;
  title: string;
  description: string;
  vimeoUrl: string;
  attachments: Attachment[];
  publishedAt?: Date;
  notify: boolean;
}

export class CreateClassUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly moduleRepo: IModuleRepository,
    private readonly vimeoService: IVimeoService
  ) {}

  async execute(input: CreateClassInput): Promise<ClassResult> {
    const module = await this.moduleRepo.findByNumber(input.moduleNumber);
    if (!module) throw new NotFoundError('Módulo no encontrado');

    // TODO: re-habilitar validación de Vimeo cuando haya VIMEO_ACCESS_TOKEN y URLs reales
    // const vimeo = await this.vimeoService.validateUrl(input.vimeoUrl);
    // if (!vimeo.valid) throw new BusinessLogicError(vimeo.message ?? 'URL de Vimeo inválida');

    if (input.publishedAt && input.publishedAt <= new Date()) {
      throw new ValidationError('publishedAt debe ser una fecha futura');
    }

    const cls = await this.classRepo.create({
      moduleId: module.id,
      title: input.title,
      description: input.description,
      vimeoUrl: input.vimeoUrl,
      attachments: input.attachments,
      publishedAt: input.publishedAt,
      notify: input.notify,
    });

    return toClassResult(cls);
  }
}
