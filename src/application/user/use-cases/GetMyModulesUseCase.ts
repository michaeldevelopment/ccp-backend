import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import {
  IStudentContentRepository,
  UnlockedModuleRecord,
} from '@domain/user/repositories/IStudentContentRepository';
import { NotFoundError } from '@domain/shared/errors';

export class GetMyModulesUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly contentRepo: IStudentContentRepository
  ) {}

  async execute(input: { userId: string }): Promise<UnlockedModuleRecord[]> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    if (user.accessibleModules.length === 0) return [];
    return this.contentRepo.findUnlockedModules(user.accessibleModules);
  }
}
