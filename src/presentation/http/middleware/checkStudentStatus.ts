import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { ForbiddenError, UnauthorizedError } from '@domain/shared/errors';

const GRADUATED_ACCESS_MONTHS = 3;

export function checkStudentStatus(userRepo: IUserRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.role !== 'STUDENT') return next();

    const user = await userRepo.findById(req.user.id);
    if (!user) throw new UnauthorizedError('Usuario no encontrado');

    if (user.status === 'PENDING_REASSIGNMENT') {
      throw new ForbiddenError('Sin acceso a contenido');
    }

    if (user.status === 'GRADUATED') {
      if (!user.graduatedAt) {
        throw new ForbiddenError('Sin registro de graduación válido');
      }
      const expiry = new Date(user.graduatedAt);
      expiry.setMonth(expiry.getMonth() + GRADUATED_ACCESS_MONTHS);
      if (new Date() > expiry) {
        throw new ForbiddenError('El período de acceso GRADUATED ha expirado');
      }
    }

    next();
  };
}
