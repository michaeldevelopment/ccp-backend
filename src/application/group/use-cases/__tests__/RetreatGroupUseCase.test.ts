import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetreatGroupUseCase } from '@application/group/use-cases/RetreatGroupUseCase';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { Group } from '@domain/group/entities/Group';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';

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

function makeGroup(unlockedModules: number[], entryModule = 1): Group {
  return new Group({
    id: 'group-1',
    name: 'Grupo A',
    entryModule,
    unlockedModules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('RetreatGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let useCase: RetreatGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    useCase = new RetreatGroupUseCase(groupRepo);
  });

  it('removes the current (max) module from unlockedModules', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4]));
    vi.mocked(groupRepo.updateUnlockedModules).mockResolvedValue(makeGroup([1, 2, 3]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.updateUnlockedModules).toHaveBeenCalledWith('group-1', [1, 2, 3]);
  });

  it('throws BusinessLogicError when already at entryModule', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1], 1));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.updateUnlockedModules).not.toHaveBeenCalled();
  });

  it('throws BusinessLogicError when group with entryModule=3 is already at module 3', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3], 3));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
  });

  it('throws NotFoundError when group does not exist', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
