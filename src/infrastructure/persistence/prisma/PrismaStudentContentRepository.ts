import {
  IStudentContentRepository,
  UnlockedModuleRecord,
  VisibleClassRecord,
} from '@domain/user/repositories/IStudentContentRepository';
import { Attachment } from '@domain/class/entities/Class';
import { prisma } from './client';

export class PrismaStudentContentRepository implements IStudentContentRepository {
  async findUnlockedModules(moduleNumbers: number[]): Promise<UnlockedModuleRecord[]> {
    const rows = await prisma.module.findMany({
      where: { number: { in: moduleNumbers } },
      orderBy: { number: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      number: r.number,
      title: r.title,
      description: r.description,
    }));
  }

  async findVisibleClasses(moduleNumbers: number[]): Promise<VisibleClassRecord[]> {
    const now = new Date();
    const rows = await prisma.class.findMany({
      where: {
        module: { number: { in: moduleNumbers } },
        isPublished: true,
        publishedAt: { lte: now },
      },
      include: { module: { select: { number: true } } },
      orderBy: { publishedAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      moduleId: r.moduleId,
      moduleNumber: r.module.number,
      title: r.title,
      description: r.description,
      kind: 'VIDEO',
      vimeoUrl: r.vimeoUrl,
      complementText: '',
      textBody: null,
      attachments: (r.attachments as unknown as Attachment[]) ?? [],
      publishedAt: r.publishedAt,
      isPublished: r.isPublished,
      scheduled: !r.isPublished && r.publishedAt !== null,
      durationMin: null,
    }));
  }
}
