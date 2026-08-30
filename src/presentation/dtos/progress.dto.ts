import { z } from 'zod';

export const GetProgressDto = z.object({
  userId: z.string().uuid(),
  classId: z.string().uuid(),
});

export const UpsertProgressDto = z.object({
  userId: z.string().uuid(),
  classId: z.string().uuid(),
  pct: z.number().min(0).max(100),
  lastPositionSec: z.number().int().min(0),
  completed: z.boolean(),
});
