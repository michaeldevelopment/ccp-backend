import { Prisma } from '@prisma/client';
import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { Module } from '@domain/module/entities/Module';
import { ConflictError } from '@domain/shared/errors';
import { prisma } from './client';

type PrismaModule = NonNullable<Awaited<ReturnType<typeof prisma.module.findUnique>>>;

function toModule(raw: PrismaModule): Module {
  return new Module({
    id: raw.id,
    number: raw.number,
    title: raw.title,
    description: raw.description,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaModuleRepository implements IModuleRepository {
  async findAll(): Promise<Module[]> {
    const rows = await prisma.module.findMany({ orderBy: { number: 'asc' } });
    return rows.map(toModule);
  }

  async findByNumber(number: number): Promise<Module | null> {
    const raw = await prisma.module.findUnique({ where: { number } });
    return raw ? toModule(raw) : null;
  }

  async create(data: { number: number; title: string; description: string }): Promise<Module> {
    try {
      const raw = await prisma.module.create({ data });
      return toModule(raw);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`Ya existe un módulo con el número ${data.number}`);
      }
      throw err;
    }
  }

  async update(number: number, data: { title?: string; description?: string }): Promise<Module> {
    const raw = await prisma.module.update({ where: { number }, data });
    return toModule(raw);
  }
}
