import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordUseCase } from '@application/user/use-cases/ChangePasswordUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { NotFoundError, UnauthorizedError, BusinessLogicError } from '@domain/shared/errors';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

function makeUserRepo(): IUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByRefreshTokenHash: vi.fn(),
    updateRefreshTokenHash: vi.fn(),
    updatePassword: vi.fn(),
    updateStatus: vi.fn(),
    activateUserComplete: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByRole: vi.fn(),
  };
}

function makeUser(passwordHash: string | null): User {
  return new User({
    id: 'user-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash,
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ChangePasswordUseCase', () => {
  let userRepo: IUserRepository;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    useCase = new ChangePasswordUseCase(userRepo);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('$new-hash' as never);
  });

  it('updates password when current password is correct', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('$current'));
    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current',
      newPassword: 'newpass1',
    });
    expect(userRepo.updatePassword).toHaveBeenCalledWith('user-1', '$new-hash');
  });

  it('throws UnauthorizedError when current password is wrong', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('$current'));
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'wrong', newPassword: 'new' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: 'x', currentPassword: 'p', newPassword: 'n' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws BusinessLogicError when passwordHash is null (not activated)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(null));
    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'p', newPassword: 'n' })
    ).rejects.toThrow(BusinessLogicError);
  });
});
