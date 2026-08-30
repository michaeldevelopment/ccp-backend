import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
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
    private readonly userRepo: IUserRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: GetModuleInput): Promise<ModuleResult> {
    const module = await this.moduleRepo.findByNumber(input.number);
    if (!module) throw new NotFoundError('Módulo no encontrado');

    if (input.role !== 'STUDENT') {
      return toModuleResult(module, true);
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user || !user.groupId || user.entryModule === null) {
      return toModuleResult(module, false);
    }

    const group = await this.groupRepo.findById(user.groupId);
    if (!group) return toModuleResult(module, false);

    const accessible = group.unlockedModules.filter((m) => m >= user.entryModule!);
    return toModuleResult(module, accessible.includes(module.number));
  }
}
