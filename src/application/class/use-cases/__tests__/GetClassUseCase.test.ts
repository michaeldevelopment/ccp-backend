import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetClassUseCase } from '@application/class/use-cases/GetClassUseCase';
import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { Class } from '@domain/class/entities/Class';
import { User } from '@domain/user/entities/User';
import { Group } from '@domain/group/entities/Group';
import { Role } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@domain/shared/errors';

function makeClassRepo(): IClassRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findDueForPublication: vi.fn(),
    markPublished: vi.fn(),
    findActiveStudentEmailsForModule: vi.fn(),
  };
}

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

function makePublishedClass(moduleNumber = 3): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123',
    attachments: [],
    publishedAt: new Date(Date.now() - 1000),
    isPublished: true,
    notify: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeUnpublishedClass(): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123',
    attachments: [],
    publishedAt: null,
    isPublished: false,
    notify: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeUser(groupId: string | null, entryModule: number | null): User {
  return new User({
    id: 'u-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$h',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId,
    entryModule,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeGroup(unlockedModules: number[]): Group {
  return new Group({
    id: 'g-1',
    name: 'G1',
    entryModule: 3,
    unlockedModules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetClassUseCase', () => {
  let classRepo: IClassRepository;
  let userRepo: IUserRepository;
  let groupRepo: IGroupRepository;
  let useCase: GetClassUseCase;

  beforeEach(() => {
    classRepo = makeClassRepo();
    userRepo = makeUserRepo();
    groupRepo = makeGroupRepo();
    useCase = new GetClassUseCase(classRepo, userRepo, groupRepo);
  });

  it('TEACHER: retorna la clase completa sin verificar acceso', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makeUnpublishedClass());
    const result = await useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'TEACHER' });
    expect(result.id).toBe('cls-1');
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  it('COACH: retorna la clase completa sin verificar acceso', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makeUnpublishedClass());
    const result = await useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'COACH' });
    expect(result.id).toBe('cls-1');
  });

  it('STUDENT con módulo desbloqueado y clase publicada → retorna clase con vimeoUrl y embedUrl', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makePublishedClass(3));
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('g-1', 3));
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3, 4, 5]));
    const result = await useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'STUDENT' });
    expect(result.id).toBe('cls-1');
    expect(result.embedUrl).toBe('https://player.vimeo.com/video/123');
    expect(result.vimeoUrl).toBe('https://vimeo.com/123');
  });

  it('TEACHER: retorna clase con vimeoUrl y embedUrl', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makePublishedClass(3));
    const result = await useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'TEACHER' });
    expect(result.vimeoUrl).toBe('https://vimeo.com/123');
    expect(result.embedUrl).toBe('https://player.vimeo.com/video/123');
  });

  it('STUDENT sin módulo desbloqueado → ForbiddenError', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makePublishedClass(6));
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('g-1', 3));
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3, 4, 5]));
    await expect(
      useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'STUDENT' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('STUDENT con clase no publicada → ForbiddenError', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(makeUnpublishedClass());
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser('g-1', 3));
    await expect(
      useCase.execute({ classId: 'cls-1', userId: 'u-1', role: 'STUDENT' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('clase no encontrada → NotFoundError', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ classId: 'bad', userId: 'u-1', role: 'COACH' })).rejects.toThrow(
      NotFoundError
    );
  });
});
