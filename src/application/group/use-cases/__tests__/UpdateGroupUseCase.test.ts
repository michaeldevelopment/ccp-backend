import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateGroupUseCase } from '@application/group/use-cases/UpdateGroupUseCase';
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

function makeGroup(entryModule: number, unlockedModules: number[]): Group {
  return new Group({
    id: 'g-1',
    name: 'G1',
    entryModule,
    unlockedModules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpdateGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let useCase: UpdateGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    useCase = new UpdateGroupUseCase(groupRepo);
    vi.mocked(groupRepo.update).mockResolvedValue(makeGroup(1, [1, 2, 3]));
  });

  it('solo actualiza name → no valida entryModule', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(1, [1, 2, 3]));
    await useCase.execute({ groupId: 'g-1', name: 'Nuevo nombre' });
    expect(groupRepo.update).toHaveBeenCalled();
  });

  it('entryModule dentro del rango → OK', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(1, [3, 4, 5]));
    await useCase.execute({ groupId: 'g-1', entryModule: 3 });
    expect(groupRepo.update).toHaveBeenCalled();
  });

  it('entryModule y unlockedModules consistentes → OK', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(1, [1]));
    await useCase.execute({ groupId: 'g-1', entryModule: 3, unlockedModules: [3, 4, 5] });
    expect(groupRepo.update).toHaveBeenCalled();
  });

  it('entryModule mayor al máximo desbloqueado existente → BusinessLogicError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(1, [1, 2, 3]));
    await expect(useCase.execute({ groupId: 'g-1', entryModule: 6 })).rejects.toThrow(
      BusinessLogicError
    );
    expect(groupRepo.update).not.toHaveBeenCalled();
  });

  it('nuevos unlockedModules dejan entryModule existente por encima → BusinessLogicError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(4, [4, 5, 6]));
    await expect(useCase.execute({ groupId: 'g-1', unlockedModules: [1, 2] })).rejects.toThrow(
      BusinessLogicError
    );
    expect(groupRepo.update).not.toHaveBeenCalled();
  });

  it('entryModule y unlockedModules inconsistentes juntos → BusinessLogicError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup(1, [1, 2, 3]));
    await expect(
      useCase.execute({ groupId: 'g-1', entryModule: 5, unlockedModules: [1, 2] })
    ).rejects.toThrow(BusinessLogicError);
    expect(groupRepo.update).not.toHaveBeenCalled();
  });

  it('grupo no encontrado → NotFoundError', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
