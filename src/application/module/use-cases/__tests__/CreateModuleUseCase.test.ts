import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateModuleUseCase } from '@application/module/use-cases/CreateModuleUseCase';
import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { Module } from '@domain/module/entities/Module';
import { BusinessLogicError, ConflictError } from '@domain/shared/errors';

function makeModule(number: number, title = `Módulo ${number}`): Module {
  return new Module({
    id: `mod-${number}`,
    number,
    title,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeModuleRepo(): IModuleRepository {
  return { findAll: vi.fn(), findByNumber: vi.fn(), create: vi.fn(), update: vi.fn() };
}

describe('CreateModuleUseCase', () => {
  let moduleRepo: IModuleRepository;
  let useCase: CreateModuleUseCase;

  beforeEach(() => {
    moduleRepo = makeModuleRepo();
    useCase = new CreateModuleUseCase(moduleRepo);
    vi.mocked(moduleRepo.create).mockImplementation(async (data) =>
      makeModule(data.number, data.title)
    );
  });

  it('catálogo vacío sin number: crea el módulo 1', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue([]);
    const result = await useCase.execute({ title: 'Fundamentos', description: '' });
    expect(moduleRepo.create).toHaveBeenCalledWith({
      number: 1,
      title: 'Fundamentos',
      description: '',
    });
    expect(result.number).toBe(1);
  });

  it('sin number: toma el primer hueco libre, no el siguiente al máximo', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue([1, 2, 4].map((n) => makeModule(n)));
    const result = await useCase.execute({ title: 'Nuevo', description: '' });
    expect(result.number).toBe(3);
  });

  it('con number libre: respeta el número pedido', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue([makeModule(1)]);
    const result = await useCase.execute({ number: 7, title: 'Nuevo', description: '' });
    expect(result.number).toBe(7);
  });

  it('con number ocupado: ConflictError y no persiste', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue([makeModule(3)]);
    await expect(useCase.execute({ number: 3, title: 'Nuevo', description: '' })).rejects.toThrow(
      ConflictError
    );
    expect(moduleRepo.create).not.toHaveBeenCalled();
  });

  it('los 9 módulos ya existen y no se pide number: BusinessLogicError', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => makeModule(n))
    );
    await expect(useCase.execute({ title: 'Décimo', description: '' })).rejects.toThrow(
      BusinessLogicError
    );
    expect(moduleRepo.create).not.toHaveBeenCalled();
  });

  it('el módulo creado siempre vuelve con isUnlocked=true (vista de coach)', async () => {
    vi.mocked(moduleRepo.findAll).mockResolvedValue([]);
    const result = await useCase.execute({ title: 'Fundamentos', description: 'Desc' });
    expect(result.isUnlocked).toBe(true);
  });
});
