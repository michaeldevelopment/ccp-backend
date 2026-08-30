import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { NotFoundError } from '@domain/shared/errors';
import { ModuleResult, toModuleResult } from './moduleResult';

interface UpdateModuleInput {
  number: number;
  title?: string;
  description?: string;
}

export class UpdateModuleUseCase {
  constructor(private readonly moduleRepo: IModuleRepository) {}

  async execute(input: UpdateModuleInput): Promise<ModuleResult> {
    const { number, ...data } = input;
    const existing = await this.moduleRepo.findByNumber(number);
    if (!existing) throw new NotFoundError('Módulo no encontrado');
    const updated = await this.moduleRepo.update(number, data);
    return toModuleResult(updated, true);
  }
}
