import bcrypt from 'bcryptjs';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { NotFoundError, UnauthorizedError, BusinessLogicError } from '@domain/shared/errors';

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (!user.passwordHash) {
      throw new BusinessLogicError('La cuenta no ha sido activada');
    }

    const passwordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    const newHash = await bcrypt.hash(input.newPassword, 12);
    await this.userRepo.updatePassword(input.userId, newHash);
  }
}
