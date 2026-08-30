export interface DashboardStats {
  activeStudents: number;
  totalStudents: number;
  activeGroups: number;
  pendingReassignments: number;
  activeModuleNumbers: number[];
}

export interface DashboardTopGroup {
  id: string;
  name: string;
  currentModule: number;
  currentModuleTitle: string;
  entryModule: number;
  progressPercent: number;
  studentCount: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  topGroups: DashboardTopGroup[];
}

export type NotificationItem =
  | {
      type: 'REASSIGNMENT';
      createdAt: Date;
      reassignmentId: string;
      userName: string;
    }
  | {
      type: 'SCHEDULED_CLASS';
      createdAt: Date;
      classId: string;
      classTitle: string;
      scheduledAt: Date;
    };

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummary>;
  getUpcomingNotifications(): Promise<NotificationItem[]>;
}
