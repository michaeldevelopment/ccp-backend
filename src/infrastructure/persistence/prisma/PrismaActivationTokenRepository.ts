import {
  IActivationTokenRepository,
  ActivationTokenRecord,
} from '@domain/user/repositories/IActivationTokenRepository';
import { prisma } from './client';

export class PrismaActivationTokenRepository implements IActivationTokenRepository {
  async findByToken(token: string): Promise<ActivationTokenRecord | null> {
    const raw = await prisma.activationToken.findUnique({
      where: { token },
      include: { user: { select: { email: true } } },
    });
    return raw ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.activationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async create(data: { userId: string; token: string }): Promise<void> {
    await prisma.activationToken.create({ data });
  }
}
