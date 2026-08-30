export type ReassignmentStatus = 'PENDING' | 'RESOLVED' | 'GRADUATED' | 'UNDONE';

export interface ReassignmentRecord {
  id: string;
  userId: string;
  status: ReassignmentStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ReassignmentWithUser extends ReassignmentRecord {
  user: {
    id: string;
    name: string | null;
    email: string;
    entryModule: number | null;
    groupId: string | null;
  };
}

export interface IReassignmentRepository {
  findById(id: string): Promise<ReassignmentRecord | null>;
  findByIdWithUser(id: string): Promise<ReassignmentWithUser | null>;
  findByUserId(userId: string): Promise<ReassignmentRecord | null>;
  findPending(): Promise<ReassignmentWithUser[]>;
  updateStatus(
    id: string,
    status: ReassignmentStatus,
    resolvedAt?: Date | null
  ): Promise<ReassignmentRecord>;
  resolveAndActivateUser(
    reassignmentId: string,
    userId: string,
    groupId: string,
    entryModule: number
  ): Promise<void>;
  graduateUser(reassignmentId: string, userId: string): Promise<void>;
  undoResolution(reassignmentId: string, userId: string, wasResolved: boolean): Promise<void>;
}
