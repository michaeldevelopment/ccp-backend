import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { GroupResult, toGroupResult } from './groupResult';

export class AdvanceGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: { groupId: string }): Promise<GroupResult> {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group) throw new NotFoundError('Grupo no encontrado');

    if (!group.canAdvance()) {
      throw new BusinessLogicError('El grupo ya está en el módulo máximo (9)');
    }

    const nextModule = group.currentModule() + 1;
    const updated = await this.groupRepo.advanceModule(
      input.groupId,
      [...group.unlockedModules, nextModule],
      nextModule === 9
    );

    const studentIds = await this.groupRepo.findStudentIds(input.groupId);
    return toGroupResult(updated, studentIds);
  }
}
