import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import {
  IProgressRepository,
  ProgressRecordWithClass,
} from '@domain/user/repositories/IProgressRepository';
import { NotFoundError } from '@domain/shared/errors';

export class GetUserProgressUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly progressRepo: IProgressRepository
  ) {}

  async execute(input: { userId: string }): Promise<ProgressRecordWithClass[]> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return this.progressRepo.findByUserIdWithClass(input.userId);
  }
}
