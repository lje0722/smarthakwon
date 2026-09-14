import type { RequestPriority, RequestStatus, StudentRequest } from './types';

const STORAGE_KEY = 'smarthakwon.studentRequests.v1';

export interface RequestRepository {
  load(): Promise<StudentRequest[]>;
  saveAll(requests: StudentRequest[]): Promise<void>;
}

const isPriority = (value: unknown): value is RequestPriority =>
  value === 'normal' || value === 'urgent';

const isStatus = (value: unknown): value is RequestStatus =>
  value === 'open' || value === 'done';

const parseRequest = (raw: unknown): StudentRequest | null => {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.studentId !== 'string' || typeof row.content !== 'string') {
    return null;
  }
  if (!isPriority(row.priority) || !isStatus(row.status) || typeof row.createdAt !== 'string') {
    return null;
  }
  return {
    id: row.id,
    studentId: row.studentId,
    content: row.content,
    priority: row.priority,
    status: row.status,
    createdAt: row.createdAt,
    createdBy: typeof row.createdBy === 'string' ? row.createdBy : null,
    completedAt: typeof row.completedAt === 'string' ? row.completedAt : null,
    completedBy: typeof row.completedBy === 'string' ? row.completedBy : null,
  };
};

/** 이 브라우저 localStorage. 새로고침 후에도 유지된다. 서버가 아니다. */
export const localRequestRepository: RequestRepository = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { requests?: unknown };
      if (!Array.isArray(parsed.requests)) return [];
      return parsed.requests.map(parseRequest).filter((row): row is StudentRequest => Boolean(row));
    } catch {
      throw new Error('이 브라우저의 요청 저장 데이터를 읽지 못했습니다.');
    }
  },
  async saveAll(requests) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, requests }));
    } catch {
      throw new Error('이 브라우저에 요청을 저장하지 못했습니다.');
    }
  },
};

/**
 * 서버 API 연결 지점. 아직 백엔드가 없어 사용하지 않는다.
 * 연결되면 requestRepository 할당만 바꾸면 된다.
 */
export const unconnectedRemoteRepository: RequestRepository = {
  async load() {
    throw new Error('요청 서버가 연결되어 있지 않습니다.');
  },
  async saveAll() {
    throw new Error('요청 서버가 연결되어 있지 않습니다.');
  },
};

export const requestRepository: RequestRepository = localRequestRepository;
export const REQUEST_PERSISTENCE: 'browser' | 'server' = 'browser';
