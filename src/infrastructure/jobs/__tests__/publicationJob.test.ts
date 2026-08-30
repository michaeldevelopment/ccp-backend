import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { Class } from '@domain/class/entities/Class';

const cronState = vi.hoisted(() => ({
  fn: undefined as (() => Promise<void>) | undefined,
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((_: string, fn: () => Promise<void>) => {
      cronState.fn = fn;
    }),
  },
}));

function makeClassRepo(): IClassRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findDueForPublication: vi.fn(),
    markPublished: vi.fn(),
    findActiveStudentEmailsForModule: vi.fn(),
  };
}

function makeEmailService(): IEmailService {
  return {
    sendPasswordResetEmail: vi.fn(),
    sendActivationEmail: vi.fn(),
    sendNewClassEmail: vi.fn(),
  };
}

function makeDueClass(notify: boolean): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123',
    attachments: [],
    publishedAt: new Date(Date.now() - 1000),
    isPublished: false,
    notify,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makePublishedClass(): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123',
    attachments: [],
    publishedAt: new Date(),
    isPublished: true,
    notify: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('publicationJob', () => {
  let classRepo: IClassRepository;
  let emailService: IEmailService;

  beforeEach(async () => {
    classRepo = makeClassRepo();
    emailService = makeEmailService();
    vi.mocked(classRepo.markPublished).mockResolvedValue(makePublishedClass());
    vi.mocked(classRepo.findActiveStudentEmailsForModule).mockResolvedValue(['a@b.com']);
    const { startPublicationJob } = await import('@infrastructure/jobs/publicationJob');
    startPublicationJob(classRepo, emailService);
  });

  it('marca las clases vencidas como publicadas y envía emails', async () => {
    vi.mocked(classRepo.findDueForPublication).mockResolvedValue([makeDueClass(true)]);
    await cronState.fn!();
    expect(classRepo.markPublished).toHaveBeenCalledWith('cls-1');
    expect(emailService.sendNewClassEmail).toHaveBeenCalledWith('a@b.com', 'Clase 1', 3);
  });

  it('clase con notify=false → no envía emails', async () => {
    vi.mocked(classRepo.findDueForPublication).mockResolvedValue([makeDueClass(false)]);
    await cronState.fn!();
    expect(classRepo.markPublished).toHaveBeenCalledOnce();
    expect(emailService.sendNewClassEmail).not.toHaveBeenCalled();
  });

  it('sin clases vencidas → no hace nada', async () => {
    vi.mocked(classRepo.findDueForPublication).mockResolvedValue([]);
    await cronState.fn!();
    expect(classRepo.markPublished).not.toHaveBeenCalled();
  });
});
