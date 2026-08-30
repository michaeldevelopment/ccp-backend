import {
  IDashboardRepository,
  DashboardSummary,
  DashboardTopGroup,
  NotificationItem,
} from '@domain/dashboard/repositories/IDashboardRepository';
import { prisma } from './client';

const TOP_GROUPS_LIMIT = 3;
const LAST_MODULE = 9;

export class PrismaDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    const [activeStudents, totalStudents, activeGroups, pendingReassignments, groups, modules] =
      await prisma.$transaction([
        prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.group.count(),
        prisma.reassignment.count({ where: { status: 'PENDING' } }),
        prisma.group.findMany({
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { students: true } } },
        }),
        prisma.module.findMany({ select: { number: true, title: true } }),
      ]);

    const moduleTitleByNumber = new Map(modules.map((m) => [m.number, m.title]));

    const activeModuleNumbers = Array.from(
      new Set(
        groups
          .filter((g) => g.unlockedModules.length > 0)
          .map((g) => Math.max(...g.unlockedModules))
      )
    ).sort((a, b) => a - b);

    const topGroups: DashboardTopGroup[] = groups.slice(0, TOP_GROUPS_LIMIT).map((g) => {
      const currentModule =
        g.unlockedModules.length > 0 ? Math.max(...g.unlockedModules) : g.entryModule;
      const totalModules = LAST_MODULE - g.entryModule + 1;
      const rawPercent = totalModules > 0 ? (g.unlockedModules.length / totalModules) * 100 : 0;
      return {
        id: g.id,
        name: g.name,
        currentModule,
        currentModuleTitle: moduleTitleByNumber.get(currentModule) ?? '',
        entryModule: g.entryModule,
        progressPercent: Math.round(rawPercent * 10) / 10,
        studentCount: g._count.students,
      };
    });

    return {
      stats: {
        activeStudents,
        totalStudents,
        activeGroups,
        pendingReassignments,
        activeModuleNumbers,
      },
      topGroups,
    };
  }

  async getUpcomingNotifications(): Promise<NotificationItem[]> {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const [reassignments, scheduledClasses] = await Promise.all([
      prisma.reassignment.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.class.findMany({
        where: { isPublished: false, publishedAt: { gte: now, lte: in48h } },
        orderBy: { publishedAt: 'asc' },
      }),
    ]);

    const items: NotificationItem[] = [
      ...reassignments.map((r) => ({
        type: 'REASSIGNMENT' as const,
        createdAt: r.createdAt,
        reassignmentId: r.id,
        userName: r.user.name ?? r.user.email,
      })),
      ...scheduledClasses.map((c) => ({
        type: 'SCHEDULED_CLASS' as const,
        createdAt: c.createdAt,
        classId: c.id,
        classTitle: c.title,
        scheduledAt: c.publishedAt as Date,
      })),
    ];

    return items;
  }
}
