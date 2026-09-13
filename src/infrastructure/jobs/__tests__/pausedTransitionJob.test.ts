import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';

const cronState = vi.hoisted(() => ({
  fn: undefined as (() => Promise<void>) | undefined,
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((_: string, fn: () => Promise<void>) => {
      cronState.fn = fn;
    }),
  },
}));

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
    findExpiredPaused: vi.fn(),
  };
}

describe('pausedTransitionJob', () => {
  let userRepo: IUserRepository;
  let scheduledFn: () => Promise<void>;

  beforeEach(async () => {
    userRepo = makeUserRepo();
    const { startPausedTransitionJob } = await import('@infrastructure/jobs/pausedTransitionJob');
    startPausedTransitionJob(userRepo);
    if (!cronState.fn) throw new Error('cronState.fn not set');
    scheduledFn = cronState.fn;
  });

  it('transiciona usuarios PAUSED expirados a PENDING_REASSIGNMENT', async () => {
    const pausedAt = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    vi.mocked(userRepo.findExpiredPaused).mockResolvedValue([
      { id: 'u-1', pausedAt },
      { id: 'u-2', pausedAt },
    ]);
    await scheduledFn();
    expect(userRepo.updateStatus).toHaveBeenCalledWith('u-1', 'PENDING_REASSIGNMENT');
    expect(userRepo.updateStatus).toHaveBeenCalledWith('u-2', 'PENDING_REASSIGNMENT');
    expect(userRepo.updateStatus).toHaveBeenCalledTimes(2);
  });

  it('llama findExpiredPaused con threshold 4 semanas atrás', async () => {
    vi.mocked(userRepo.findExpiredPaused).mockResolvedValue([]);
    const before = Date.now();
    await scheduledFn();
    const call = vi.mocked(userRepo.findExpiredPaused).mock.calls[0]?.[0] as Date;
    const expected = before - 28 * 24 * 60 * 60 * 1000;
    expect(call.getTime()).toBeGreaterThanOrEqual(expected - 1000);
    expect(call.getTime()).toBeLessThanOrEqual(expected + 1000);
  });

  it('sin usuarios expirados → no transiciona', async () => {
    vi.mocked(userRepo.findExpiredPaused).mockResolvedValue([]);
    await scheduledFn();
    expect(userRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('si el repositorio lanza → captura el error sin propagar', async () => {
    vi.mocked(userRepo.findExpiredPaused).mockRejectedValue(new Error('DB down'));
    await expect(scheduledFn()).resolves.toBeUndefined();
  });
});
