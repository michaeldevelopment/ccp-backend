import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateGroupUseCase } from '@application/group/use-cases/CreateGroupUseCase';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { Group } from '@domain/group/entities/Group';

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

function makeGroup(
  overrides: Partial<{ entryModule: number; unlockedModules: number[] }> = {}
): Group {
  return new Group({
    id: 'group-1',
    name: 'Grupo A',
    entryModule: overrides.entryModule ?? 1,
    unlockedModules: overrides.unlockedModules ?? [1],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let userRepo: IUserRepository;
  let useCase: CreateGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    userRepo = makeUserRepo();
    useCase = new CreateGroupUseCase(groupRepo, userRepo);
    vi.mocked(groupRepo.create).mockResolvedValue(makeGroup());
  });

  it('creates group with unlockedModules starting at entryModule', async () => {
    await useCase.execute({ name: 'Grupo A', entryModule: 1, studentIds: [] });
    expect(groupRepo.create).toHaveBeenCalledWith({
      name: 'Grupo A',
      entryModule: 1,
      unlockedModules: [1],
      studentIds: [],
    });
  });

  it('passes studentIds to the repository', async () => {
    await useCase.execute({ name: 'Grupo A', entryModule: 3, studentIds: ['s-1', 's-2'] });
    const arg = vi.mocked(groupRepo.create).mock.calls[0][0];
    expect(arg.studentIds).toEqual(['s-1', 's-2']);
    expect(arg.unlockedModules).toEqual([3]);
  });

  it('returns a GroupResult with currentModule equal to entryModule', async () => {
    vi.mocked(groupRepo.create).mockResolvedValue(
      makeGroup({ entryModule: 4, unlockedModules: [4] })
    );
    const result = await useCase.execute({ name: 'Grupo B', entryModule: 4, studentIds: [] });
    expect(result.currentModule).toBe(4);
    expect(result.entryModule).toBe(4);
  });
});
