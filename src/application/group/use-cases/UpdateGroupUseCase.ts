import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';
import { GroupResult, toGroupResult } from './groupResult';

interface UpdateGroupInput {
  groupId: string;
  name?: string;
  entryModule?: number;
  unlockedModules?: number[];
}

export class UpdateGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: UpdateGroupInput): Promise<GroupResult> {
    const { groupId, ...data } = input;
    const existing = await this.groupRepo.findById(groupId);
    if (!existing) throw new NotFoundError('Grupo no encontrado');

    if (input.entryModule !== undefined || input.unlockedModules !== undefined) {
      const effectiveEntryModule = input.entryModule ?? existing.entryModule;
      const effectiveUnlockedModules = input.unlockedModules ?? existing.unlockedModules;
      if (effectiveEntryModule > Math.max(...effectiveUnlockedModules)) {
        throw new BusinessLogicError(
          'El módulo de entrada no puede ser mayor al módulo máximo desbloqueado'
        );
      }
    }

    const updated = await this.groupRepo.update(groupId, data);
    const studentIds = await this.groupRepo.findStudentIds(groupId);
    return toGroupResult(updated, studentIds);
  }
}
