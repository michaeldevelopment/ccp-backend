import { IUserRepository, UserFilters } from '@domain/user/repositories/IUserRepository';
import { UserResult, toUserResult } from './userResult';

export class ListUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(filters: UserFilters): Promise<UserResult[]> {
    const users = await this.userRepo.findMany(filters);
    return users.map(toUserResult);
  }
}
