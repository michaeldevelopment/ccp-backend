import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { NotFoundError } from '@domain/shared/errors';
import { ModuleResult, toModuleResult } from './moduleResult';

interface GetModuleInput {
  number: number;
  userId: string;
  role: string;
}

export class GetModuleUseCase {
  constructor(
    private readonly moduleRepo: IModuleRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: GetModuleInput): Promise<ModuleResult> {
    const module = await this.moduleRepo.findByNumber(input.number);
    if (!module) throw new NotFoundError('Módulo no encontrado');

    if (input.role !== 'STUDENT') {
      return toModuleResult(module, true);
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) return toModuleResult(module, false);

    return toModuleResult(module, user.accessibleModules.includes(module.number));
  }
}
