import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivateAccountUseCase } from '@application/user/use-cases/ActivateAccountUseCase';
import {
  IActivationTokenRepository,
  ActivationTokenRecord,
} from '@domain/user/repositories/IActivationTokenRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { NotFoundError, GoneError } from '@domain/shared/errors';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

function makeTokenRepo(): IActivationTokenRepository {
  return { findByToken: vi.fn(), markAsUsed: vi.fn(), create: vi.fn() };
}

function makeUserRepo(): IUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByRefreshTokenHash: vi.fn(),
    updateRefreshTokenHash: vi.fn(),
    updatePassword: vi.fn(),
    updateStatus: vi.fn(),
    activateUserComplete: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByRole: vi.fn(),
  };
}

function makeJwtService(): IJwtService {
  return {
    signAccessToken: vi.fn().mockReturnValue('access-token'),
    verifyAccessToken: vi.fn(),
    generateRefreshToken: vi.fn().mockReturnValue('raw-refresh'),
    hashRefreshToken: vi.fn().mockReturnValue('hashed-refresh'),
  };
}

function makeRecord(usedAt: Date | null): ActivationTokenRecord {
  return { id: 'token-1', userId: 'user-1', token: 'abc', usedAt, user: { email: 'a@b.com' } };
}

function makeActivatedUser(): User {
  return new User({
    id: 'user-1',
    email: 'a@b.com',
    name: 'Test',
    passwordHash: '$hashed',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ActivateAccountUseCase', () => {
  let tokenRepo: IActivationTokenRepository;
  let userRepo: IUserRepository;
  let jwtService: IJwtService;
  let useCase: ActivateAccountUseCase;

  beforeEach(() => {
    tokenRepo = makeTokenRepo();
    userRepo = makeUserRepo();
    jwtService = makeJwtService();
    useCase = new ActivateAccountUseCase(tokenRepo, userRepo, jwtService);
    vi.mocked(bcrypt.hash).mockResolvedValue('$hashed-password' as never);
    vi.mocked(userRepo.activateUserComplete).mockResolvedValue(makeActivatedUser());
  });

  it('activates account and returns tokens', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeRecord(null));
    const result = await useCase.execute({ token: 'abc', name: 'Alice', password: 'secret123' });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('raw-refresh');
    expect(userRepo.activateUserComplete).toHaveBeenCalledWith(
      'user-1',
      'token-1',
      expect.objectContaining({ name: 'Alice' })
    );
  });

  it('hashes the password with salt rounds 12', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeRecord(null));
    await useCase.execute({ token: 'abc', name: 'Alice', password: 'secret123' });
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 12);
  });

  it('calls activateUserComplete with hashed password, never plaintext', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeRecord(null));
    await useCase.execute({ token: 'abc', name: 'Alice', password: 'secret123' });
    expect(userRepo.activateUserComplete).toHaveBeenCalledWith('user-1', 'token-1', {
      name: 'Alice',
      passwordHash: '$hashed-password',
      refreshTokenHash: 'hashed-refresh',
      refreshTokenExpiresAt: expect.any(Date),
    });
  });

  it('throws NotFoundError when token does not exist', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(null);
    await expect(
      useCase.execute({ token: 'bad', name: 'A', password: 'password1' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws GoneError when token is already used', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeRecord(new Date()));
    const err = await useCase
      .execute({ token: 'abc', name: 'A', password: 'password1' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(GoneError);
    expect(err.statusCode).toBe(410);
  });
});
