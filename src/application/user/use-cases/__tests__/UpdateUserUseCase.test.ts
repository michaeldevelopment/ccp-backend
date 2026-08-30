import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateUserUseCase } from '@application/user/use-cases/UpdateUserUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '@domain/shared/errors';

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

function makeGroupRepo(): IGroupRepository {
  return {
    findById: vi.fn(),
    findMany: vi.fn(),
    findByIdWithStudents: vi.fn(),
    findStudentIds: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    hasStudents: vi.fn(),
    updateUnlockedModules: vi.fn(),
    advanceModule: vi.fn(),
  };
}

function makeUser(role: Role = Role.STUDENT): User {
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

describe('UpdateUserUseCase', () => {
  let userRepo: IUserRepository;
  let groupRepo: IGroupRepository;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    groupRepo = makeGroupRepo();
    useCase = new UpdateUserUseCase(userRepo, groupRepo);
    vi.mocked(userRepo.update).mockResolvedValue(makeUser());
  });

  it('updates a student when caller is coach', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.STUDENT));
    await useCase.execute({ callerId: 'c1', callerRole: 'COACH', userId: 'user-1', name: 'Alice' });
    expect(userRepo.update).toHaveBeenCalled();
  });

  it('throws ForbiddenError when teacher tries to update a coach', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.COACH));
    await expect(
      useCase.execute({ callerId: 'c1', callerRole: 'TEACHER', userId: 'user-1', name: 'X' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when teacher tries to update another teacher', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.TEACHER));
    await expect(
      useCase.execute({ callerId: 'c1', callerRole: 'TEACHER', userId: 'user-1', name: 'X' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ValidationError when status PENDING_ACTIVATION is set manually', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.STUDENT));
    await expect(
      useCase.execute({
        callerId: 'c1',
        callerRole: 'COACH',
        userId: 'user-1',
        status: 'PENDING_ACTIVATION',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when setting GRADUATED on a teacher', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.TEACHER));
    await expect(
      useCase.execute({
        callerId: 'c1',
        callerRole: 'COACH',
        userId: 'user-1',
        status: 'GRADUATED',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when setting PENDING_REASSIGNMENT on a teacher', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.TEACHER));
    await expect(
      useCase.execute({
        callerId: 'c1',
        callerRole: 'COACH',
        userId: 'user-1',
        status: 'PENDING_REASSIGNMENT',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when assigning groupId to a teacher', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.TEACHER));
    await expect(
      useCase.execute({
        callerId: 'c1',
        callerRole: 'COACH',
        userId: 'user-1',
        groupId: 'some-uuid',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when changing role to TEACHER with GRADUATED status', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.STUDENT));
    await expect(
      useCase.execute({
        callerId: 'c1',
        callerRole: 'COACH',
        userId: 'user-1',
        role: Role.TEACHER,
        status: 'GRADUATED',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(
      useCase.execute({ callerId: 'c1', callerRole: 'COACH', userId: 'ghost' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when teacher tries to change role', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(Role.STUDENT));
    await expect(
      useCase.execute({ callerId: 'c1', callerRole: 'TEACHER', userId: 'user-1', role: Role.COACH })
    ).rejects.toThrow(ForbiddenError);
  });
});
