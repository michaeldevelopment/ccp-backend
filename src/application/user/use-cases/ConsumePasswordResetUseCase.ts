import bcrypt from 'bcryptjs';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IPasswordResetTokenRepository } from '@domain/user/repositories/IPasswordResetTokenRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';

interface ConsumePasswordResetInput {
  token: string;
  newPassword: string;
}

export class ConsumePasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetTokenRepo: IPasswordResetTokenRepository
  ) {}

  async execute(input: ConsumePasswordResetInput): Promise<void> {
    const record = await this.passwordResetTokenRepo.findByToken(input.token);
    if (!record) throw new NotFoundError('Token inválido o no encontrado');

    if (record.usedAt !== null) {
      throw new BusinessLogicError('El token ya fue utilizado');
    }

    if (record.expiresAt < new Date()) {
      throw new BusinessLogicError('El token ha expirado');
    }

    const newHash = await bcrypt.hash(input.newPassword, 12);
    await this.userRepo.updatePassword(record.userId, newHash);
    await this.passwordResetTokenRepo.markAsUsed(record.id);
  }
}
