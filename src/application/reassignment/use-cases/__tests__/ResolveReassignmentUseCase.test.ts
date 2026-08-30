import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResolveReassignmentUseCase } from '@application/reassignment/use-cases/ResolveReassignmentUseCase';
import {
  IReassignmentRepository,
  ReassignmentRecord,
} from '@domain/reassignment/repositories/IReassignmentRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { Group } from '@domain/group/entities/Group';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';

function makeReassignmentRepo(): IReassignmentRepository {
  return {
    findById: vi.fn(),
    findByIdWithUser: vi.fn(),
    findByUserId: vi.fn(),
    findPending: vi.fn(),
    updateStatus: vi.fn(),
    resolveAndActivateUser: vi.fn(),
    graduateUser: vi.fn(),
    undoResolution: vi.fn(),
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

function makeReassignment(status: ReassignmentRecord['status']): ReassignmentRecord {
  return { id: 'ra-1', userId: 'u-1', status, createdAt: new Date(), resolvedAt: null };
}

function makeGroup(): Group {
  return new Group({
    id: 'g-2',
    name: 'Grupo B',
    entryModule: 1,
    unlockedModules: [1, 2, 3],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ResolveReassignmentUseCase', () => {
  let reassignmentRepo: IReassignmentRepository;
  let groupRepo: IGroupRepository;
  let useCase: ResolveReassignmentUseCase;

  beforeEach(() => {
    reassignmentRepo = makeReassignmentRepo();
    groupRepo = makeGroupRepo();
    useCase = new ResolveReassignmentUseCase(reassignmentRepo, groupRepo);
    vi.mocked(reassignmentRepo.resolveAndActivateUser).mockResolvedValue(undefined);
    vi.mocked(reassignmentRepo.findByIdWithUser).mockResolvedValue({
      id: 'ra-1',
      userId: 'u-1',
      status: 'RESOLVED',
      createdAt: new Date(),
      resolvedAt: new Date(),
      user: { id: 'u-1', name: 'Test', email: 't@e.com', entryModule: 1, groupId: 'g-2' },
    });
    vi.mocked(groupRepo.findById).mockResolvedValue(makeGroup());
  });

  it('PENDING → llama resolveAndActivateUser de forma atómica', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('PENDING'));
    await useCase.execute({ reassignmentId: 'ra-1', groupId: 'g-2' });
    expect(reassignmentRepo.resolveAndActivateUser).toHaveBeenCalledWith('ra-1', 'u-1', 'g-2', 1);
  });

  it('UNDONE → también puede resolver (segundo intento)', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('UNDONE'));
    await useCase.execute({ reassignmentId: 'ra-1', groupId: 'g-2' });
    expect(reassignmentRepo.resolveAndActivateUser).toHaveBeenCalledWith('ra-1', 'u-1', 'g-2', 1);
  });

  it('RESOLVED → BusinessLogicError', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('RESOLVED'));
    await expect(useCase.execute({ reassignmentId: 'ra-1', groupId: 'g-2' })).rejects.toThrow(
      BusinessLogicError
    );
  });

  it('grupo no encontrado → NotFoundError', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('PENDING'));
    vi.mocked(groupRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ reassignmentId: 'ra-1', groupId: 'bad' })).rejects.toThrow(
      NotFoundError
    );
  });

  it('reasignación no encontrada → NotFoundError', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ reassignmentId: 'bad', groupId: 'g-2' })).rejects.toThrow(
      NotFoundError
    );
  });
});
