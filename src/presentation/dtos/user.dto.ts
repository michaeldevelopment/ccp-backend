import { z } from 'zod';

export const CreateUserDto = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['TEACHER', 'STUDENT'], { message: 'El rol debe ser TEACHER o STUDENT' }),
});

export const UpdateUserDto = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['COACH', 'TEACHER', 'STUDENT']).optional(),
  status: z
    .enum(['ACTIVE', 'PAUSED', 'GRADUATED', 'PENDING_REASSIGNMENT'], {
      message: 'Estado inválido',
    })
    .optional(),
  groupId: z.string().uuid('groupId debe ser un UUID').nullable().optional(),
});

export const ListUsersDto = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  groupId: z.string().uuid().optional(),
  status: z
    .enum(['ACTIVE', 'PAUSED', 'GRADUATED', 'PENDING_REASSIGNMENT', 'PENDING_ACTIVATION'])
    .optional(),
  role: z.enum(['COACH', 'TEACHER', 'STUDENT']).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;
export type ListUsersInput = z.infer<typeof ListUsersDto>;
