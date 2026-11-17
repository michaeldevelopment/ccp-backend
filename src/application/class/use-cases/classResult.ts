import { Class, Attachment } from '@domain/class/entities/Class';
import { toEmbedUrl } from '@domain/class/services/vimeoEmbed';

export interface StudentClassResult {
  id: string;
  moduleId: string;
  moduleNumber: number;
  title: string;
  description: string;
  kind: string;
  embedUrl: string;
  complementText: string;
  textBody: string | null;
  attachments: Attachment[];
  publishedAt: Date | null;
  isPublished: boolean;
  scheduled: boolean;
  durationMin: number | null;
  notify: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassResult extends StudentClassResult {
  vimeoUrl: string;
}

function toBaseClassResult(cls: Class): StudentClassResult {
  return {
    id: cls.id,
    moduleId: cls.moduleId,
    moduleNumber: cls.moduleNumber,
    title: cls.title,
    description: cls.description,
    kind: 'VIDEO',
    embedUrl: toEmbedUrl(cls.vimeoUrl),
    complementText: '',
    textBody: null,
    attachments: cls.attachments,
    publishedAt: cls.publishedAt,
    isPublished: cls.isPublished,
    scheduled: !cls.isPublished && cls.publishedAt !== null,
    durationMin: null,
    notify: cls.notify,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  };
}

export function toClassResult(cls: Class): ClassResult {
  return { ...toBaseClassResult(cls), vimeoUrl: cls.vimeoUrl };
}

export function toStudentClassResult(cls: Class): StudentClassResult {
  return toBaseClassResult(cls);
}
