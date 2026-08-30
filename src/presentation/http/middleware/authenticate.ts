import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@infrastructure/services/JwtService';
import { UnauthorizedError } from '@domain/shared/errors';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string };
  }
}

const jwtService = new JwtService();

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acceso requerido');
  }
  const token = authHeader.slice(7);
  const payload = jwtService.verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
}
