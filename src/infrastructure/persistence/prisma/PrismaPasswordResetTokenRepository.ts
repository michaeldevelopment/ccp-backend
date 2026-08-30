import {
  IPasswordResetTokenRepository,
  PasswordResetTokenRecord,
} from '@domain/user/repositories/IPasswordResetTokenRepository';
import { prisma } from './client';

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async create(data: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    await prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string): Promise<PasswordResetTokenRecord | null> {
    return (await prisma.passwordResetToken.findUnique({ where: { token } })) ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
