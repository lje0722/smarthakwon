export const REQUEST_PRIORITIES = ['normal', 'urgent'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = ['open', 'done'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PRIORITY_LABEL: Record<RequestPriority, string> = {
  normal: '일반',
  urgent: '급한',
};

/** 액션 종류는 목록 설정에서 자유롭게 추가·수정·삭제한다. 상태(Status)와 같은 방식의 평문 문자열. */
export type RequestAction = string;

export const DEFAULT_REQUEST_ACTIONS: string[] = ['문의', '학습관리', '반이동', '일정조율', '기타'];

/** 학생에 연결된 독립 요청. 학생 한 명에 여러 건이 동시에 있을 수 있다. */
export interface StudentRequest {
  id: string;
  studentId: string;
  action: RequestAction;
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
