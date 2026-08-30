export interface ProgressRecord {
  id: string;
  userId: string;
  classId: string;
  pct: number;
  lastPositionSec: number;
  completed: boolean;
  updatedAt: Date;
}

export interface ProgressRecordWithClass extends ProgressRecord {
  class: { title: string; moduleNumber: number };
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
  findByUserIdWithClass(userId: string): Promise<ProgressRecordWithClass[]>;
}
