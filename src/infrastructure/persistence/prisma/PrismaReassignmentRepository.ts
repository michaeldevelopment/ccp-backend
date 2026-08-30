import {
  IReassignmentRepository,
  ReassignmentRecord,
  ReassignmentStatus,
  ReassignmentWithUser,
} from '@domain/reassignment/repositories/IReassignmentRepository';
import { prisma } from './client';

function toRecord(r: {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): ReassignmentRecord {
  return {
    id: r.id,
    userId: r.userId,
    status: r.status as ReassignmentStatus,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
  };
}

export class PrismaReassignmentRepository implements IReassignmentRepository {
  async findById(id: string): Promise<ReassignmentRecord | null> {
    const row = await prisma.reassignment.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByIdWithUser(id: string): Promise<ReassignmentWithUser | null> {
    const row = await prisma.reassignment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, entryModule: true, groupId: true } },
      },
    });
    if (!row) return null;
    return { ...toRecord(row), user: row.user };
  }

  async findByUserId(userId: string): Promise<ReassignmentRecord | null> {
    const row = await prisma.reassignment.findUnique({ where: { userId } });
    return row ? toRecord(row) : null;
  }

  async findPending(): Promise<ReassignmentWithUser[]> {
    const rows = await prisma.reassignment.findMany({
      where: { status: { in: ['PENDING', 'UNDONE'] } },
      include: {
        user: { select: { id: true, name: true, email: true, entryModule: true, groupId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      ...toRecord(r),
      user: r.user,
    }));
  }

  async updateStatus(
    id: string,
    status: ReassignmentStatus,
    resolvedAt?: Date | null
  ): Promise<ReassignmentRecord> {
    const row = await prisma.reassignment.update({
      where: { id },
      data: { status, resolvedAt: resolvedAt === undefined ? undefined : resolvedAt },
    });
    return toRecord(row);
  }

  async resolveAndActivateUser(
    reassignmentId: string,
    userId: string,
    groupId: string,
    entryModule: number
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE', groupId, entryModule },
      }),
      prisma.reassignment.update({
        where: { id: reassignmentId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      }),
    ]);
  }

  async graduateUser(reassignmentId: string, userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { status: 'GRADUATED' } }),
      prisma.reassignment.update({
        where: { id: reassignmentId },
        data: { status: 'GRADUATED', resolvedAt: new Date() },
      }),
    ]);
  }

  async undoResolution(
    reassignmentId: string,
    userId: string,
    wasResolved: boolean
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: 'PENDING_REASSIGNMENT', ...(wasResolved ? { groupId: null } : {}) },
      }),
      prisma.reassignment.update({
        where: { id: reassignmentId },
        data: { status: 'UNDONE', resolvedAt: null },
      }),
    ]);
  }
}
