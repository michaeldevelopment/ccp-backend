import { IProgressRepository, ProgressRecord } from '@domain/user/repositories/IProgressRepository';
import { ForbiddenError } from '@domain/shared/errors';

interface GetProgressInput {
  userId: string;
  classId: string;
  requesterId: string;
  requesterRole: string;
}

export class GetProgressUseCase {
  constructor(private readonly progressRepo: IProgressRepository) {}

  async execute(input: GetProgressInput): Promise<ProgressRecord | null> {
    if (input.requesterRole === 'STUDENT' && input.userId !== input.requesterId) {
      throw new ForbiddenError('Solo puedes consultar tu propio progreso');
    }
    return this.progressRepo.findByUserAndClass(input.userId, input.classId);
  }
}
