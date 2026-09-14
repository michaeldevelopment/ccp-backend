export interface ProgressRecord {
  id: string;
  userId: string;
  classId: string;
  pct: number;
  lastPositionSec: number;
  completed: boolean;
  updatedAt: Date;
}

export type ModuleProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ModuleProgress {
  moduleNumber: number;
  totalClasses: number;
  completedClasses: number;
  status: ModuleProgressStatus;
}

export interface UpsertProgressData {
  userId: string;
  classId: string;
  pct: number;
  lastPositionSec: number;
  completed: boolean;
}

export interface IProgressRepository {
  findByUserId(userId: string): Promise<ProgressRecord[]>;
  findByUserAndClass(userId: string, classId: string): Promise<ProgressRecord | null>;
  upsert(data: UpsertProgressData): Promise<ProgressRecord>;
  findModuleProgressForUser(userId: string): Promise<ModuleProgress[]>;
}
