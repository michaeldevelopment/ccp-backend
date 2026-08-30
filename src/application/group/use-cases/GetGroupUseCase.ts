import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError } from '@domain/shared/errors';
import { GroupResult, toGroupResult } from './groupResult';

export class GetGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: { groupId: string }): Promise<GroupResult> {
    const result = await this.groupRepo.findByIdWithStudents(input.groupId);
    if (!result) throw new NotFoundError('Grupo no encontrado');
    return toGroupResult(
      result.group,
      result.students.map((s) => s.id)
    );
  }
}
