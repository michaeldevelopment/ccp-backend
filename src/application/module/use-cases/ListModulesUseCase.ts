import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { ModuleResult, toModuleResult } from './moduleResult';

interface ListModulesInput {
  userId: string;
  role: string;
}

export class ListModulesUseCase {
  constructor(
    private readonly moduleRepo: IModuleRepository,
    private readonly userRepo: IUserRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: ListModulesInput): Promise<ModuleResult[]> {
    const modules = await this.moduleRepo.findAll();

    if (input.role !== 'STUDENT') {
      return modules.map((m) => toModuleResult(m, true));
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user || !user.groupId || user.entryModule === null) {
      return modules.map((m) => toModuleResult(m, false));
    }

    const group = await this.groupRepo.findById(user.groupId);
    if (!group) {
      return modules.map((m) => toModuleResult(m, false));
    }

    const accessible = new Set(group.unlockedModules.filter((m) => m >= user.entryModule!));
    return modules.map((m) => toModuleResult(m, accessible.has(m.number)));
  }
}
