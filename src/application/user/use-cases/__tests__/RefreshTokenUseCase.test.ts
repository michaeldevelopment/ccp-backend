import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenUseCase } from '@application/user/use-cases/RefreshTokenUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { User } from '@domain/user/entities/User';
import { Role, UserStatus } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '@domain/shared/errors';

function makeUser(status: UserStatus): User {
  return new User({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    passwordHash: '$hash',
    refreshTokenHash: 'stored-hash',
    role: Role.STUDENT,
    status,
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeResult(status: UserStatus, refreshTokenExpiresAt: Date | null = null) {
  return { user: makeUser(status), refreshTokenExpiresAt };
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
    signAccessToken: vi.fn().mockReturnValue('new-access-token'),
    verifyAccessToken: vi.fn(),
    generateRefreshToken: vi.fn().mockReturnValue('new-raw-refresh'),
    hashRefreshToken: vi.fn().mockReturnValue('new-hash'),
  };
}

describe('RefreshTokenUseCase', () => {
  let userRepo: IUserRepository;
  let jwtService: IJwtService;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    jwtService = makeJwtService();
    useCase = new RefreshTokenUseCase(userRepo, jwtService);
  });

  it('returns new token pair and rotates the stored hash', async () => {
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(makeResult('ACTIVE'));
    const result = await useCase.execute({ refreshToken: 'old-raw' });
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-raw-refresh');
    expect(userRepo.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'new-hash',
      expect.any(Date)
    );
  });

  it('throws UnauthorizedError when token hash not found', async () => {
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(null);
    await expect(useCase.execute({ refreshToken: 'bad-token' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when refresh token has expired', async () => {
    const expired = new Date(Date.now() - 1000);
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(makeResult('ACTIVE', expired));
    await expect(useCase.execute({ refreshToken: 'old-raw' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws ForbiddenError for PAUSED user', async () => {
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(makeResult('PAUSED'));
    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError for PENDING_ACTIVATION user', async () => {
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(makeResult('PENDING_ACTIVATION'));
    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toThrow(ForbiddenError);
  });

  it('does not reuse the old hash after rotation', async () => {
    vi.mocked(userRepo.findByRefreshTokenHash).mockResolvedValue(makeResult('ACTIVE'));
    await useCase.execute({ refreshToken: 'old-raw' });
    const callArg = vi.mocked(userRepo.updateRefreshTokenHash).mock.calls[0];
    expect(callArg[1]).toBe('new-hash');
    expect(callArg[1]).not.toBe('stored-hash');
  });
});
