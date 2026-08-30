import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordResetUseCase } from '@application/user/use-cases/RequestPasswordResetUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IPasswordResetTokenRepository } from '@domain/user/repositories/IPasswordResetTokenRepository';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { User } from '@domain/user/entities/User';
import { Role } from '@prisma/client';

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

function makePasswordResetTokenRepo(): IPasswordResetTokenRepository {
  return {
    create: vi.fn(),
    findByToken: vi.fn(),
    markAsUsed: vi.fn(),
  };
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
    email: 'test@example.com',
    name: 'Test',
    passwordHash: '$hash',
    refreshTokenHash: null,
    role: Role.STUDENT,
    status: 'ACTIVE',
    groupId: null,
    entryModule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('RequestPasswordResetUseCase', () => {
  let userRepo: IUserRepository;
  let tokenRepo: IPasswordResetTokenRepository;
  let emailService: IEmailService;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    tokenRepo = makePasswordResetTokenRepo();
    emailService = makeEmailService();
    useCase = new RequestPasswordResetUseCase(userRepo, tokenRepo, emailService);
  });

  it('creates token and sends email when user exists', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined);
    await useCase.execute({ email: 'test@example.com' });
    expect(tokenRepo.create).toHaveBeenCalledOnce();
    const createArg = vi.mocked(tokenRepo.create).mock.calls[0][0];
    expect(createArg.userId).toBe('user-1');
    expect(createArg.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining(createArg.token)
    );
  });

  it('returns void without creating token when user does not exist', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    await useCase.execute({ email: 'ghost@example.com' });
    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('does not throw when email service fails', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(new Error('SendGrid down'));
    await expect(useCase.execute({ email: 'test@example.com' })).resolves.toBeUndefined();
  });
});
