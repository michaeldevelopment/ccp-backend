import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidateActivationTokenUseCase } from '@application/user/use-cases/ValidateActivationTokenUseCase';
import {
  IActivationTokenRepository,
  ActivationTokenRecord,
} from '@domain/user/repositories/IActivationTokenRepository';
import { NotFoundError, GoneError } from '@domain/shared/errors';

function makeTokenRepo(): IActivationTokenRepository {
  return { findByToken: vi.fn(), markAsUsed: vi.fn(), create: vi.fn() };
}

function makeRecord(usedAt: Date | null): ActivationTokenRecord {
  return {
    id: 'token-1',
    userId: 'user-1',
    token: 'abc123',
    usedAt,
    user: { email: 'test@example.com' },
  };
}

describe('ValidateActivationTokenUseCase', () => {
  let repo: IActivationTokenRepository;
  let useCase: ValidateActivationTokenUseCase;

  beforeEach(() => {
    repo = makeTokenRepo();
    useCase = new ValidateActivationTokenUseCase(repo);
  });

  it('returns email when token is valid and unused', async () => {
    vi.mocked(repo.findByToken).mockResolvedValue(makeRecord(null));
    const result = await useCase.execute({ token: 'abc123' });
    expect(result.email).toBe('test@example.com');
  });

  it('throws NotFoundError when token does not exist', async () => {
    vi.mocked(repo.findByToken).mockResolvedValue(null);
    await expect(useCase.execute({ token: 'bad' })).rejects.toThrow(NotFoundError);
  });

  it('throws GoneError (410) when token has already been used', async () => {
    vi.mocked(repo.findByToken).mockResolvedValue(makeRecord(new Date()));
    const err = await useCase.execute({ token: 'abc123' }).catch((e) => e);
    expect(err).toBeInstanceOf(GoneError);
    expect(err.statusCode).toBe(410);
  });
});
