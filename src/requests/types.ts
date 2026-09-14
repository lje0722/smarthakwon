export const REQUEST_PRIORITIES = ['normal', 'urgent'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = ['open', 'done'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PRIORITY_LABEL: Record<RequestPriority, string> = {
  normal: '일반',
  urgent: '급한',
};

/** 학생에 연결된 독립 요청. 학생 한 명에 여러 건이 동시에 있을 수 있다. */
export interface StudentRequest {
  id: string;
  studentId: string;
  content: string;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  createdBy: string | null;
  completedAt: string | null;
  completedBy: string | null;
}

export interface OpenRequestSummary {
  urgent: number;
  normal: number;
  oldestUrgentAt: number | null;
  oldestNormalAt: number | null;
}

export const emptyOpenSummary = (): OpenRequestSummary => ({
  urgent: 0,
  normal: 0,
  oldestUrgentAt: null,
  oldestNormalAt: null,
});
