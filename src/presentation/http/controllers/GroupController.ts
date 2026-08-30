import { Request, Response } from 'express';
import { ListGroupsUseCase } from '@application/group/use-cases/ListGroupsUseCase';
import { GetGroupUseCase } from '@application/group/use-cases/GetGroupUseCase';
import { CreateGroupUseCase } from '@application/group/use-cases/CreateGroupUseCase';
import { UpdateGroupUseCase } from '@application/group/use-cases/UpdateGroupUseCase';
import { DeleteGroupUseCase } from '@application/group/use-cases/DeleteGroupUseCase';
import { AdvanceGroupUseCase } from '@application/group/use-cases/AdvanceGroupUseCase';
import { RetreatGroupUseCase } from '@application/group/use-cases/RetreatGroupUseCase';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { CreateGroupDto, UpdateGroupDto, ListGroupsDto } from '@presentation/dtos/group.dto';
import { ValidationError } from '@domain/shared/errors';

const groupRepo = new PrismaGroupRepository();
const userRepo = new PrismaUserRepository();

const listGroupsUseCase = new ListGroupsUseCase(groupRepo);
const getGroupUseCase = new GetGroupUseCase(groupRepo);
const createGroupUseCase = new CreateGroupUseCase(groupRepo, userRepo);
const updateGroupUseCase = new UpdateGroupUseCase(groupRepo);
const deleteGroupUseCase = new DeleteGroupUseCase(groupRepo);
const advanceGroupUseCase = new AdvanceGroupUseCase(groupRepo);
const retreatGroupUseCase = new RetreatGroupUseCase(groupRepo);

export class GroupController {
  async list(req: Request, res: Response): Promise<void> {
    const query = ListGroupsDto.safeParse(req.query);
    if (!query.success) throw new ValidationError('Parámetros inválidos', query.error.flatten());
    const result = await listGroupsUseCase.execute(query.data);
    res.status(200).json({ groups: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const result = await getGroupUseCase.execute({ groupId: String(req.params['id']) });
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    const body = CreateGroupDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await createGroupUseCase.execute(body.data);
    res.status(201).json(result);
  }

  async update(req: Request, res: Response): Promise<void> {
    const body = UpdateGroupDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await updateGroupUseCase.execute({
      groupId: String(req.params['id']),
      ...body.data,
    });
    res.status(200).json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await deleteGroupUseCase.execute({ groupId: String(req.params['id']) });
    res.status(204).send();
  }

  async advance(req: Request, res: Response): Promise<void> {
    const result = await advanceGroupUseCase.execute({ groupId: String(req.params['id']) });
    res.status(200).json(result);
  }

  async retreat(req: Request, res: Response): Promise<void> {
    const result = await retreatGroupUseCase.execute({ groupId: String(req.params['id']) });
    res.status(200).json(result);
  }
}
