import { Prisma, Role, UserStatus } from '@prisma/client';
import {
  IUserRepository,
  UserFilters,
  UserUpdateData,
} from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { ConflictError } from '@domain/shared/errors';
import { prisma } from './client';

type PrismaUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

function toUser(raw: PrismaUser): User {
  return new User({
    id: raw.id,
    email: raw.email,
    name: raw.name,
    passwordHash: raw.passwordHash,
    refreshTokenHash: raw.refreshTokenHash,
    role: raw.role,
    status: raw.status,
    groupId: raw.groupId,
    entryModule: raw.entryModule,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id } });
    return raw ? toUser(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { email } });
    return raw ? toUser(raw) : null;
  }

  async findByRefreshTokenHash(
    hash: string
  ): Promise<{ user: User; refreshTokenExpiresAt: Date | null } | null> {
    const raw = await prisma.user.findFirst({ where: { refreshTokenHash: hash } });
    return raw ? { user: toUser(raw), refreshTokenExpiresAt: raw.refreshTokenExpiresAt } : null;
  }

  async updateRefreshTokenHash(
    userId: string,
    hash: string | null,
    expiresAt?: Date | null
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash, refreshTokenExpiresAt: expiresAt ?? null },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { status } });
  }

  async activateUserComplete(
    userId: string,
    tokenId: string,
    data: {
      name: string;
      passwordHash: string;
      refreshTokenHash: string;
      refreshTokenExpiresAt: Date;
    }
  ): Promise<User> {
    const [raw] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          passwordHash: data.passwordHash,
          status: 'ACTIVE',
          refreshTokenHash: data.refreshTokenHash,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt,
        },
      }),
      prisma.activationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
    ]);
    return toUser(raw);
  }

  async create(data: { email: string; role: Role }): Promise<User> {
    try {
      const raw = await prisma.user.create({ data });
      return toUser(raw);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Ya existe un usuario con ese email');
      }
      throw err;
    }
  }

  async findMany(filters: UserFilters): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: {
        ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
        ...(filters.email && { email: { contains: filters.email, mode: 'insensitive' } }),
        ...(filters.groupId !== undefined && { groupId: filters.groupId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toUser);
  }

  async update(userId: string, data: UserUpdateData): Promise<User> {
    const raw = await prisma.user.update({ where: { id: userId }, data });
    return toUser(raw);
  }

  async delete(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  }

  async countByRole(role: Role): Promise<number> {
    return prisma.user.count({ where: { role } });
  }
}
