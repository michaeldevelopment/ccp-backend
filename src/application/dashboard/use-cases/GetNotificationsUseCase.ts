import {
  IDashboardRepository,
  NotificationItem,
} from '@domain/dashboard/repositories/IDashboardRepository';

export interface NotificationsResult {
  total: number;
  items: NotificationItem[];
}

export class GetNotificationsUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async execute(): Promise<NotificationsResult> {
    const items = await this.dashboardRepo.getUpcomingNotifications();
    return { total: items.length, items };
  }
}
