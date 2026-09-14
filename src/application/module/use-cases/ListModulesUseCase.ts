import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { ModuleResult, toModuleResult } from './moduleResult';

interface ListModulesInput {
  userId: string;
  role: string;
}

export class ListModulesUseCase {
  constructor(
    private readonly moduleRepo: IModuleRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: ListModulesInput): Promise<ModuleResult[]> {
    const modules = await this.moduleRepo.findAll();

    if (input.role !== 'STUDENT') {
      return modules.map((m) => toModuleResult(m, true));
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return modules.map((m) => toModuleResult(m, false));
    }

    const accessible = new Set(user.accessibleModules);
    return modules.map((m) => toModuleResult(m, accessible.has(m.number)));
  }
}
