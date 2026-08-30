import { Prisma } from '@prisma/client';
import {
  IClassRepository,
  CreateClassData,
  UpdateClassData,
} from '@domain/class/repositories/IClassRepository';
import { Class, Attachment } from '@domain/class/entities/Class';
import { prisma } from './client';

const classInclude = { module: { select: { number: true } } } as const;
type PrismaClassRow = Prisma.ClassGetPayload<{ include: typeof classInclude }>;

function toClass(raw: PrismaClassRow): Class {
  return new Class({
    id: raw.id,
    moduleId: raw.moduleId,
    moduleNumber: raw.module.number,
    title: raw.title,
    description: raw.description,
    vimeoUrl: raw.vimeoUrl,
    attachments: raw.attachments as unknown as Attachment[],
    publishedAt: raw.publishedAt,
    isPublished: raw.isPublished,
    notify: raw.notify,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaClassRepository implements IClassRepository {
  async findMany(filters: { moduleNumber?: number }): Promise<Class[]> {
    const rows = await prisma.class.findMany({
      where:
        filters.moduleNumber !== undefined
          ? { module: { number: filters.moduleNumber } }
          : undefined,
      include: classInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toClass);
  }

  async findById(id: string): Promise<Class | null> {
    const raw = await prisma.class.findUnique({ where: { id }, include: classInclude });
    return raw ? toClass(raw) : null;
  }

  async create(data: CreateClassData): Promise<Class> {
    const raw = await prisma.class.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        vimeoUrl: data.vimeoUrl,
        attachments: data.attachments as unknown as Prisma.InputJsonValue,
        publishedAt: data.publishedAt,
        notify: data.notify,
      },
      include: classInclude,
    });
    return toClass(raw);
  }

  async update(id: string, data: UpdateClassData): Promise<Class> {
    const raw = await prisma.class.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.vimeoUrl !== undefined && { vimeoUrl: data.vimeoUrl }),
        ...(data.attachments !== undefined && {
          attachments: data.attachments as unknown as Prisma.InputJsonValue,
        }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.notify !== undefined && { notify: data.notify }),
      },
      include: classInclude,
    });
    return toClass(raw);
  }

  async delete(id: string): Promise<void> {
    await prisma.class.delete({ where: { id } });
  }

  async findDueForPublication(): Promise<Class[]> {
    const rows = await prisma.class.findMany({
      where: { isPublished: false, publishedAt: { lte: new Date() } },
      include: classInclude,
    });
    return rows.map(toClass);
  }

  async markPublished(id: string): Promise<Class> {
    const raw = await prisma.class.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
      include: classInclude,
    });
    return toClass(raw);
  }

  async findActiveStudentEmailsForModule(moduleNumber: number): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'ACTIVE',
        group: { unlockedModules: { has: moduleNumber } },
      },
      select: { email: true },
    });
    return users.map((u) => u.email);
  }
}
