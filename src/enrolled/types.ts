import type { Consultation } from '../types';

export const LEARNING_LEVELS = ['High', 'Mid', 'Low'] as const;
export type LearningLevel = (typeof LEARNING_LEVELS)[number];

/** ERP에서 불러오는 학습 상태. 화면에서 직접 수정하지 않는다. */
export interface LearningStatus {
  level: LearningLevel | null;
}

/** 반 마스터. 정원·요일·시간·선생님은 여기만 둔다. */
export interface OperatingClass {
  id: string;
  name: string;
  gradeKey: string;
  teacher: string;
  days: string;
  time: string;
  capacity: number;
  unassigned: boolean;
}

export type SeatFilter = 'all' | 'open' | 'full';

export interface DashboardFilterState {
  classQuery: string;
  teacher: string;
  seat: SeatFilter;
  gradeKey: string;
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilterState = {
  classQuery: '',
  teacher: 'all',
  seat: 'all',
  gradeKey: 'all',
};

export interface ClassRosterGroup {
  classInfo: OperatingClass;
  currentCount: number;
  remainingSeats: number;
  students: Consultation[];
  matchedStudentIds: string[];
}

export interface GradeSummaryItem {
  key: string;
  label: string;
  classCount: number;
  studentCount: number;
  remainingSeats: number;
}

export type StudentAction =
  | 'edit-profile'
  | 'move-class'
  | 'leave-temporary'
  | 'withdraw'
  | 'enrollment-history';
