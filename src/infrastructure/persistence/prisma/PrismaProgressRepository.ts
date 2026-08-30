import {
  IProgressRepository,
  ProgressRecord,
  ProgressRecordWithClass,
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

  async findByUserIdWithClass(userId: string): Promise<ProgressRecordWithClass[]> {
    const rows = await prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { class: { include: { module: { select: { number: true } } } } },
    });
    return rows.map((r) => ({
      ...toRecord(r),
      class: { title: r.class.title, moduleNumber: r.class.module.number },
    }));
  }
}
