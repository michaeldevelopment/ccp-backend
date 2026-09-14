import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListModulesUseCase } from '@application/module/use-cases/ListModulesUseCase';
import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { Module } from '@domain/module/entities/Module';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';

function makeModule(number: number): Module {
  return new Module({
    id: `mod-${number}`,
    number,
    title: `Módulo ${number}`,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeModuleRepo(): IModuleRepository {
  return { findAll: vi.fn(), findByNumber: vi.fn(), update: vi.fn() };
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
    findExpiredPaused: vi.fn(),
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

const ALL_MODULES = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(makeModule);

describe('ListModulesUseCase', () => {
  let moduleRepo: IModuleRepository;
  let userRepo: IUserRepository;
  let useCase: ListModulesUseCase;

  beforeEach(() => {
    moduleRepo = makeModuleRepo();
    userRepo = makeUserRepo();
    useCase = new ListModulesUseCase(moduleRepo, userRepo);
    vi.mocked(moduleRepo.findAll).mockResolvedValue(ALL_MODULES);
  });

  it('COACH: todos los módulos con isUnlocked=true', async () => {
    const result = await useCase.execute({ userId: 'u-1', role: 'COACH' });
    expect(result).toHaveLength(9);
    expect(result.every((m) => m.isUnlocked)).toBe(true);
  });

  it('TEACHER: todos los módulos con isUnlocked=true', async () => {
    const result = await useCase.execute({ userId: 'u-1', role: 'TEACHER' });
    expect(result.every((m) => m.isUnlocked)).toBe(true);
  });

  it('STUDENT sin módulos accesibles: todos con isUnlocked=false', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser([]));
    const result = await useCase.execute({ userId: 'u-1', role: 'STUDENT' });
    expect(result.every((m) => !m.isUnlocked)).toBe(true);
  });

  it('STUDENT con accessibleModules=[3,4,5]', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser([3, 4, 5]));
    const result = await useCase.execute({ userId: 'u-1', role: 'STUDENT' });
    const unlocked = result.filter((m) => m.isUnlocked).map((m) => m.number);
    expect(unlocked).toEqual([3, 4, 5]);
    expect(result.filter((m) => !m.isUnlocked).map((m) => m.number)).toEqual([1, 2, 6, 7, 8, 9]);
  });

  it('STUDENT con accessibleModules=[3,4] (módulos anteriores no accesibles)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser([3, 4]));
    const result = await useCase.execute({ userId: 'u-1', role: 'STUDENT' });
    const unlocked = result.filter((m) => m.isUnlocked).map((m) => m.number);
    expect(unlocked).toEqual([3, 4]);
  });
});
