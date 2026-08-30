import { IReassignmentRepository } from '@domain/reassignment/repositories/IReassignmentRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { ReassignmentResult, toReassignmentResult } from './reassignmentResult';

interface ResolveInput {
  reassignmentId: string;
  groupId: string;
}

export class ResolveReassignmentUseCase {
  constructor(
    private readonly reassignmentRepo: IReassignmentRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: ResolveInput): Promise<ReassignmentResult> {
    const reassignment = await this.reassignmentRepo.findById(input.reassignmentId);
    if (!reassignment) throw new NotFoundError('Reasignación no encontrada');

    if (reassignment.status !== 'PENDING' && reassignment.status !== 'UNDONE') {
      throw new BusinessLogicError('Esta reasignación ya fue resuelta');
    }

    const group = await this.groupRepo.findById(input.groupId);
    if (!group) throw new NotFoundError('Grupo no encontrado');

    const entryModule =
      group.unlockedModules.length > 0 ? Math.min(...group.unlockedModules) : group.entryModule;

    await this.reassignmentRepo.resolveAndActivateUser(
      input.reassignmentId,
      reassignment.userId,
      input.groupId,
      entryModule
    );

    const updated = await this.reassignmentRepo.findByIdWithUser(input.reassignmentId);
    if (!updated) throw new NotFoundError('Reasignación no encontrada');
    return toReassignmentResult(updated);
  }
}
