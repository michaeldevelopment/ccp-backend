import { Attachment } from '@domain/class/entities/Class';

export interface UnlockedModuleRecord {
  id: string;
  number: number;
  title: string;
  description: string;
}

export interface VisibleClassRecord {
  id: string;
  moduleId: string;
  moduleNumber: number;
  title: string;
  description: string;
  kind: string;
  vimeoUrl: string;
  complementText: string;
  textBody: string | null;
  attachments: Attachment[];
  publishedAt: Date | null;
  isPublished: boolean;
  scheduled: boolean;
  durationMin: number | null;
}

export interface IStudentContentRepository {
  findUnlockedModules(moduleNumbers: number[]): Promise<UnlockedModuleRecord[]>;
  findVisibleClasses(moduleNumbers: number[]): Promise<VisibleClassRecord[]>;
}
