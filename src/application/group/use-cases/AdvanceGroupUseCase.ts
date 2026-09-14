import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { GroupResult, toGroupResult } from './groupResult';

export class AdvanceGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: { groupId: string }): Promise<GroupResult> {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group) throw new NotFoundError('Grupo no encontrado');

    if (!group.canAdvance()) {
      throw new BusinessLogicError('El grupo ya cubrió los 9 módulos');
    }

    const newModules = [...group.unlockedModules, group.nextModule()];
    const updated = await this.groupRepo.advanceModule(input.groupId, newModules);

    const studentIds = await this.groupRepo.findStudentIds(input.groupId);
    return toGroupResult(updated, studentIds);
  }
}
