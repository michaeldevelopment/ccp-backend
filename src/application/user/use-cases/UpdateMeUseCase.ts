import bcrypt from 'bcryptjs';
import { IUserRepository, UserUpdateData } from '@domain/user/repositories/IUserRepository';
import {
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  BusinessLogicError,
} from '@domain/shared/errors';
import { UserResult, toUserResult } from './userResult';

interface UpdateMeInput {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export class UpdateMeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: UpdateMeInput): Promise<UserResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    if (input.password) {
      if (!user.passwordHash) throw new BusinessLogicError('Tu cuenta aún no ha sido activada');
      if (!input.currentPassword) throw new BusinessLogicError('Se requiere la contraseña actual');
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedError('Contraseña actual incorrecta');
      await this.userRepo.updatePassword(input.userId, await bcrypt.hash(input.password, 12));
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing) throw new ConflictError('El email ya está en uso');
    }

    const updateData: UserUpdateData = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;

    if (Object.keys(updateData).length > 0) {
      const updated = await this.userRepo.update(input.userId, updateData);
      return toUserResult(updated);
    }

    return toUserResult(user);
  }
}
