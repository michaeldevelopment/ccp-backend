import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '@application/user/use-cases/LoginUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { User } from '@domain/user/entities/User';
import { Role, UserStatus } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '@domain/shared/errors';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

function makeUser(status: UserStatus, passwordHash = '$hash'): User {
  return new User({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    passwordHash,
    refreshTokenHash: null,
    role: Role.STUDENT,
    status,
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
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

describe('LoginUseCase', () => {
  let userRepo: IUserRepository;
  let jwtService: IJwtService;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    jwtService = makeJwtService();
    useCase = new LoginUseCase(userRepo, jwtService);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it('returns tokens and user on valid credentials', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser('ACTIVE'));
    const result = await useCase.execute({ email: 'test@example.com', password: 'pass' });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('raw-refresh');
    expect(result.user.id).toBe('user-1');
    expect(userRepo.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'hashed-refresh',
      expect.any(Date)
    );
  });

  it('throws UnauthorizedError when user not found', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    await expect(useCase.execute({ email: 'x@x.com', password: 'p' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('throws UnauthorizedError when password is wrong', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser('ACTIVE'));
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(useCase.execute({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('throws ForbiddenError for PENDING_ACTIVATION user', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser('PENDING_ACTIVATION'));
    await expect(useCase.execute({ email: 'test@example.com', password: 'p' })).rejects.toThrow(
      ForbiddenError
    );
  });

  it('throws ForbiddenError for PAUSED user', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser('PAUSED'));
    await expect(useCase.execute({ email: 'test@example.com', password: 'p' })).rejects.toThrow(
      ForbiddenError
    );
  });

  it('throws UnauthorizedError when passwordHash is null', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(
      makeUser('ACTIVE', null as unknown as string)
    );
    await expect(useCase.execute({ email: 'test@example.com', password: 'p' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('runs bcrypt.compare even when user not found (timing safety)', async () => {
    vi.mocked(bcrypt.compare).mockClear();
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    await useCase.execute({ email: 'ghost@x.com', password: 'p' }).catch(() => {});
    expect(bcrypt.compare).toHaveBeenCalledOnce();
  });
});
