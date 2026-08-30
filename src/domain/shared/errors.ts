export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', details?: unknown) {
    super('NOT_FOUND', message, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', details?: unknown) {
    super('UNAUTHORIZED', message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado', details?: unknown) {
    super('FORBIDDEN', message, 403, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: unknown) {
    super('BUSINESS_LOGIC_ERROR', message, 422, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Este recurso ya no está disponible', details?: unknown) {
    super('GONE', message, 410, details);
  }
}
