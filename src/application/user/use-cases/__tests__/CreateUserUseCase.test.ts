import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateUserUseCase } from '@application/user/use-cases/CreateUserUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IActivationTokenRepository } from '@domain/user/repositories/IActivationTokenRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';
import { ConflictError } from '@domain/shared/errors';

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

function makeActivationTokenRepo(): IActivationTokenRepository {
  return { findByToken: vi.fn(), markAsUsed: vi.fn(), create: vi.fn() };
}

function makeEmailService(): IEmailService {
  return {
    sendPasswordResetEmail: vi.fn(),
    sendActivationEmail: vi.fn(),
    sendNewClassEmail: vi.fn(),
  };
}

function makeUser(): User {
  return new User({
    id: 'user-1',
    email: 'new@example.com',
    name: null,
    passwordHash: null,
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'PENDING_ACTIVATION',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateUserUseCase', () => {
  let userRepo: IUserRepository;
  let tokenRepo: IActivationTokenRepository;
  let emailService: IEmailService;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    tokenRepo = makeActivationTokenRepo();
    emailService = makeEmailService();
    useCase = new CreateUserUseCase(userRepo, tokenRepo, emailService);
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(makeUser());
    vi.mocked(tokenRepo.create).mockResolvedValue(undefined);
    vi.mocked(emailService.sendActivationEmail).mockResolvedValue(undefined);
  });

  it('creates user and sends activation email', async () => {
    const result = await useCase.execute({ email: 'new@example.com', role: Role.STUDENT });
    expect(userRepo.create).toHaveBeenCalledWith({ email: 'new@example.com', role: Role.STUDENT });
    expect(tokenRepo.create).toHaveBeenCalledOnce();
    expect(emailService.sendActivationEmail).toHaveBeenCalledWith(
      'new@example.com',
      expect.stringContaining('token')
    );
    expect(result.status).toBe('PENDING_ACTIVATION');
  });

  it('creates activation token with a UUID', async () => {
    await useCase.execute({ email: 'new@example.com', role: Role.STUDENT });
    const tokenArg = vi.mocked(tokenRepo.create).mock.calls[0][0];
    expect(tokenArg.userId).toBe('user-1');
    expect(typeof tokenArg.token).toBe('string');
    expect(tokenArg.token.length).toBeGreaterThan(0);
  });

  it('throws ConflictError when email already exists', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
    await expect(useCase.execute({ email: 'new@example.com', role: Role.STUDENT })).rejects.toThrow(
      ConflictError
    );
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('does not throw when email service fails', async () => {
    vi.mocked(emailService.sendActivationEmail).mockRejectedValue(new Error('SendGrid down'));
    await expect(
      useCase.execute({ email: 'new@example.com', role: Role.STUDENT })
    ).resolves.toBeDefined();
  });
});
