import { IUserRepository } from '@domain/user/repositories/IUserRepository';

interface LogoutInput {
  userId: string;
}

export class LogoutUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.userRepo.updateRefreshTokenHash(input.userId, null);
  }
}
