import { Role, UserStatus } from '@prisma/client';
import { User } from '@domain/user/entities/User';

export interface UserBaseData {
  name?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
}

export interface UserFilters extends UserBaseData {
  groupId?: string;
}

export interface UserUpdateData extends UserBaseData {
  groupId?: string | null;
  entryModule?: number | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRefreshTokenHash(
    hash: string
  ): Promise<{ user: User; refreshTokenExpiresAt: Date | null } | null>;
  updateRefreshTokenHash(
    userId: string,
    hash: string | null,
    expiresAt?: Date | null
  ): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  updateStatus(userId: string, status: UserStatus): Promise<void>;
  activateUserComplete(
    userId: string,
    tokenId: string,
    data: {
      name: string;
      passwordHash: string;
      refreshTokenHash: string;
      refreshTokenExpiresAt: Date;
    }
  ): Promise<User>;
  create(data: { email: string; role: Role }): Promise<User>;
  findMany(filters: UserFilters): Promise<User[]>;
  update(userId: string, data: UserUpdateData): Promise<User>;
  delete(userId: string): Promise<void>;
  countByRole(role: Role): Promise<number>;
}
