import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteGroupUseCase } from '@application/group/use-cases/DeleteGroupUseCase';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { Group } from '@domain/group/entities/Group';
import { NotFoundError, ConflictError } from '@domain/shared/errors';

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

function makeGroup(): Group {
  return new Group({
    id: 'group-1',
    name: 'Grupo A',
    entryModule: 1,
    unlockedModules: [1],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('DeleteGroupUseCase', () => {
  let groupRepo: IGroupRepository;
  let useCase: DeleteGroupUseCase;

  beforeEach(() => {
    groupRepo = makeGroupRepo();
    useCase = new DeleteGroupUseCase(groupRepo);
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup());
  });

  it('deletes group when it has no students', async () => {
    vi.mocked(groupRepo.hasStudents).mockResolvedValue(false);
    await useCase.execute({ groupId: 'group-1' });
    expect(groupRepo.delete).toHaveBeenCalledWith('group-1');
  });

  it('throws ConflictError when group has students', async () => {
    vi.mocked(groupRepo.hasStudents).mockResolvedValue(true);
    await expect(useCase.execute({ groupId: 'group-1' })).rejects.toThrow(ConflictError);
    expect(groupRepo.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when group does not exist', async () => {
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ groupId: 'ghost' })).rejects.toThrow(NotFoundError);
  });
});
