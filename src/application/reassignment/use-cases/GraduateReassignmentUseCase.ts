import { IReassignmentRepository } from '@domain/reassignment/repositories/IReassignmentRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { ReassignmentResult, toReassignmentResult } from './reassignmentResult';

export class GraduateReassignmentUseCase {
  constructor(private readonly reassignmentRepo: IReassignmentRepository) {}

  async execute(input: { reassignmentId: string }): Promise<ReassignmentResult> {
    const reassignment = await this.reassignmentRepo.findById(input.reassignmentId);
    if (!reassignment) throw new NotFoundError('Reasignación no encontrada');

    if (reassignment.status !== 'PENDING' && reassignment.status !== 'UNDONE') {
      throw new BusinessLogicError('Esta reasignación ya fue resuelta');
    }

    await this.reassignmentRepo.graduateUser(input.reassignmentId, reassignment.userId);

    const updated = await this.reassignmentRepo.findByIdWithUser(input.reassignmentId);
    if (!updated) throw new NotFoundError('Reasignación no encontrada');
    return toReassignmentResult(updated);
  }
}
