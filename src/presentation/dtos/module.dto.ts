import { z } from 'zod';

export const CreateModuleDto = z.object({
  number: z.number().int().min(1).max(9).optional(),
  title: z.string().min(1).trim(),
  description: z.string().trim().default(''),
});

export const UpdateModuleDto = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
});

export type CreateModuleInput = z.infer<typeof CreateModuleDto>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleDto>;
