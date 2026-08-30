import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProgressUseCase } from '@application/user/use-cases/GetProgressUseCase';
import { IProgressRepository, ProgressRecord } from '@domain/user/repositories/IProgressRepository';
import { ForbiddenError } from '@domain/shared/errors';

function makeProgressRepo(): IProgressRepository {
  return {
    findByUserId: vi.fn(),
    findByUserAndClass: vi.fn(),
    upsert: vi.fn(),
    findByUserIdWithClass: vi.fn(),
  };
}

function makeRecord(): ProgressRecord {
  return {
    id: 'p-1',
    userId: 'u-1',
    classId: 'c-1',
    pct: 50,
    lastPositionSec: 120,
    completed: false,
    updatedAt: new Date(),
  };
}

describe('GetProgressUseCase', () => {
  let progressRepo: IProgressRepository;
  let useCase: GetProgressUseCase;

  beforeEach(() => {
    progressRepo = makeProgressRepo();
    useCase = new GetProgressUseCase(progressRepo);
    vi.mocked(progressRepo.findByUserAndClass).mockResolvedValue(makeRecord());
  });

  it('STUDENT consulta su propio progreso → retorna registro', async () => {
    const result = await useCase.execute({
      userId: 'u-1',
      classId: 'c-1',
      requesterId: 'u-1',
      requesterRole: 'STUDENT',
    });
    expect(result?.id).toBe('p-1');
    expect(progressRepo.findByUserAndClass).toHaveBeenCalledWith('u-1', 'c-1');
  });

  it('STUDENT intenta ver progreso ajeno → ForbiddenError', async () => {
    await expect(
      useCase.execute({
        userId: 'u-2',
        classId: 'c-1',
        requesterId: 'u-1',
        requesterRole: 'STUDENT',
      })
    ).rejects.toThrow(ForbiddenError);
    expect(progressRepo.findByUserAndClass).not.toHaveBeenCalled();
  });

  it('TEACHER puede ver progreso de cualquier usuario', async () => {
    const result = await useCase.execute({
      userId: 'u-2',
      classId: 'c-1',
      requesterId: 'u-1',
      requesterRole: 'TEACHER',
    });
    expect(result?.id).toBe('p-1');
  });

  it('COACH puede ver progreso de cualquier usuario', async () => {
    const result = await useCase.execute({
      userId: 'u-2',
      classId: 'c-1',
      requesterId: 'u-1',
      requesterRole: 'COACH',
    });
    expect(result?.id).toBe('p-1');
  });

  it('retorna null cuando no existe el registro', async () => {
    vi.mocked(progressRepo.findByUserAndClass).mockResolvedValue(null);
    const result = await useCase.execute({
      userId: 'u-1',
      classId: 'c-1',
      requesterId: 'u-1',
      requesterRole: 'STUDENT',
    });
    expect(result).toBeNull();
  });
});
