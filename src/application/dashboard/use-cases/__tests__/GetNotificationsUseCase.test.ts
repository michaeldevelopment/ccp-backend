import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetNotificationsUseCase } from '@application/dashboard/use-cases/GetNotificationsUseCase';
import {
  IDashboardRepository,
  NotificationItem,
} from '@domain/dashboard/repositories/IDashboardRepository';

function makeDashboardRepo(): IDashboardRepository {
  return { getSummary: vi.fn(), getUpcomingNotifications: vi.fn() };
}

describe('GetNotificationsUseCase', () => {
  let dashboardRepo: IDashboardRepository;
  let useCase: GetNotificationsUseCase;

  beforeEach(() => {
    dashboardRepo = makeDashboardRepo();
    useCase = new GetNotificationsUseCase(dashboardRepo);
  });

  it('retorna reasignaciones y clases programadas con total correcto', async () => {
    const items: NotificationItem[] = [
      { type: 'REASSIGNMENT', createdAt: new Date(), reassignmentId: 'ra-1', userName: 'Test' },
      {
        type: 'SCHEDULED_CLASS',
        createdAt: new Date(),
        classId: 'cls-1',
        classTitle: 'Intro',
        scheduledAt: new Date(),
      },
    ];
    vi.mocked(dashboardRepo.getUpcomingNotifications).mockResolvedValue(items);
    const result = await useCase.execute();
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].type).toBe('REASSIGNMENT');
    expect(result.items[1].type).toBe('SCHEDULED_CLASS');
  });

  it('sin notificaciones → total=0 e items vacío', async () => {
    vi.mocked(dashboardRepo.getUpcomingNotifications).mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
