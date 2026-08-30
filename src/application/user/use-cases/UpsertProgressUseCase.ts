import { IProgressRepository, ProgressRecord } from '@domain/user/repositories/IProgressRepository';
import { ForbiddenError } from '@domain/shared/errors';

interface UpsertProgressInput {
  userId: string;
  classId: string;
  pct: number;
  lastPositionSec: number;
  completed: boolean;
  requesterId: string;
  requesterRole: string;
}

export class UpsertProgressUseCase {
  constructor(private readonly progressRepo: IProgressRepository) {}

  async execute(input: UpsertProgressInput): Promise<ProgressRecord> {
    if (input.requesterRole === 'STUDENT' && input.userId !== input.requesterId) {
      throw new ForbiddenError('Solo puedes actualizar tu propio progreso');
    }
    const pct = input.completed ? 100 : input.pct;
    return this.progressRepo.upsert({
      userId: input.userId,
      classId: input.classId,
      pct,
      lastPositionSec: input.lastPositionSec,
      completed: input.completed,
    });
  }
}
