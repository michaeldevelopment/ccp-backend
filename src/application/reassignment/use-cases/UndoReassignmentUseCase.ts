import { IReassignmentRepository } from '@domain/reassignment/repositories/IReassignmentRepository';
import { NotFoundError, BusinessLogicError, ConflictError } from '@domain/shared/errors';
import { ReassignmentResult, toReassignmentResult } from './reassignmentResult';

export class UndoReassignmentUseCase {
  constructor(private readonly reassignmentRepo: IReassignmentRepository) {}

  async execute(input: { reassignmentId: string }): Promise<ReassignmentResult> {
    const reassignment = await this.reassignmentRepo.findById(input.reassignmentId);
    if (!reassignment) throw new NotFoundError('Reasignación no encontrada');

    if (reassignment.status === 'UNDONE') {
      throw new ConflictError('Esta reasignación ya fue revertida anteriormente');
    }
    if (reassignment.status === 'PENDING') {
      throw new BusinessLogicError('No hay acción que revertir en esta reasignación');
    }

    await this.reassignmentRepo.undoResolution(
      input.reassignmentId,
      reassignment.userId,
      reassignment.status === 'RESOLVED'
    );

    const updated = await this.reassignmentRepo.findByIdWithUser(input.reassignmentId);
    if (!updated) throw new NotFoundError('Reasignación no encontrada');
    return toReassignmentResult(updated);
  }
}
