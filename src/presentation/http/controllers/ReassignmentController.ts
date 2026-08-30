import { Request, Response } from 'express';
import { ListReassignmentsUseCase } from '@application/reassignment/use-cases/ListReassignmentsUseCase';
import { ResolveReassignmentUseCase } from '@application/reassignment/use-cases/ResolveReassignmentUseCase';
import { GraduateReassignmentUseCase } from '@application/reassignment/use-cases/GraduateReassignmentUseCase';
import { UndoReassignmentUseCase } from '@application/reassignment/use-cases/UndoReassignmentUseCase';
import { PrismaReassignmentRepository } from '@infrastructure/persistence/prisma/PrismaReassignmentRepository';
import { PrismaGroupRepository } from '@infrastructure/persistence/prisma/PrismaGroupRepository';
import { ResolveReassignmentDto } from '@presentation/dtos/reassignment.dto';
import { ValidationError } from '@domain/shared/errors';

const reassignmentRepo = new PrismaReassignmentRepository();
const groupRepo = new PrismaGroupRepository();

const listReassignmentsUseCase = new ListReassignmentsUseCase(reassignmentRepo);
const resolveReassignmentUseCase = new ResolveReassignmentUseCase(reassignmentRepo, groupRepo);
const graduateReassignmentUseCase = new GraduateReassignmentUseCase(reassignmentRepo);
const undoReassignmentUseCase = new UndoReassignmentUseCase(reassignmentRepo);

export class ReassignmentController {
  async list(_req: Request, res: Response): Promise<void> {
    const result = await listReassignmentsUseCase.execute();
    res.status(200).json({ reassignments: result });
  }

  async resolve(req: Request, res: Response): Promise<void> {
    const body = ResolveReassignmentDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await resolveReassignmentUseCase.execute({
      reassignmentId: String(req.params['id']),
      groupId: body.data.groupId,
    });
    res.status(200).json(result);
  }

  async graduate(req: Request, res: Response): Promise<void> {
    const result = await graduateReassignmentUseCase.execute({
      reassignmentId: String(req.params['id']),
    });
    res.status(200).json(result);
  }

  async undo(req: Request, res: Response): Promise<void> {
    const result = await undoReassignmentUseCase.execute({
      reassignmentId: String(req.params['id']),
    });
    res.status(200).json(result);
  }
}
