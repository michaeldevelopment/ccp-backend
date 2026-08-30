import { Request, Response, NextFunction } from 'express';
import { AppError } from '@domain/shared/errors';
import { logger } from '@config/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message, details: err.details });
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details != null ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error({ message: err.message, stack: err.stack });
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno del servidor' },
  });
}
