import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import {
  IStudentContentRepository,
  VisibleClassRecord,
} from '@domain/user/repositories/IStudentContentRepository';
import { NotFoundError } from '@domain/shared/errors';

export class GetMyClassesUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly groupRepo: IGroupRepository,
    private readonly contentRepo: IStudentContentRepository
  ) {}

  async execute(input: { userId: string }): Promise<VisibleClassRecord[]> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    if (!user.groupId || user.entryModule === null) return [];

    const group = await this.groupRepo.findById(user.groupId);
    if (!group) return [];

    const entryModule = user.entryModule;
    const accessible = group.unlockedModules.filter((m) => m >= entryModule);
    if (accessible.length === 0) return [];

    return this.contentRepo.findVisibleClasses(accessible);
  }
}
