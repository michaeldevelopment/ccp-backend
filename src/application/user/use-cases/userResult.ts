import { User } from '@domain/user/entities/User';

export interface UserResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  groupId: string | null;
  entryModule: number | null;
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
  };
}
