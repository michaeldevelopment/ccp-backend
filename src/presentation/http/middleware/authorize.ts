import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@domain/shared/errors';
import { Role } from '@prisma/client';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role as Role)) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción');
    }
    next();
  };
}
