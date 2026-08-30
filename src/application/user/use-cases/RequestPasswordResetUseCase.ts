import crypto from 'crypto';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IPasswordResetTokenRepository } from '@domain/user/repositories/IPasswordResetTokenRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { logger } from '@config/logger';
import { env } from '@config/env';

interface RequestPasswordResetInput {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetTokenRepo: IPasswordResetTokenRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      logger.debug({ message: 'Password reset requested for unknown email', email: input.email });
      return;
    }

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await this.passwordResetTokenRepo.create({ userId: user.id, token: resetToken, expiresAt });

    const resetLink = `${env.FRONTEND_URL}/auth/password/reset?token=${resetToken}`;

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetLink);
    } catch (err) {
      logger.error({ message: 'Error al enviar email de recuperación de contraseña', error: err });
    }
  }
}
