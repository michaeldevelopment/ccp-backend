import crypto from 'crypto';
import { Role } from '@prisma/client';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IActivationTokenRepository } from '@domain/user/repositories/IActivationTokenRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { ConflictError } from '@domain/shared/errors';
import { logger } from '@config/logger';
import { UserResult, toUserResult } from './userResult';
import { env } from '@config/env';

interface CreateUserInput {
  email: string;
  role: Role;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly activationTokenRepo: IActivationTokenRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: CreateUserInput): Promise<UserResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError('Ya existe un usuario con ese email');

    const user = await this.userRepo.create({ email: input.email, role: input.role });

    const token = crypto.randomUUID();
    await this.activationTokenRepo.create({ userId: user.id, token });

    const activationLink = `${env.FRONTEND_URL}/activate?token=${token}`;

    try {
      await this.emailService.sendActivationEmail(user.email, activationLink);
    } catch (err) {
      logger.error({ message: 'Error al enviar email de activación', error: err });
    }

    return toUserResult(user);
  }
}
