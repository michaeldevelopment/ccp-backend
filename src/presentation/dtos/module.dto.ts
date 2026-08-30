import { z } from 'zod';

export const UpdateModuleDto = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
});

export type UpdateModuleInput = z.infer<typeof UpdateModuleDto>;
