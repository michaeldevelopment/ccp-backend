import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishClassUseCase } from '@application/class/use-cases/PublishClassUseCase';
import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { Class } from '@domain/class/entities/Class';
import { ValidationError, NotFoundError } from '@domain/shared/errors';

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

function makeClass(isPublished = false): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123',
    attachments: [],
    publishedAt: null,
    isPublished,
    notify: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('PublishClassUseCase', () => {
  let classRepo: IClassRepository;
  let emailService: IEmailService;
  let useCase: PublishClassUseCase;

  beforeEach(() => {
    classRepo = makeClassRepo();
    emailService = makeEmailService();
    useCase = new PublishClassUseCase(classRepo, emailService);
    vi.mocked(classRepo.findById).mockResolvedValue(makeClass());
    vi.mocked(classRepo.markPublished).mockResolvedValue(makeClass(true));
    vi.mocked(classRepo.update).mockResolvedValue(makeClass());
    vi.mocked(classRepo.findActiveStudentEmailsForModule).mockResolvedValue(['a@b.com', 'c@d.com']);
  });

  it('sin publishedAt → publica inmediatamente (isPublished=true) y envía emails', async () => {
    const result = await useCase.execute({ classId: 'cls-1', notify: true });
    expect(classRepo.markPublished).toHaveBeenCalledWith('cls-1');
    expect(emailService.sendNewClassEmail).toHaveBeenCalledTimes(2);
    expect(result.isPublished).toBe(true);
  });

  it('notify=false → publica pero no envía emails', async () => {
    await useCase.execute({ classId: 'cls-1', notify: false });
    expect(classRepo.markPublished).toHaveBeenCalledOnce();
    expect(emailService.sendNewClassEmail).not.toHaveBeenCalled();
  });

  it('publishedAt futuro → guarda la programación (isPublished sigue false)', async () => {
    const future = new Date(Date.now() + 60_000);
    await useCase.execute({ classId: 'cls-1', publishedAt: future });
    expect(classRepo.markPublished).not.toHaveBeenCalled();
    expect(classRepo.update).toHaveBeenCalledWith('cls-1', { publishedAt: future });
  });

  it('publishedAt en el pasado → ValidationError', async () => {
    const past = new Date(Date.now() - 1000);
    await expect(useCase.execute({ classId: 'cls-1', publishedAt: past })).rejects.toThrow(
      ValidationError
    );
  });

  it('clase no encontrada → NotFoundError', async () => {
    vi.mocked(classRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ classId: 'bad' })).rejects.toThrow(NotFoundError);
  });
});
