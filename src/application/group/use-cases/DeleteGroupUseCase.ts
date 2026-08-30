import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, ConflictError } from '@domain/shared/errors';

export class DeleteGroupUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(input: { groupId: string }): Promise<void> {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group) throw new NotFoundError('Grupo no encontrado');

    const hasStudents = await this.groupRepo.hasStudents(input.groupId);
    if (hasStudents)
      throw new ConflictError('No se puede eliminar un grupo que tiene estudiantes asignados');

    await this.groupRepo.delete(input.groupId);
  }
}
