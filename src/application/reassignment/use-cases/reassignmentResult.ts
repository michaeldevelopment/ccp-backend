import { ReassignmentWithUser } from '@domain/reassignment/repositories/IReassignmentRepository';

export interface ReassignmentResult {
  id: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: Date;
}

export function toReassignmentResult(r: ReassignmentWithUser): ReassignmentResult {
  return {
    id: r.id,
    userId: r.user.id,
    userName: r.user.name ?? r.user.email,
    status: r.status,
    createdAt: r.createdAt,
  };
}
