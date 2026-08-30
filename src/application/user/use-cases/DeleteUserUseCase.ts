import { Role } from '@prisma/client';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { NotFoundError, ConflictError } from '@domain/shared/errors';

export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    if (user.role === Role.COACH) {
      const count = await this.userRepo.countByRole(Role.COACH);
      if (count <= 1) throw new ConflictError('No se puede eliminar al único coach del sistema');
    }

    await this.userRepo.delete(input.userId);
  }
}
