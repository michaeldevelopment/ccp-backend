import { Request, Response } from 'express';
import { GetMeUseCase } from '@application/user/use-cases/GetMeUseCase';
import { UpdateMeUseCase } from '@application/user/use-cases/UpdateMeUseCase';
import { GetMyProgressUseCase } from '@application/user/use-cases/GetMyProgressUseCase';
import { GetMyModulesUseCase } from '@application/user/use-cases/GetMyModulesUseCase';
import { GetMyClassesUseCase } from '@application/user/use-cases/GetMyClassesUseCase';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaProgressRepository } from '@infrastructure/persistence/prisma/PrismaProgressRepository';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { PrismaStudentContentRepository } from '@infrastructure/persistence/prisma/PrismaStudentContentRepository';
import { UpdateMeDto } from '@presentation/dtos/me.dto';
import { ValidationError, UnauthorizedError } from '@domain/shared/errors';

const userRepo = new PrismaUserRepository();
const progressRepo = new PrismaProgressRepository();
const groupRepo = new PrismaGroupRepository();
const contentRepo = new PrismaStudentContentRepository();

const getMeUseCase = new GetMeUseCase(userRepo);
const updateMeUseCase = new UpdateMeUseCase(userRepo);
const getMyProgressUseCase = new GetMyProgressUseCase(userRepo, progressRepo);
const getMyModulesUseCase = new GetMyModulesUseCase(userRepo, groupRepo, contentRepo);
const getMyClassesUseCase = new GetMyClassesUseCase(userRepo, groupRepo, contentRepo);

export class MeController {
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await getMeUseCase.execute({ userId: req.user.id });
    res.status(200).json(result);
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const body = UpdateMeDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await updateMeUseCase.execute({ userId: req.user.id, ...body.data });
    res.status(200).json(result);
  }

  async getProgress(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await getMyProgressUseCase.execute({ userId: req.user.id });
    res.status(200).json({ progress: result });
  }

  async getModules(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await getMyModulesUseCase.execute({ userId: req.user.id });
    res.status(200).json({ modules: result });
  }

  async getClasses(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await getMyClassesUseCase.execute({ userId: req.user.id });
    res.status(200).json({ classes: result });
  }
}
