import {
  IDashboardRepository,
  DashboardSummary,
} from '@domain/dashboard/repositories/IDashboardRepository';

export class GetDashboardSummaryUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async execute(): Promise<DashboardSummary> {
    return this.dashboardRepo.getSummary();
  }
}
