import { Class, Attachment } from '@domain/class/entities/Class';

export interface CreateClassData {
  moduleId: string;
  title: string;
  description: string;
  vimeoUrl: string;
  attachments: Attachment[];
  publishedAt?: Date;
  notify: boolean;
}

export interface UpdateClassData {
  title?: string;
  description?: string;
  vimeoUrl?: string;
  attachments?: Attachment[];
  publishedAt?: Date | null;
  isPublished?: boolean;
  notify?: boolean;
}

export interface IClassRepository {
  findMany(filters: { moduleNumber?: number }): Promise<Class[]>;
  findById(id: string): Promise<Class | null>;
  create(data: CreateClassData): Promise<Class>;
  update(id: string, data: UpdateClassData): Promise<Class>;
  delete(id: string): Promise<void>;
  findDueForPublication(): Promise<Class[]>;
  markPublished(id: string): Promise<Class>;
  findActiveStudentEmailsForModule(moduleNumber: number): Promise<string[]>;
}
