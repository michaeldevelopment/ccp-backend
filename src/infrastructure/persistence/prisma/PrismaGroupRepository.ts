import { User as DbUser } from '@prisma/client';
import {
  IGroupRepository,
  GroupFilters,
  GroupWithStudents,
  GroupWithStudentIds,
  UpdateUnlockedModulesOpts,
} from '@domain/group/repositories/IGroupRepository';
import { Group } from '@domain/group/entities/Group';
import { User } from '@domain/user/entities/User';
import { prisma } from './client';

type PrismaGroup = NonNullable<Awaited<ReturnType<typeof prisma.group.findUnique>>>;

function toGroup(raw: PrismaGroup): Group {
  return new Group({
    id: raw.id,
    name: raw.name,
    entryModule: raw.entryModule,
    unlockedModules: raw.unlockedModules,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

function toUser(raw: DbUser): User {
  return new User({
    id: raw.id,
    email: raw.email,
    name: raw.name,
    passwordHash: raw.passwordHash,
    refreshTokenHash: raw.refreshTokenHash,
    role: raw.role,
    status: raw.status,
    groupId: raw.groupId,
    entryModule: raw.entryModule,
    accessibleModules: raw.accessibleModules,
    completedModules: raw.completedModules,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaGroupRepository implements IGroupRepository {
  async findById(id: string): Promise<Group | null> {
    const raw = await prisma.group.findUnique({ where: { id } });
    return raw ? toGroup(raw) : null;
  }

  async findMany(filters: GroupFilters): Promise<GroupWithStudentIds[]> {
    const rows = await prisma.group.findMany({
      where: {
        ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
        ...(filters.moduleNumber !== undefined && {
          unlockedModules: { has: filters.moduleNumber },
        }),
      },
      include: { students: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((raw) => {
      const { students, ...groupData } = raw;
      return {
        group: toGroup(groupData),
        studentIds: students.map((s) => s.id),
      };
    });
  }

  async findByIdWithStudents(id: string): Promise<GroupWithStudents | null> {
    const raw = await prisma.group.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!raw) return null;
    const { students, ...groupData } = raw;
    return {
      group: toGroup(groupData),
      students: students.map(toUser),
    };
  }

  async findStudentIds(groupId: string): Promise<string[]> {
    const students = await prisma.user.findMany({
      where: { groupId },
      select: { id: true },
    });
    return students.map((s) => s.id);
  }

  async findActiveStudentIds(groupId: string): Promise<string[]> {
    const students = await prisma.user.findMany({
      where: { groupId, role: 'STUDENT', status: 'ACTIVE' },
      select: { id: true },
    });
    return students.map((s) => s.id);
  }

  async create(data: {
    name: string;
    entryModule: number;
    unlockedModules: number[];
    studentIds: string[];
  }): Promise<Group> {
    const { studentIds, ...groupData } = data;
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: groupData });
      if (studentIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: studentIds }, role: 'STUDENT', status: 'ACTIVE' },
          data: {
            groupId: group.id,
            entryModule: group.entryModule,
            accessibleModules: [group.entryModule],
          },
        });
      }
      return toGroup(group);
    });
  }

  async update(
    id: string,
    data: { name?: string; entryModule?: number; unlockedModules?: number[] }
  ): Promise<Group> {
    const raw = await prisma.group.update({ where: { id }, data });
    return toGroup(raw);
  }

  async delete(id: string): Promise<void> {
    await prisma.group.delete({ where: { id } });
  }

  async hasStudents(id: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { groupId: id } });
    return count > 0;
  }

  async updateUnlockedModules(
    id: string,
    modules: number[],
    opts?: UpdateUnlockedModulesOpts
  ): Promise<Group> {
    const retreatedModule = opts?.retreatedModule;

    if (retreatedModule === undefined) {
      const raw = await prisma.group.update({
        where: { id },
        data: { unlockedModules: modules },
      });
      return toGroup(raw);
    }
    return prisma.$transaction(async (tx) => {
      const raw = await tx.group.update({
        where: { id },
        data: { unlockedModules: modules },
      });
      const affected = await tx.user.findMany({
        where: {
          groupId: id,
          role: 'STUDENT',
          NOT: { entryModule: retreatedModule },
          accessibleModules: { has: retreatedModule },
        },
        select: { id: true, accessibleModules: true },
      });
      if (affected.length > 0) {
        await Promise.all(
          affected.map((s) =>
            tx.user.update({
              where: { id: s.id },
              data: { accessibleModules: s.accessibleModules.filter((m) => m !== retreatedModule) },
            })
          )
        );
      }
      return toGroup(raw);
    });
  }

  async advanceModule(id: string, newModules: number[]): Promise<Group> {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.update({
        where: { id },
        data: { unlockedModules: newModules },
      });

      const nextModule = newModules[newModules.length - 1];

      const toGrant = await tx.user.findMany({
        where: {
          groupId: id,
          role: 'STUDENT',
          status: 'ACTIVE',
          NOT: { accessibleModules: { has: nextModule } },
        },
        select: { id: true },
      });
      if (toGrant.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: toGrant.map((s) => s.id) } },
          data: { accessibleModules: { push: nextModule } },
        });
      }

      return toGroup(group);
    });
  }
}
