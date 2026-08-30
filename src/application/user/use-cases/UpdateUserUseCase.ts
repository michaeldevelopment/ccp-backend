import { Role, UserStatus } from '@prisma/client';
import { IUserRepository, UserUpdateData } from '@domain/user/repositories/IUserRepository';
import { IGroupRepository } from '@domain/group/repositories/IGroupRepository';
import { NotFoundError, ForbiddenError, ValidationError } from '@domain/shared/errors';
import { UserResult, toUserResult } from './userResult';

interface UpdateUserInput {
  callerId: string;
  callerRole: string;
  userId: string;
  name?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
  groupId?: string | null;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: UpdateUserInput): Promise<UserResult> {
    const target = await this.userRepo.findById(input.userId);
    if (!target) throw new NotFoundError('Usuario no encontrado');

    if (input.callerRole === 'TEACHER' && target.role !== 'STUDENT') {
      throw new ForbiddenError('Los teachers solo pueden editar estudiantes');
    }

    if (input.callerRole === 'TEACHER' && input.role !== undefined) {
      throw new ForbiddenError('Los teachers no pueden cambiar el rol de un usuario');
    }

    if (input.status === 'PENDING_ACTIVATION') {
      throw new ValidationError('El estado PENDING_ACTIVATION no puede asignarse manualmente');
    }

    const effectiveRole = input.role ?? target.role;

    if (
      effectiveRole === 'TEACHER' &&
      (input.status === 'GRADUATED' || input.status === 'PENDING_REASSIGNMENT')
    ) {
      throw new ValidationError(
        'Los teachers no pueden tener estado GRADUATED o PENDING_REASSIGNMENT'
      );
    }

    if (effectiveRole === 'TEACHER' && input.groupId !== undefined) {
      throw new ValidationError('Los teachers no pueden ser asignados a grupos');
    }

    const updateData: UserUpdateData = {
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status,
      groupId: input.groupId,
    };

    if (input.groupId !== undefined) {
      if (input.groupId === null) {
        updateData.entryModule = null;
      } else {
        const group = await this.groupRepo.findById(input.groupId);
        if (!group) throw new NotFoundError('Grupo no encontrado');
        updateData.entryModule =
          group.unlockedModules.length > 0 ? Math.min(...group.unlockedModules) : group.entryModule;
      }
    }

    const updated = await this.userRepo.update(input.userId, updateData);
    return toUserResult(updated);
  }
}
