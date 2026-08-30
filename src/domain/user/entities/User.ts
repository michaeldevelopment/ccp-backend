import { Role, UserStatus } from '@prisma/client';

export interface UserProps {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  refreshTokenHash: string | null;
  role: Role;
  status: UserStatus;
  groupId: string | null;
  entryModule: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly passwordHash: string | null;
  readonly refreshTokenHash: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly groupId: string | null;
  readonly entryModule: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.refreshTokenHash = props.refreshTokenHash;
    this.role = props.role;
    this.status = props.status;
    this.groupId = props.groupId;
    this.entryModule = props.entryModule;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  isPendingActivation(): boolean {
    return this.status === 'PENDING_ACTIVATION';
  }

  isPaused(): boolean {
    return this.status === 'PAUSED';
  }

  canLogin(): boolean {
    return this.status !== 'PENDING_ACTIVATION' && this.status !== 'PAUSED';
  }
}
