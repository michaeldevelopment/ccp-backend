import {
  IProgressRepository,
  ProgressRecord,
  ModuleProgress,
  ModuleProgressStatus,
  UpsertProgressData,
} from '@domain/user/repositories/IProgressRepository';
import { prisma } from './client';

function toRecord(r: {
  id: string;
  userId: string;
  classId: string;
  pct: number;
  lastPositionSec: number;
  completed: boolean;
  updatedAt: Date;
}): ProgressRecord {
  return {
    id: r.id,
    userId: r.userId,
    classId: r.classId,
    pct: r.pct,
    lastPositionSec: r.lastPositionSec,
    completed: r.completed,
    updatedAt: r.updatedAt,
  };
}

function deriveStatus(total: number, completed: number): ModuleProgressStatus {
  if (total === 0 || completed === 0) return 'NOT_STARTED';
  if (completed >= total) return 'COMPLETED';
  return 'IN_PROGRESS';
}

export class PrismaProgressRepository implements IProgressRepository {
  async findByUserId(userId: string): Promise<ProgressRecord[]> {
    const rows = await prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toRecord);
  }

  async findByUserAndClass(userId: string, classId: string): Promise<ProgressRecord | null> {
    const row = await prisma.progress.findUnique({
      where: { userId_classId: { userId, classId } },
    });
    return row ? toRecord(row) : null;
  }

  async upsert(data: UpsertProgressData): Promise<ProgressRecord> {
    const pct = data.completed ? 100 : data.pct;
    const row = await prisma.progress.upsert({
      where: { userId_classId: { userId: data.userId, classId: data.classId } },
      create: {
        userId: data.userId,
        classId: data.classId,
        pct,
        lastPositionSec: data.lastPositionSec,
        completed: data.completed,
      },
      update: { pct, lastPositionSec: data.lastPositionSec, completed: data.completed },
    });
    return toRecord(row);
  }

  async findModuleProgressForUser(userId: string): Promise<ModuleProgress[]> {
    const now = new Date();
    const modules = await prisma.module.findMany({
      orderBy: { number: 'asc' },
      select: {
        number: true,
        classes: {
          where: { isPublished: true, publishedAt: { lte: now } },
          select: {
            id: true,
            progress: {
              where: { userId, completed: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    return modules.map((m) => {
      const totalClasses = m.classes.length;
      const completedClasses = m.classes.filter((c) => c.progress.length > 0).length;
      return {
        moduleNumber: m.number,
        totalClasses,
        completedClasses,
        status: deriveStatus(totalClasses, completedClasses),
      };
    });
  }
}
