import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { GroupResult, toGroupResult } from './groupResult';
import { computeAccessibleModules } from '@domain/user/services/AccessibleModulesService';

interface CreateGroupInput {
  name: string;
  entryModule: number;
  studentIds: string[];
}

export class CreateGroupUseCase {
  constructor(
    private readonly groupRepo: IGroupRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: CreateGroupInput): Promise<GroupResult> {
    const group = await this.groupRepo.create({
      name: input.name,
      entryModule: input.entryModule,
      unlockedModules: [input.entryModule],
      studentIds: input.studentIds,
    });

    const entryModule =
      group.unlockedModules.length > 0 ? Math.min(...group.unlockedModules) : group.entryModule;
    const accessibleModules = computeAccessibleModules(entryModule, group.unlockedModules);

    await Promise.all(
      input.studentIds.map((studentId) =>
        this.userRepo.update(studentId, { entryModule, accessibleModules })
      )
    );

    const studentIds = await this.groupRepo.findStudentIds(group.id);
    return toGroupResult(group, studentIds);
  }
}
