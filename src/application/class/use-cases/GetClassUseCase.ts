import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, ForbiddenError } from '@domain/shared/errors';
import { ClassResult, toClassResult, toStudentClassResult } from './classResult';

interface GetClassInput {
  classId: string;
  userId: string;
  role: string;
}

export class GetClassUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly userRepo: IUserRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: GetClassInput): Promise<ClassResult> {
    const cls = await this.classRepo.findById(input.classId);
    if (!cls) throw new NotFoundError('Clase no encontrada');

    if (input.role === 'STUDENT') {
      const now = new Date();
      if (!cls.isPublished || !cls.publishedAt || cls.publishedAt > now) {
        throw new ForbiddenError('Clase no disponible');
      }

      const user = await this.userRepo.findById(input.userId);
      if (!user || !user.groupId || user.entryModule === null) {
        throw new ForbiddenError('No tienes acceso a esta clase');
      }

      const group = await this.groupRepo.findById(user.groupId);
      if (!group) throw new ForbiddenError('No tienes acceso a esta clase');

      const accessible = group.unlockedModules.filter((m) => m >= user.entryModule!);
      if (!accessible.includes(cls.moduleNumber)) {
        throw new ForbiddenError('No tienes acceso a esta clase');
      }
    }

    return input.role === 'STUDENT' ? toStudentClassResult(cls) : toClassResult(cls);
  }
}
