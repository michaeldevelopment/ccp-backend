import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IProgressRepository, ProgressRecord } from '@domain/user/repositories/IProgressRepository';
import { NotFoundError } from '@domain/shared/errors';

export class GetMyProgressUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly progressRepo: IProgressRepository
  ) {}

  async execute(input: { userId: string }): Promise<ProgressRecord[]> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return this.progressRepo.findByUserId(input.userId);
  }
}
