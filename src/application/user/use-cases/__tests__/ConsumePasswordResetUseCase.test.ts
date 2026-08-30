import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsumePasswordResetUseCase } from '@application/user/use-cases/ConsumePasswordResetUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import {
  IPasswordResetTokenRepository,
  PasswordResetTokenRecord,
} from '@domain/user/repositories/IPasswordResetTokenRepository';
import { NotFoundError, BusinessLogicError } from '@domain/shared/errors';

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

function makeTokenRepo(): IPasswordResetTokenRepository {
  return { create: vi.fn(), findByToken: vi.fn(), markAsUsed: vi.fn() };
}

function makeTokenRecord(
  overrides: Partial<PasswordResetTokenRecord> = {}
): PasswordResetTokenRecord {
  return {
    id: 'tok-1',
    userId: 'u-1',
    token: 'valid-token',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    ...overrides,
  };
}

describe('ConsumePasswordResetUseCase', () => {
  let userRepo: IUserRepository;
  let tokenRepo: IPasswordResetTokenRepository;
  let useCase: ConsumePasswordResetUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    tokenRepo = makeTokenRepo();
    useCase = new ConsumePasswordResetUseCase(userRepo, tokenRepo);
  });

  it('token válido → actualiza password y marca token como usado', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeTokenRecord());
    vi.mocked(userRepo.updatePassword).mockResolvedValue(undefined);
    vi.mocked(tokenRepo.markAsUsed).mockResolvedValue(undefined);

    await useCase.execute({ token: 'valid-token', newPassword: 'nuevaPass123' });

    expect(userRepo.updatePassword).toHaveBeenCalledWith('u-1', expect.stringMatching(/^\$2/));
    expect(tokenRepo.markAsUsed).toHaveBeenCalledWith('tok-1');
  });

  it('token inexistente → NotFoundError', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(null);
    await expect(useCase.execute({ token: 'bad', newPassword: 'pass1234' })).rejects.toThrow(
      NotFoundError
    );
    expect(userRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('token ya usado → BusinessLogicError', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(makeTokenRecord({ usedAt: new Date() }));
    await expect(useCase.execute({ token: 'used', newPassword: 'pass1234' })).rejects.toThrow(
      BusinessLogicError
    );
    expect(userRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('token expirado → BusinessLogicError', async () => {
    vi.mocked(tokenRepo.findByToken).mockResolvedValue(
      makeTokenRecord({ expiresAt: new Date(Date.now() - 1000) })
    );
    await expect(useCase.execute({ token: 'expired', newPassword: 'pass1234' })).rejects.toThrow(
      BusinessLogicError
    );
    expect(userRepo.updatePassword).not.toHaveBeenCalled();
  });
});
