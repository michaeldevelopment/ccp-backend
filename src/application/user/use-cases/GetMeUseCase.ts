import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { NotFoundError } from '@domain/shared/errors';

interface GetMeInput {
  userId: string;
}

interface GetMeResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  groupId: string | null;
  entryModule: number | null;
}

export class GetMeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: GetMeInput): Promise<GetMeResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      groupId: user.groupId,
      entryModule: user.entryModule,
    };
  }
}
