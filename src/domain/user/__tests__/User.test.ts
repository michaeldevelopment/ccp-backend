import { describe, it, expect } from 'vitest';
import { User } from '@domain/user/entities/User';
import { Role, UserStatus } from '@prisma/client';

function makeUser(status: UserStatus): User {
  return new User({
    id: '1',
    email: 'a@b.com',
    name: null,
    passwordHash: null,
    refreshTokenHash: null,
    role: Role.STUDENT,
    status,
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('User entity', () => {
  it('isActive() returns true only for ACTIVE', () => {
    expect(makeUser('ACTIVE').isActive()).toBe(true);
    expect(makeUser('PENDING_ACTIVATION').isActive()).toBe(false);
    expect(makeUser('PAUSED').isActive()).toBe(false);
  });

  it('isPendingActivation() returns true only for PENDING_ACTIVATION', () => {
    expect(makeUser('PENDING_ACTIVATION').isPendingActivation()).toBe(true);
    expect(makeUser('ACTIVE').isPendingActivation()).toBe(false);
  });

  it('isPaused() returns true only for PAUSED', () => {
    expect(makeUser('PAUSED').isPaused()).toBe(true);
    expect(makeUser('ACTIVE').isPaused()).toBe(false);
  });

  it('canLogin() returns false for PENDING_ACTIVATION and PAUSED', () => {
    expect(makeUser('PENDING_ACTIVATION').canLogin()).toBe(false);
    expect(makeUser('PAUSED').canLogin()).toBe(false);
    expect(makeUser('ACTIVE').canLogin()).toBe(true);
    expect(makeUser('GRADUATED').canLogin()).toBe(true);
    expect(makeUser('PENDING_REASSIGNMENT').canLogin()).toBe(true);
  });
});
