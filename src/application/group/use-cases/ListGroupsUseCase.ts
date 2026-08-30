import { IGroupRepository, GroupFilters } from '@domain/group/repositories/IGroupRepository';
import { GroupResult, toGroupResult } from './groupResult';

export class ListGroupsUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(filters: GroupFilters): Promise<GroupResult[]> {
    const rows = await this.groupRepo.findMany(filters);
    return rows.map(({ group, studentIds }) => toGroupResult(group, studentIds));
  }
}
