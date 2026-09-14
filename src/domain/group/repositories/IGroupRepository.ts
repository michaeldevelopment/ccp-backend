import { Group } from '@domain/group/entities/Group';
import { User } from '@domain/user/entities/User';

export interface GroupFilters {
  name?: string;
  moduleNumber?: number;
}

export interface GroupWithStudents {
  group: Group;
  students: User[];
}

export interface GroupWithStudentIds {
  group: Group;
  studentIds: string[];
}

export interface UpdateUnlockedModulesOpts {
  retreatedModule?: number;
}

export interface IGroupRepository {
  findById(id: string): Promise<Group | null>;
  findMany(filters: GroupFilters): Promise<GroupWithStudentIds[]>;
  findByIdWithStudents(id: string): Promise<GroupWithStudents | null>;
  findStudentIds(groupId: string): Promise<string[]>;
  findActiveStudentIds(groupId: string): Promise<string[]>;
  create(data: {
    name: string;
    entryModule: number;
    unlockedModules: number[];
    studentIds: string[];
  }): Promise<Group>;
  update(
    id: string,
    data: { name?: string; entryModule?: number; unlockedModules?: number[] }
  ): Promise<Group>;
  delete(id: string): Promise<void>;
  hasStudents(id: string): Promise<boolean>;
  updateUnlockedModules(
    id: string,
    modules: number[],
    opts?: UpdateUnlockedModulesOpts
  ): Promise<Group>;
  advanceModule(id: string, newModules: number[]): Promise<Group>;
}
