import type { Consultation } from '../types';
import type { OperatingClass } from './types';

const UNASSIGNED_TOKENS = new Set(['', '-', '미배정', '없음']);

const DAYS_POOL = ['월/금', '화/목', '월/수/금', '화/토', '수/금'];
const TIME_POOL = ['16:15-18:15', '14:00-16:00', '17:00-19:00', '11:15-13:15', '09:00-11:00'];

export const isUnassignedClassName = (className?: string): boolean => {
  const name = (className || '').trim();
  return UNASSIGNED_TOKENS.has(name);
};

export const extractGradeKey = (text?: string): string => {
  const raw = (text || '').trim();
  if (!raw) return '기타';
  const match = raw.match(/G\s*(\d{1,2})/i);
  if (match) return `G${Number(match[1])}`;
  if (/pre[- ]?algebra/i.test(raw)) return 'G7';
  if (/voca/i.test(raw)) return '기타';
  return '기타';
};

export const gradeSortValue = (key: string): number => {
  const match = key.match(/^G(\d{1,2})$/i);
  if (match) return Number(match[1]);
  if (key === '미배정') return -2;
  return -1;
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

interface ClassSchedule {
  teacher: string;
  days: string;
  time: string;
}

const teacherFromName = (className: string): string => {
  const withMatch = className.match(/\bwith\s+([A-Za-z가-힣]+)/i);
  return withMatch ? withMatch[1] : '-';
};

const mockCapacity = (className: string, unassigned: boolean): number => {
  if (unassigned) return 0;
  if (/1\s*:\s*1|1대1|1대 1/i.test(className)) return 1;
  return 8 + (hashString(className) % 5);
};

const mockSchedule = (className: string): ClassSchedule => {
  const hash = hashString(className);
  return {
    teacher: teacherFromName(className),
    days: DAYS_POOL[hash % DAYS_POOL.length],
    time: TIME_POOL[hash % TIME_POOL.length],
  };
};

export const classIdFromName = (className: string, gradeKey: string, unassigned: boolean): string => {
  if (unassigned) return `unassigned:${gradeKey}`;
  return `class:${className}`;
};

export const buildOperatingClass = (
  className: string,
  studentGrade?: string
): OperatingClass => {
  const unassigned = isUnassignedClassName(className);
  const gradeKey = unassigned
    ? extractGradeKey(studentGrade) === '기타'
      ? (studentGrade || '미배정')
      : extractGradeKey(studentGrade)
    : extractGradeKey(className);

  const resolvedGrade = unassigned && !gradeKey.startsWith('G') ? (studentGrade || '미배정') : gradeKey;
  const displayName = unassigned ? '반 미배정' : className.trim();
  const schedule = unassigned ? { teacher: '-', days: '-', time: '-' } : mockSchedule(className);

  return {
    id: classIdFromName(displayName, resolvedGrade, unassigned),
    name: displayName,
    gradeKey: resolvedGrade,
    teacher: schedule.teacher,
    days: schedule.days,
    time: schedule.time,
    capacity: mockCapacity(className, unassigned),
    unassigned,
  };
};

/** 원생 className 기준으로 반 마스터를 만든다. */
export const buildClassCatalog = (students: Consultation[]): OperatingClass[] => {
  const byId = new Map<string, OperatingClass>();
  for (const student of students) {
    const operating = buildOperatingClass(student.className, student.grade);
    if (!byId.has(operating.id)) byId.set(operating.id, operating);
  }
  return [...byId.values()];
};

export const listTeachers = (classes: OperatingClass[]): string[] => {
  const names = classes
    .map((item) => item.teacher)
    .filter((name) => name && name !== '-');
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'ko'));
};
