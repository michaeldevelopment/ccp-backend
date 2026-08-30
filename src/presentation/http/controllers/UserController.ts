import { Request, Response } from 'express';
import { ListUsersUseCase } from '@application/user/use-cases/ListUsersUseCase';
import { GetUserUseCase } from '@application/user/use-cases/GetUserUseCase';
import { CreateUserUseCase } from '@application/user/use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from '@application/user/use-cases/UpdateUserUseCase';
import { DeleteUserUseCase } from '@application/user/use-cases/DeleteUserUseCase';
import { GetUserProgressUseCase } from '@application/user/use-cases/GetUserProgressUseCase';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { PrismaActivationTokenRepository } from '@infrastructure/persistence/prisma/PrismaActivationTokenRepository';
import { PrismaProgressRepository } from '@infrastructure/persistence/prisma/PrismaProgressRepository';
import { EmailService } from '@infrastructure/email/EmailService';
import { CreateUserDto, UpdateUserDto, ListUsersDto } from '@presentation/dtos/user.dto';
import { ValidationError, UnauthorizedError } from '@domain/shared/errors';
import { Role, UserStatus } from '@prisma/client';

const userRepo = new PrismaUserRepository();
const groupRepo = new PrismaGroupRepository();
const activationTokenRepo = new PrismaActivationTokenRepository();
const progressRepo = new PrismaProgressRepository();
const emailService = new EmailService();

const listUsersUseCase = new ListUsersUseCase(userRepo);
const getUserUseCase = new GetUserUseCase(userRepo);
const createUserUseCase = new CreateUserUseCase(userRepo, activationTokenRepo, emailService);
const updateUserUseCase = new UpdateUserUseCase(userRepo, groupRepo);
const deleteUserUseCase = new DeleteUserUseCase(userRepo);
const getUserProgressUseCase = new GetUserProgressUseCase(userRepo, progressRepo);

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    const query = ListUsersDto.safeParse(req.query);
    if (!query.success) throw new ValidationError('Parámetros inválidos', query.error.flatten());
    const result = await listUsersUseCase.execute({
      ...query.data,
      status: query.data.status as UserStatus | undefined,
      role: query.data.role as Role | undefined,
    });
    res.status(200).json({ users: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const result = await getUserUseCase.execute({ userId: String(req.params['id']) });
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    const body = CreateUserDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await createUserUseCase.execute({
      email: body.data.email,
      role: body.data.role as Role,
    });
    res.status(201).json(result);
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const body = UpdateUserDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await updateUserUseCase.execute({
      callerId: req.user.id,
      callerRole: req.user.role,
      userId: String(req.params['id']),
      ...body.data,
      role: body.data.role as Role | undefined,
      status: body.data.status as UserStatus | undefined,
    });
    res.status(200).json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await deleteUserUseCase.execute({ userId: String(req.params['id']) });
    res.status(204).send();
  }

  async getProgress(req: Request, res: Response): Promise<void> {
    const result = await getUserProgressUseCase.execute({ userId: String(req.params['id']) });
    res.status(200).json({ progress: result });
  }
}
