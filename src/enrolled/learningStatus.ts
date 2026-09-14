import type { LearningLevel, LearningStatus } from './types';
import { LEARNING_LEVELS } from './types';

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * 기존 ERP 학습 상태를 불러오는 adapter.
 * 실제 API가 준비되면 이 함수만 교체한다.
 */
export function fetchLearningLevel(studentId: string): LearningLevel | null {
  const seed = hashString(studentId);
  if (seed % 11 === 0) return null;
  return LEARNING_LEVELS[seed % LEARNING_LEVELS.length];
}

export const loadLearningStatusMap = (studentIds: string[]): Record<string, LearningStatus> => {
  const next: Record<string, LearningStatus> = {};
  for (const id of studentIds) {
    next[id] = { level: fetchLearningLevel(id) };
  }
  return next;
};
