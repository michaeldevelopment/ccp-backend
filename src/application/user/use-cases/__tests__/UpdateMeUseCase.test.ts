import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMeUseCase } from '@application/user/use-cases/UpdateMeUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import {
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  BusinessLogicError,
} from '@domain/shared/errors';
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

function makeUser(overrides: Partial<{ passwordHash: string | null; email: string }> = {}): User {
  return new User({
    id: 'user-1',
    email: overrides.email ?? 'a@b.com',
    name: 'Test',
    passwordHash: overrides.passwordHash !== undefined ? overrides.passwordHash : '$hash',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpdateMeUseCase', () => {
  let userRepo: IUserRepository;
  let useCase: UpdateMeUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    useCase = new UpdateMeUseCase(userRepo);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('$new-hash' as never);
    vi.mocked(userRepo.update).mockResolvedValue(makeUser());
  });

  it('updates name only', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser());
    await useCase.execute({ userId: 'user-1', name: 'Alice' });
    expect(userRepo.update).toHaveBeenCalledWith('user-1', { name: 'Alice' });
  });

  it('updates password when currentPassword is correct', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser());
    await useCase.execute({ userId: 'user-1', password: 'newpass1', currentPassword: 'current' });
    expect(userRepo.updatePassword).toHaveBeenCalledWith('user-1', '$new-hash');
  });

  it('throws UnauthorizedError when currentPassword is wrong', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser());
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      useCase.execute({ userId: 'user-1', password: 'new', currentPassword: 'wrong' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws ConflictError when new email is already taken by another user', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser());
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser({ email: 'taken@b.com' }));
    await expect(useCase.execute({ userId: 'user-1', email: 'taken@b.com' })).rejects.toThrow(
      ConflictError
    );
  });

  it('allows setting email to the same value (no conflict)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser());
    await useCase.execute({ userId: 'user-1', email: 'a@b.com' });
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('throws BusinessLogicError when passwordHash is null', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ passwordHash: null }));
    await expect(
      useCase.execute({ userId: 'user-1', password: 'new', currentPassword: 'x' })
    ).rejects.toThrow(BusinessLogicError);
  });

  it('throws NotFoundError when user not found', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'ghost', name: 'X' })).rejects.toThrow(NotFoundError);
  });
});
