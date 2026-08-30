import { Request, Response } from 'express';
import { ListModulesUseCase } from '@application/module/use-cases/ListModulesUseCase';
import { GetModuleUseCase } from '@application/module/use-cases/GetModuleUseCase';
import { UpdateModuleUseCase } from '@application/module/use-cases/UpdateModuleUseCase';
import { PrismaModuleRepository } from '@infrastructure/persistence/prisma/PrismaModuleRepository';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { UpdateModuleDto } from '@presentation/dtos/module.dto';
import { ValidationError } from '@domain/shared/errors';

const moduleRepo = new PrismaModuleRepository();
const userRepo = new PrismaUserRepository();
const groupRepo = new PrismaGroupRepository();

const listModulesUseCase = new ListModulesUseCase(moduleRepo, userRepo, groupRepo);
const getModuleUseCase = new GetModuleUseCase(moduleRepo, userRepo, groupRepo);
const updateModuleUseCase = new UpdateModuleUseCase(moduleRepo);

export class ModuleController {
  async list(req: Request, res: Response): Promise<void> {
    const result = await listModulesUseCase.execute({
      userId: req.user!.id,
      role: req.user!.role,
    });
    res.status(200).json({ modules: result });
  }

  async getByNumber(req: Request, res: Response): Promise<void> {
    const number = parseInt(String(req.params['number']), 10);
    if (isNaN(number) || number < 1 || number > 9) {
      throw new ValidationError('El número de módulo debe ser un entero entre 1 y 9');
    }
    const result = await getModuleUseCase.execute({
      number,
      userId: req.user!.id,
      role: req.user!.role,
    });
    res.status(200).json(result);
  }

  async update(req: Request, res: Response): Promise<void> {
    const number = parseInt(String(req.params['number']), 10);
    if (isNaN(number) || number < 1 || number > 9) {
      throw new ValidationError('El número de módulo debe ser un entero entre 1 y 9');
    }
    const body = UpdateModuleDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await updateModuleUseCase.execute({ number, ...body.data });
    res.status(200).json(result);
  }
}
