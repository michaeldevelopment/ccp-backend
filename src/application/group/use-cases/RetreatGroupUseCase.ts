import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { GroupResult, toGroupResult } from './groupResult';

export class RetreatGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: { groupId: string }): Promise<GroupResult> {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group) throw new NotFoundError('Grupo no encontrado');

    if (!group.canRetreat()) {
      throw new BusinessLogicError('El grupo ya está en el módulo inicial');
    }

    const current = group.currentModule();
    const newModules = group.unlockedModules.slice(0, -1);
    const updated = await this.groupRepo.updateUnlockedModules(input.groupId, newModules, {
      retreatedModule: current,
    });

    const studentIds = await this.groupRepo.findStudentIds(input.groupId);
    return toGroupResult(updated, studentIds);
  }
}
