import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { checkStudentStatus } from '@presentation/http/middleware/checkStudentStatus';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import {
  IReassignmentRepository,
  ReassignmentRecord,
} from '@domain/reassignment/repositories/IReassignmentRepository';
import { User } from '@domain/user/entities/User';
import { ForbiddenError } from '@domain/shared/errors';
import { Role } from '@prisma/client';

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

function makeReassignmentRepo(): IReassignmentRepository {
  return {
    findById: vi.fn(),
    findByIdWithUser: vi.fn(),
    findByUserId: vi.fn(),
    findPending: vi.fn(),
    updateStatus: vi.fn(),
    resolveAndActivateUser: vi.fn(),
    graduateUser: vi.fn(),
    undoResolution: vi.fn(),
  };
}

function makeUser(status: string): User {
  return new User({
    id: 'u-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$h',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: status as any,
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeReassignment(resolvedAt: Date | null): ReassignmentRecord {
  return { id: 'ra-1', userId: 'u-1', status: 'GRADUATED', createdAt: new Date(), resolvedAt };
}

function makeReq(role: string): Partial<Request> {
  return { user: { id: 'u-1', role } };
}

describe('checkStudentStatus middleware', () => {
  let userRepo: IUserRepository;
  let reassignmentRepo: IReassignmentRepository;
  let next: NextFunction;

  beforeEach(() => {
    userRepo = makeUserRepo();
    reassignmentRepo = makeReassignmentRepo();
    next = vi.fn();
  });

  it('TEACHER → llama next() sin consultar DB', async () => {
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await middleware(makeReq('TEACHER') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  it('STUDENT ACTIVE → llama next()', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('ACTIVE'));
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await middleware(makeReq('STUDENT') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('STUDENT PAUSED → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('PAUSED'));
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('STUDENT PENDING_REASSIGNMENT → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('PENDING_REASSIGNMENT'));
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
  });

  it('STUDENT GRADUATED sin registro de reasignación → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED'));
    vi.mocked(reassignmentRepo.findByUserId).mockResolvedValue(null);
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('STUDENT GRADUATED dentro de 3 meses → llama next()', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED'));
    const recentResolution = new Date();
    recentResolution.setMonth(recentResolution.getMonth() - 1);
    vi.mocked(reassignmentRepo.findByUserId).mockResolvedValue(makeReassignment(recentResolution));
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await middleware(makeReq('STUDENT') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('STUDENT GRADUATED después de 3 meses → ForbiddenError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('GRADUATED'));
    const expiredResolution = new Date();
    expiredResolution.setMonth(expiredResolution.getMonth() - 4);
    vi.mocked(reassignmentRepo.findByUserId).mockResolvedValue(makeReassignment(expiredResolution));
    const middleware = checkStudentStatus(userRepo, reassignmentRepo);
    await expect(middleware(makeReq('STUDENT') as Request, {} as Response, next)).rejects.toThrow(
      ForbiddenError
    );
  });
});
