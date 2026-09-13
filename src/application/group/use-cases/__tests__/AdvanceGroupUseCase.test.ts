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

describe('AdvanceGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let useCase: AdvanceGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    useCase = new AdvanceGroupUseCase(groupRepo);
  });

  it('avanza al siguiente módulo (M3 → M4)', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3]));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([1, 2, 3, 4]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith('group-1', [1, 2, 3, 4]);
  });

  it('avanza hasta M9 (M8 → M9)', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8]));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith('group-1', [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('en M9 con entryModule > 1 wrappea a M1', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3, 4, 5, 6, 7, 8, 9], 3));
    vi.mocked(groupRepo.advanceModule).mockResolvedValue(makeGroup([3, 4, 5, 6, 7, 8, 9, 1], 3));
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.advanceModule).toHaveBeenCalledWith('group-1', [3, 4, 5, 6, 7, 8, 9, 1]);
  });

  it('con los 9 módulos cubiertos (empezó en M1) → BusinessLogicError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.advanceModule).not.toHaveBeenCalled();
  });

  it('con los 9 módulos cubiertos vía wrap (empezó en M3) → BusinessLogicError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup([3, 4, 5, 6, 7, 8, 9, 1, 2], 3));
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.advanceModule).not.toHaveBeenCalled();
  });

  it('NotFoundError cuando el grupo no existe', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
