import { z } from 'zod';

export const UpdateMeDto = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
    email: z.string().email('Email inválido').optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
    currentPassword: z.string().min(1, 'La contraseña actual es requerida').optional(),
  })
  .refine((d) => !(d.password && !d.currentPassword), {
    message: 'Se requiere la contraseña actual para cambiar la contraseña',
    path: ['currentPassword'],
  })
  .refine((d) => d.name || d.email || d.password, {
    message: 'Debes proporcionar al menos un campo para actualizar',
  });

export type UpdateMeInput = z.infer<typeof UpdateMeDto>;
