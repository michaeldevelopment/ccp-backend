import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpsertProgressUseCase } from '@application/user/use-cases/UpsertProgressUseCase';
import { IProgressRepository, ProgressRecord } from '@domain/user/repositories/IProgressRepository';
import { ForbiddenError } from '@domain/shared/errors';

function makeProgressRepo(): IProgressRepository {
  return {
    findByUserId: vi.fn(),
    findByUserAndClass: vi.fn(),
    upsert: vi.fn(),
    findModuleProgressForUser: vi.fn(),
  };
}

function makeRecord(pct: number, completed: boolean): ProgressRecord {
  return {
    id: 'p-1',
    userId: 'u-1',
    classId: 'c-1',
    pct,
    lastPositionSec: 0,
    completed,
    updatedAt: new Date(),
  };
}

describe('UpsertProgressUseCase', () => {
  let progressRepo: IProgressRepository;
  let useCase: UpsertProgressUseCase;

  beforeEach(() => {
    progressRepo = makeProgressRepo();
    useCase = new UpsertProgressUseCase(progressRepo);
  });

  it('completed=true con pct=50 → guarda pct=100', async () => {
    vi.mocked(progressRepo.upsert).mockResolvedValue(makeRecord(100, true));
    await useCase.execute({
      userId: 'u-1',
      classId: 'c-1',
      pct: 50,
      lastPositionSec: 0,
      completed: true,
      requesterId: 'u-1',
      requesterRole: 'STUDENT',
    });
    expect(progressRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ pct: 100, completed: true })
    );
  });

  it('completed=false conserva el pct original', async () => {
    vi.mocked(progressRepo.upsert).mockResolvedValue(makeRecord(70, false));
    await useCase.execute({
      userId: 'u-1',
      classId: 'c-1',
      pct: 70,
      lastPositionSec: 200,
      completed: false,
      requesterId: 'u-1',
      requesterRole: 'STUDENT',
    });
    expect(progressRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ pct: 70, completed: false })
    );
  });

  it('STUDENT intenta actualizar progreso ajeno → ForbiddenError', async () => {
    await expect(
      useCase.execute({
        userId: 'u-2',
        classId: 'c-1',
        pct: 50,
        lastPositionSec: 0,
        completed: false,
        requesterId: 'u-1',
        requesterRole: 'STUDENT',
      })
    ).rejects.toThrow(ForbiddenError);
    expect(progressRepo.upsert).not.toHaveBeenCalled();
  });
});
