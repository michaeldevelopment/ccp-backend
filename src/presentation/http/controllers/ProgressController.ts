import { Request, Response } from 'express';
import { GetProgressUseCase } from '@application/user/use-cases/GetProgressUseCase';
import { UpsertProgressUseCase } from '@application/user/use-cases/UpsertProgressUseCase';
import { PrismaProgressRepository } from '@infrastructure/persistence/prisma/PrismaProgressRepository';
import { GetProgressDto, UpsertProgressDto } from '@presentation/dtos/progress.dto';
import { ValidationError, UnauthorizedError } from '@domain/shared/errors';

const progressRepo = new PrismaProgressRepository();
const getProgressUseCase = new GetProgressUseCase(progressRepo);
const upsertProgressUseCase = new UpsertProgressUseCase(progressRepo);

export class ProgressController {
  async get(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const query = GetProgressDto.safeParse(req.query);
    if (!query.success) throw new ValidationError('Parámetros inválidos', query.error.flatten());
    const result = await getProgressUseCase.execute({
      ...query.data,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(200).json({ progress: result ? [result] : [] });
  }

  async upsert(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const body = UpsertProgressDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await upsertProgressUseCase.execute({
      ...body.data,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(200).json(result);
  }
}
