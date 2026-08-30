import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDashboardSummaryUseCase } from '@application/dashboard/use-cases/GetDashboardSummaryUseCase';
import {
  IDashboardRepository,
  DashboardSummary,
} from '@domain/dashboard/repositories/IDashboardRepository';

function makeDashboardRepo(): IDashboardRepository {
  return { getSummary: vi.fn(), getUpcomingNotifications: vi.fn() };
}

const mockSummary: DashboardSummary = {
  stats: {
    activeStudents: 28,
    totalStudents: 32,
    activeGroups: 4,
    pendingReassignments: 3,
    activeModuleNumbers: [3, 5, 7, 9],
  },
  topGroups: [
    {
      id: 'group-1',
      name: 'Cohorte Marzo 2026',
      currentModule: 5,
      currentModuleTitle: 'Fundamentos de la consciencia',
      entryModule: 1,
      progressPercent: 55.5,
      studentCount: 8,
    },
  ],
};

describe('GetDashboardSummaryUseCase', () => {
  let dashboardRepo: IDashboardRepository;
  let useCase: GetDashboardSummaryUseCase;

  beforeEach(() => {
    dashboardRepo = makeDashboardRepo();
    useCase = new GetDashboardSummaryUseCase(dashboardRepo);
    vi.mocked(dashboardRepo.getSummary).mockResolvedValue(mockSummary);
  });

  it('retorna stats y topGroups del repo', async () => {
    const result = await useCase.execute();
    expect(result.stats.activeStudents).toBe(28);
    expect(result.stats.totalStudents).toBe(32);
    expect(result.stats.activeGroups).toBe(4);
    expect(result.stats.pendingReassignments).toBe(3);
    expect(result.stats.activeModuleNumbers).toEqual([3, 5, 7, 9]);
    expect(result.topGroups).toHaveLength(1);
    expect(result.topGroups[0]).toMatchObject({
      id: 'group-1',
      currentModule: 5,
      currentModuleTitle: 'Fundamentos de la consciencia',
      progressPercent: 55.5,
      studentCount: 8,
    });
  });

  it('delega al repo una sola vez', async () => {
    await useCase.execute();
    expect(dashboardRepo.getSummary).toHaveBeenCalledOnce();
  });
});
