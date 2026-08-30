import { Class, Attachment } from '@domain/class/entities/Class';

const VIMEO_ID_RE = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;

function toEmbedUrl(vimeoUrl: string): string {
  const match = VIMEO_ID_RE.exec(vimeoUrl);
  return match ? `https://player.vimeo.com/video/${match[1]}` : vimeoUrl;
}

export interface ClassResult {
  id: string;
  moduleId: string;
  moduleNumber: number;
  title: string;
  description: string;
  kind: string;
  vimeoUrl: string;
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

export function toClassResult(cls: Class): ClassResult {
  return {
    id: cls.id,
    moduleId: cls.moduleId,
    moduleNumber: cls.moduleNumber,
    title: cls.title,
    description: cls.description,
    kind: 'VIDEO',
    vimeoUrl: cls.vimeoUrl,
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

export function toStudentClassResult(cls: Class): ClassResult {
  return toClassResult(cls);
}
