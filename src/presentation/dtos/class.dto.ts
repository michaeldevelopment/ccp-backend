import { z } from 'zod';

const AttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const CreateClassDto = z.object({
  moduleNumber: z.number().int().min(1).max(9),
  title: z.string().min(1).trim(),
  description: z.string().trim().default(''),
  vimeoUrl: z.string().url(),
  attachments: z.array(AttachmentSchema).default([]),
  publishedAt: z.coerce.date().optional(),
  notify: z.boolean().default(true),
});

export const UpdateClassDto = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  vimeoUrl: z.string().url().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  isPublished: z.boolean().optional(),
  notify: z.boolean().optional(),
});

export const PublishClassDto = z.object({
  publishedAt: z.coerce.date().optional(),
  notify: z.boolean().default(true),
});

export const ValidateVimeoDto = z.object({
  vimeoUrl: z.string().url(),
});

export const ListClassesDto = z.object({
  moduleNumber: z.coerce.number().int().min(1).max(9).optional(),
});

export type CreateClassInput = z.infer<typeof CreateClassDto>;
export type UpdateClassInput = z.infer<typeof UpdateClassDto>;
export type PublishClassInput = z.infer<typeof PublishClassDto>;
