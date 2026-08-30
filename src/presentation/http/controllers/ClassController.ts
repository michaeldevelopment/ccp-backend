import { Request, Response } from 'express';
import { ListClassesUseCase } from '@application/class/use-cases/ListClassesUseCase';
import { GetClassUseCase } from '@application/class/use-cases/GetClassUseCase';
import { CreateClassUseCase } from '@application/class/use-cases/CreateClassUseCase';
import { UpdateClassUseCase } from '@application/class/use-cases/UpdateClassUseCase';
import { DeleteClassUseCase } from '@application/class/use-cases/DeleteClassUseCase';
import { PublishClassUseCase } from '@application/class/use-cases/PublishClassUseCase';
import { ValidateVimeoUseCase } from '@application/class/use-cases/ValidateVimeoUseCase';
import { PrismaClassRepository } from '@infrastructure/persistence/prisma/PrismaClassRepository';
import { PrismaModuleRepository } from '@infrastructure/persistence/prisma/PrismaModuleRepository';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { VimeoService } from '@infrastructure/vimeo/VimeoService';
import { EmailService } from '@infrastructure/email/EmailService';
import {
  CreateClassDto,
  UpdateClassDto,
  PublishClassDto,
  ValidateVimeoDto,
  ListClassesDto,
} from '@presentation/dtos/class.dto';
import { ValidationError } from '@domain/shared/errors';

const classRepo = new PrismaClassRepository();
const moduleRepo = new PrismaModuleRepository();
const userRepo = new PrismaUserRepository();
const groupRepo = new PrismaGroupRepository();
const vimeoService = new VimeoService();
const emailService = new EmailService();

const listClassesUseCase = new ListClassesUseCase(classRepo);
const getClassUseCase = new GetClassUseCase(classRepo, userRepo, groupRepo);
const createClassUseCase = new CreateClassUseCase(classRepo, moduleRepo, vimeoService);
const updateClassUseCase = new UpdateClassUseCase(classRepo, vimeoService, emailService);
const deleteClassUseCase = new DeleteClassUseCase(classRepo);
const publishClassUseCase = new PublishClassUseCase(classRepo, emailService);
const validateVimeoUseCase = new ValidateVimeoUseCase(vimeoService);

export class ClassController {
  async list(req: Request, res: Response): Promise<void> {
    const query = ListClassesDto.safeParse(req.query);
    if (!query.success) throw new ValidationError('Parámetros inválidos', query.error.flatten());
    const result = await listClassesUseCase.execute(query.data);
    res.status(200).json({ classes: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const result = await getClassUseCase.execute({
      classId: String(req.params['id']),
      userId: req.user!.id,
      role: req.user!.role,
    });
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    const body = CreateClassDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await createClassUseCase.execute(body.data);
    res.status(201).json(result);
  }

  async update(req: Request, res: Response): Promise<void> {
    const body = UpdateClassDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await updateClassUseCase.execute({
      classId: String(req.params['id']),
      ...body.data,
    });
    res.status(200).json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await deleteClassUseCase.execute({ classId: String(req.params['id']) });
    res.status(204).send();
  }

  async publish(req: Request, res: Response): Promise<void> {
    const body = PublishClassDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await publishClassUseCase.execute({
      classId: String(req.params['id']),
      ...body.data,
    });
    res.status(200).json(result);
  }

  async validateVimeo(req: Request, res: Response): Promise<void> {
    const body = ValidateVimeoDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await validateVimeoUseCase.execute(body.data);
    res.status(200).json(result);
  }
}
