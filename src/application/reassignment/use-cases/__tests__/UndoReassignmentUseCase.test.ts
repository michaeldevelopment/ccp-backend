import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UndoReassignmentUseCase } from '@application/reassignment/use-cases/UndoReassignmentUseCase';
import {
  IReassignmentRepository,
  ReassignmentRecord,
} from '@domain/reassignment/repositories/IReassignmentRepository';
import { ConflictError, BusinessLogicError, NotFoundError } from '@domain/shared/errors';

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

function makeReassignment(status: ReassignmentRecord['status']): ReassignmentRecord {
  return {
    id: 'ra-1',
    userId: 'u-1',
    status,
    createdAt: new Date(),
    resolvedAt: status !== 'PENDING' ? new Date() : null,
  };
}

describe('UndoReassignmentUseCase', () => {
  let reassignmentRepo: IReassignmentRepository;
  let useCase: UndoReassignmentUseCase;

  beforeEach(() => {
    reassignmentRepo = makeReassignmentRepo();
    useCase = new UndoReassignmentUseCase(reassignmentRepo);
    vi.mocked(reassignmentRepo.undoResolution).mockResolvedValue(undefined);
    vi.mocked(reassignmentRepo.findByIdWithUser).mockResolvedValue({
      id: 'ra-1',
      userId: 'u-1',
      status: 'UNDONE',
      createdAt: new Date(),
      resolvedAt: null,
      user: { id: 'u-1', name: 'Test', email: 't@e.com', entryModule: 1, groupId: null },
    });
  });

  it('status=UNDONE → ConflictError (409)', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('UNDONE'));
    await expect(useCase.execute({ reassignmentId: 'ra-1' })).rejects.toThrow(ConflictError);
    expect(reassignmentRepo.undoResolution).not.toHaveBeenCalled();
  });

  it('status=PENDING → BusinessLogicError (nada que deshacer)', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('PENDING'));
    await expect(useCase.execute({ reassignmentId: 'ra-1' })).rejects.toThrow(BusinessLogicError);
    expect(reassignmentRepo.undoResolution).not.toHaveBeenCalled();
  });

  it('status=RESOLVED → llama undoResolution con wasResolved=true', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('RESOLVED'));
    await useCase.execute({ reassignmentId: 'ra-1' });
    expect(reassignmentRepo.undoResolution).toHaveBeenCalledWith('ra-1', 'u-1', true);
  });

  it('status=GRADUATED → llama undoResolution con wasResolved=false', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(makeReassignment('GRADUATED'));
    await useCase.execute({ reassignmentId: 'ra-1' });
    expect(reassignmentRepo.undoResolution).toHaveBeenCalledWith('ra-1', 'u-1', false);
  });

  it('reasignación no encontrada → NotFoundError', async () => {
    vi.mocked(reassignmentRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ reassignmentId: 'bad' })).rejects.toThrow(NotFoundError);
  });
});
