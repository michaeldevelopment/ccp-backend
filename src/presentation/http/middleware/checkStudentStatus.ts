import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IReassignmentRepository } from '@domain/reassignment/repositories/IReassignmentRepository';
import { ForbiddenError, UnauthorizedError } from '@domain/shared/errors';

export function checkStudentStatus(
  userRepo: IUserRepository,
  reassignmentRepo: IReassignmentRepository
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.role !== 'STUDENT') return next();

    const user = await userRepo.findById(req.user.id);
    if (!user) throw new UnauthorizedError('Usuario no encontrado');

    if (user.status === 'PAUSED' || user.status === 'PENDING_REASSIGNMENT') {
      throw new ForbiddenError('Sin acceso a contenido');
    }

    if (user.status === 'GRADUATED') {
      const ra = await reassignmentRepo.findByUserId(user.id);
      if (!ra || !ra.resolvedAt) {
        throw new ForbiddenError('Sin registro de graduación válido');
      }
      const expiry = new Date(ra.resolvedAt);
      expiry.setMonth(expiry.getMonth() + 3);
      if (new Date() > expiry) {
        throw new ForbiddenError('El período de acceso GRADUATED ha expirado');
      }
    }

    next();
  };
}
