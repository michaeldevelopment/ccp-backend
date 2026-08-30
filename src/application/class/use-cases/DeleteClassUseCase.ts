import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { NotFoundError } from '@domain/shared/errors';

export class DeleteClassUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  async execute(input: { classId: string }): Promise<void> {
    const cls = await this.classRepo.findById(input.classId);
    if (!cls) throw new NotFoundError('Clase no encontrada');
    await this.classRepo.delete(input.classId);
  }
}
