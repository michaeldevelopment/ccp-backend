import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { NotFoundError } from '@domain/shared/errors';
import { UserResult, toUserResult } from './userResult';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: { userId: string }): Promise<UserResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return toUserResult(user);
  }
}
