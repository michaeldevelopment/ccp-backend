import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvanceGroupUseCase } from '@application/group/use-cases/AdvanceGroupUseCase';
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

describe('AdvanceGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let useCase: AdvanceGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    useCase = new AdvanceGroupUseCase(groupRepo);
  });

  it('advances to next module', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3]));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([1, 2, 3, 4]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith('group-1', [1, 2, 3, 4], false);
  });

  it('throws BusinessLogicError when already at module 9', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.advanceModule).not.toHaveBeenCalled();
  });

  it('calls advanceModule with triggerReassignment=true when advancing to module 9', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8]));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith(
      'group-1',
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      true
    );
  });

  it('calls advanceModule with triggerReassignment=false when advancing to module 8', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7]));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith(
      'group-1',
      [1, 2, 3, 4, 5, 6, 7, 8],
      false
    );
  });

  it('throws NotFoundError when group does not exist', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
