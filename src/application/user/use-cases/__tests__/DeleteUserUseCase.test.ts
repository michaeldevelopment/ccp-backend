import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteUserUseCase } from '@application/user/use-cases/DeleteUserUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { NotFoundError, ConflictError } from '@domain/shared/errors';

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

function makeUser(role: Role): User {
  return new User({
    id: 'user-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$hash',
    refreshTokenHash: null,
    role,
    status: 'ACTIVE',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('DeleteUserUseCase', () => {
  let userRepo: IUserRepository;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    useCase = new DeleteUserUseCase(userRepo);
  });

  it('deletes a teacher without checking coach count', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.TEACHER));
    await useCase.execute({ userId: 'user-1' });
    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
    expect(userRepo.countByRole).not.toHaveBeenCalled();
  });

  it('deletes a student without checking coach count', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.STUDENT));
    await useCase.execute({ userId: 'user-1' });
    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
    expect(userRepo.countByRole).not.toHaveBeenCalled();
  });

  it('deletes a coach when more than one coach exists', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.COACH));
    vi.mocked(userRepo.countByRole).mockResolvedValue(2);
    await useCase.execute({ userId: 'user-1' });
    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws ConflictError when deleting the last coach', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.COACH));
    vi.mocked(userRepo.countByRole).mockResolvedValue(1);
    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(ConflictError);
    expect(userRepo.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
