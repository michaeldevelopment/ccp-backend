import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const ActivateAccountDto = z.object({
  token: z.string().min(1, 'Token requerido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const RequestPasswordResetDto = z.object({
  email: z.string().email('Email inválido'),
});

export const ConsumePasswordResetDto = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof LoginDto>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;
export type ActivateAccountInput = z.infer<typeof ActivateAccountDto>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetDto>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordDto>;
