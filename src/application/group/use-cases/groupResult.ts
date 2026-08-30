import { Group } from '@domain/group/entities/Group';

export interface GroupResult {
  id: string;
  name: string;
  entryModule: number;
  unlockedModules: number[];
  currentModule: number;
  students: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export function toGroupResult(group: Group, studentIds: string[] = []): GroupResult {
  return {
    id: group.id,
    name: group.name,
    entryModule: group.entryModule,
    unlockedModules: group.unlockedModules,
    currentModule: group.currentModule(),
    students: studentIds.map((id) => ({ id })),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
