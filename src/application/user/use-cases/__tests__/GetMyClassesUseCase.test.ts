import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMyClassesUseCase } from '@application/user/use-cases/GetMyClassesUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import {
  IStudentContentRepository,
  VisibleClassRecord,
} from '@domain/user/repositories/IStudentContentRepository';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { NotFoundError } from '@domain/shared/errors';

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

function makeContentRepo(): IStudentContentRepository {
  return {
    findUnlockedModules: vi.fn(),
    findVisibleClasses: vi.fn(),
  };
}

function makeUser(accessibleModules: number[]): User {
  return new User({
    id: 'u-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$h',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId: 'g-1',
    entryModule: 3,
    accessibleModules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeVisibleClass(): VisibleClassRecord {
  return {
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    kind: 'VIDEO',
    embedUrl: 'https://player.vimeo.com/video/123',
    complementText: '',
    textBody: null,
    attachments: [],
    publishedAt: new Date(),
    isPublished: true,
    scheduled: false,
    durationMin: null,
  };
}

describe('GetMyClassesUseCase', () => {
  let userRepo: IUserRepository;
  let contentRepo: IStudentContentRepository;
  let useCase: GetMyClassesUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    contentRepo = makeContentRepo();
    useCase = new GetMyClassesUseCase(userRepo, contentRepo);
  });

  it('STUDENT con módulos accesibles → retorna clases con embedUrl y sin vimeoUrl', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser([3, 4, 5]));
    vi.mocked(contentRepo.findVisibleClasses).mockResolvedValue([makeVisibleClass()]);

    const result = await useCase.execute({ userId: 'u-1' });

    expect(result).toHaveLength(1);
    expect(result[0].embedUrl).toBe('https://player.vimeo.com/video/123');
    expect(result[0]).not.toHaveProperty('vimeoUrl');
    expect(contentRepo.findVisibleClasses).toHaveBeenCalledWith([3, 4, 5]);
  });

  it('STUDENT sin módulos accesibles → retorna vacío sin consultar el repositorio', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser([]));

    const result = await useCase.execute({ userId: 'u-1' });

    expect(result).toEqual([]);
    expect(contentRepo.findVisibleClasses).not.toHaveBeenCalled();
  });

  it('usuario no encontrado → NotFoundError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'bad' })).rejects.toThrow(NotFoundError);
  });
});
