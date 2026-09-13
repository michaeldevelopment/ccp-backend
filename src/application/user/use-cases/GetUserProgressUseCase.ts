import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IProgressRepository, ModuleProgress } from '@domain/user/repositories/IProgressRepository';
import { NotFoundError } from '@domain/shared/errors';

export class GetUserProgressUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly progressRepo: IProgressRepository
  ) {}

  async execute(input: { userId: string }): Promise<ModuleProgress[]> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return this.progressRepo.findModuleProgressForUser(input.userId);
  }
}
