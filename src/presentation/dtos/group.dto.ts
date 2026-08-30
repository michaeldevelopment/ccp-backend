import { z } from 'zod';

export const CreateGroupDto = z.object({
  name: z.string().min(1, 'El nombre es requerido').trim(),
  entryModule: z.number().int().min(1).max(9),
  studentIds: z.array(z.string().uuid()).default([]),
});

export const UpdateGroupDto = z.object({
  name: z.string().min(1).trim().optional(),
  entryModule: z.number().int().min(1).max(9).optional(),
  unlockedModules: z.array(z.number().int().min(1).max(9)).optional(),
});

export const ListGroupsDto = z.object({
  name: z.string().optional(),
  moduleNumber: z.coerce.number().int().min(1).max(9).optional(),
});

export type CreateGroupInput = z.infer<typeof CreateGroupDto>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupDto>;
export type ListGroupsInput = z.infer<typeof ListGroupsDto>;
