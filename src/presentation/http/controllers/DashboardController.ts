import { Request, Response } from 'express';
import { GetDashboardSummaryUseCase } from '@application/dashboard/use-cases/GetDashboardSummaryUseCase';
import { GetNotificationsUseCase } from '@application/dashboard/use-cases/GetNotificationsUseCase';
import { PrismaDashboardRepository } from '@infrastructure/persistence/prisma/PrismaDashboardRepository';

const dashboardRepo = new PrismaDashboardRepository();
const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dashboardRepo);
const getNotificationsUseCase = new GetNotificationsUseCase(dashboardRepo);

export class DashboardController {
  async summary(_req: Request, res: Response): Promise<void> {
    const result = await getDashboardSummaryUseCase.execute();
    res.status(200).json(result);
  }

  async notifications(_req: Request, res: Response): Promise<void> {
    const result = await getNotificationsUseCase.execute();
    res.status(200).json(result);
  }
}
