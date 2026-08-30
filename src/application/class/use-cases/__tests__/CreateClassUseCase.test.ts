import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateClassUseCase } from '@application/class/use-cases/CreateClassUseCase';
import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { IVimeoService } from '@domain/class/services/IVimeoService';
import { Module } from '@domain/module/entities/Module';
import { Class } from '@domain/class/entities/Class';
import { BusinessLogicError, ValidationError, NotFoundError } from '@domain/shared/errors';

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

function makeModuleRepo(): IModuleRepository {
  return { findAll: vi.fn(), findByNumber: vi.fn(), update: vi.fn() };
}

function makeVimeoService(): IVimeoService {
  return { validateUrl: vi.fn() };
}

function makeModule(): Module {
  return new Module({
    id: 'mod-1',
    number: 3,
    title: 'Módulo 3',
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeClass(): Class {
  return new Class({
    id: 'cls-1',
    moduleId: 'mod-1',
    moduleNumber: 3,
    title: 'Clase 1',
    description: '',
    vimeoUrl: 'https://vimeo.com/123456789',
    attachments: [],
    publishedAt: null,
    isPublished: false,
    notify: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const validInput = {
  moduleNumber: 3,
  title: 'Clase 1',
  description: '',
  vimeoUrl: 'https://vimeo.com/123456789',
  attachments: [],
  notify: true,
};

describe('CreateClassUseCase', () => {
  let classRepo: IClassRepository;
  let moduleRepo: IModuleRepository;
  let vimeoService: IVimeoService;
  let useCase: CreateClassUseCase;

  beforeEach(() => {
    classRepo = makeClassRepo();
    moduleRepo = makeModuleRepo();
    vimeoService = makeVimeoService();
    useCase = new CreateClassUseCase(classRepo, moduleRepo, vimeoService);
    vi.mocked(moduleRepo.findByNumber).mockResolvedValue(makeModule());
    vi.mocked(vimeoService.validateUrl).mockResolvedValue({ valid: true });
    vi.mocked(classRepo.create).mockResolvedValue(makeClass());
  });

  it('crea la clase con isPublished=false', async () => {
    const result = await useCase.execute(validInput);
    expect(result.isPublished).toBe(false);
    expect(classRepo.create).toHaveBeenCalledOnce();
  });

  // Skipped: validación de Vimeo está comentada temporalmente en CreateClassUseCase
  // (ver pending_vimeo_validation memory). Re-habilitar junto con el use case.
  it.skip('URL de Vimeo inválida → BusinessLogicError (422), no crea la clase', async () => {
    vi.mocked(vimeoService.validateUrl).mockResolvedValue({
      valid: false,
      message: 'Video no encontrado',
    });
    await expect(useCase.execute(validInput)).rejects.toThrow(BusinessLogicError);
    expect(classRepo.create).not.toHaveBeenCalled();
  });

  it('publishedAt en el pasado → ValidationError (400)', async () => {
    const past = new Date(Date.now() - 1000);
    await expect(useCase.execute({ ...validInput, publishedAt: past })).rejects.toThrow(
      ValidationError
    );
    expect(classRepo.create).not.toHaveBeenCalled();
  });

  it('módulo no encontrado → NotFoundError', async () => {
    vi.mocked(moduleRepo.findByNumber).mockResolvedValue(null);
    await expect(useCase.execute(validInput)).rejects.toThrow(NotFoundError);
  });

  it('publishedAt futuro → se guarda en el repo sin publicar', async () => {
    const future = new Date(Date.now() + 60_000);
    await useCase.execute({ ...validInput, publishedAt: future });
    const callArg = vi.mocked(classRepo.create).mock.calls[0][0];
    expect(callArg.publishedAt).toEqual(future);
  });
});
