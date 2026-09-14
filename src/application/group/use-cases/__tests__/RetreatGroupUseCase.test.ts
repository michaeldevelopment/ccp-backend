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
    findActiveStudentIds: vi.fn().mockResolvedValue([]),
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

  it('remueve el último módulo', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4]));
    vi.mocked(groupRepo.updateUnlockedModules).mockResolvedValue(makeGroup([1, 2, 3]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.updateUnlockedModules).toHaveBeenCalledWith('group-1', [1, 2, 3], {
      retreatedModule: 4,
    });
  });

  it('cruzando wrap (M1 tras M9) remueve el M1', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3, 4, 5, 6, 7, 8, 9, 1], 3));
    vi.mocked(groupRepo.updateUnlockedModules).mockResolvedValue(
      makeGroup([3, 4, 5, 6, 7, 8, 9], 3)
    );
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.updateUnlockedModules).toHaveBeenCalledWith('group-1', [3, 4, 5, 6, 7, 8, 9], {
      retreatedModule: 1,
    });
  });

  it('BusinessLogicError cuando queda solo el entryModule', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1], 1));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.updateUnlockedModules).not.toHaveBeenCalled();
  });

  it('BusinessLogicError cuando el grupo con entryModule=3 tiene solo [3]', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3], 3));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
  });

  it('NotFoundError cuando el grupo no existe', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
