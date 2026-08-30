import { z } from 'zod';

export const ResolveReassignmentDto = z.object({
  groupId: z.string().uuid(),
});
