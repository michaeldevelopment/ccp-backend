import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { checkStudentStatus } from '@presentation/http/middleware/checkStudentStatus';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { ForbiddenError } from '@domain/shared/errors';
import { Role, UserStatus } from '@prisma/client';

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
    findExpiredPaused: vi.fn(),
  };
}

function makeUser(status: string, graduatedAt: Date | null = null): User {
  return new User({
    id: 'u-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$h',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: status as UserStatus,
    groupId: null,
    entryModule: null,
    graduatedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeReq(role: string): Partial<Request> {
  return { user: { id: 'u-1', role } };
}

describe('checkStudentStatus middleware', () => {
  let userRepo: IUserRepository;
  let next: NextFunction;

  beforeEach(() => {
    userRepo = makeUserRepo();
    next = vi.fn();
  });

  it('TEACHER → llama next() sin consultar DB', async () => {
    const middleware = checkStudentStatus(userRepo);
    await middleware(makeReq('TEACHER') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  it('STUDENT ACTIVE → llama next()', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('ACTIVE'));
    const middleware = checkStudentStatus(userRepo);
    await middleware(makeReq('STUDENT') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('STUDENT PAUSED → puede acceder a su contenido previo (llama next)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('PAUSED'));
    const middleware = checkStudentStatus(userRepo);
    await middleware(makeReq('STUDENT') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('STUDENT PENDING_REASSIGNMENT → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('PENDING_REASSIGNMENT'));
    const middleware = checkStudentStatus(userRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
  });

  it('STUDENT GRADUATED sin graduatedAt → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED', null));
    const middleware = checkStudentStatus(userRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('STUDENT GRADUATED dentro de 3 meses → llama next()', async () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 1);
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED', recent));
    const middleware = checkStudentStatus(userRepo);
    await middleware(makeReq('STUDENT') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('STUDENT GRADUATED después de 3 meses → ForbiddenError', async () => {
    const expired = new Date();
    expired.setMonth(expired.getMonth() - 4);
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED', expired));
    const middleware = checkStudentStatus(userRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
  });
});
