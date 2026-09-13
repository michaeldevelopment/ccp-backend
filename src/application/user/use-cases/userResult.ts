import { User } from '@domain/user/entities/User';

export interface UserResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  groupId: string | null;
  entryModule: number | null;
  pausedAt: string | null;
  graduatedAt: string | null;
}

export function toUserResult(user: User): UserResult {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    groupId: user.groupId,
    entryModule: user.entryModule,
    pausedAt: user.pausedAt ? user.pausedAt.toISOString() : null,
    graduatedAt: user.graduatedAt ? user.graduatedAt.toISOString() : null,
  };
}
