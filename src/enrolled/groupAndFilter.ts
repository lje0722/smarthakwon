import type { Consultation } from '../types';
import { buildClassCatalog, buildOperatingClass, gradeSortValue } from './classCatalog';
import type {
  ClassRosterGroup,
  DashboardFilterState,
  GradeSummaryItem,
  OperatingClass,
} from './types';

export const seatRemaining = (capacity: number, currentCount: number): number =>
  capacity - currentCount;

export const seatBadgeText = (group: Pick<ClassRosterGroup, 'classInfo' | 'currentCount' | 'remainingSeats'>): string => {
  if (group.classInfo.unassigned) return '';
  if (group.remainingSeats > 0) return `${group.remainingSeats}석 남음`;
  if (group.remainingSeats === 0) return '마감';
  return `정원 초과 ${-group.remainingSeats}명`;
};

const includesIgnoreCase = (value: string, query: string): boolean =>
  value.toLowerCase().includes(query.trim().toLowerCase());

export const compareStudents = (a: Consultation, b: Consultation): number => {
  const an = (a.studentNumber || '').replace(/\D/g, '');
  const bn = (b.studentNumber || '').replace(/\D/g, '');
  if (an && bn && an !== bn) return an.localeCompare(bn, undefined, { numeric: true });
  return (a.name || '').localeCompare(b.name || '', 'ko');
};

export const buildRosterGroups = (
  students: Consultation[],
  catalog?: OperatingClass[]
): ClassRosterGroup[] => {
  const classes = catalog ?? buildClassCatalog(students);
  const byId = new Map<string, ClassRosterGroup>();

  for (const classInfo of classes) {
    byId.set(classInfo.id, {
      classInfo,
      currentCount: 0,
      remainingSeats: classInfo.unassigned ? 0 : classInfo.capacity,
      students: [],
      matchedStudentIds: [],
    });
  }

  for (const student of students) {
    const classInfo = buildOperatingClass(student.className, student.grade);
    let group = byId.get(classInfo.id);
    if (!group) {
      group = {
        classInfo,
        currentCount: 0,
        remainingSeats: classInfo.unassigned ? 0 : classInfo.capacity,
        students: [],
        matchedStudentIds: [],
      };
      byId.set(classInfo.id, group);
    }
    group.students.push(student);
  }

  for (const group of byId.values()) {
    group.students.sort(compareStudents);
    group.currentCount = group.students.length;
    group.remainingSeats = group.classInfo.unassigned
      ? 0
      : seatRemaining(group.classInfo.capacity, group.currentCount);
  }

  return [...byId.values()].sort((a, b) => {
    const grade = gradeSortValue(b.classInfo.gradeKey) - gradeSortValue(a.classInfo.gradeKey);
    if (grade !== 0) return grade;
    if (a.classInfo.unassigned !== b.classInfo.unassigned) return a.classInfo.unassigned ? 1 : -1;
    return a.classInfo.name.localeCompare(b.classInfo.name, 'ko');
  });
};

export const summarizeGrades = (groups: ClassRosterGroup[]): GradeSummaryItem[] => {
  const byGrade = new Map<string, GradeSummaryItem>();
  for (const group of groups) {
    const key = group.classInfo.gradeKey;
    const current = byGrade.get(key) ?? {
      key,
      label: key,
      classCount: 0,
      studentCount: 0,
      remainingSeats: 0,
    };
    current.classCount += 1;
    current.studentCount += group.currentCount;
    if (!group.classInfo.unassigned) {
      current.remainingSeats += Math.max(0, group.remainingSeats);
    }
    byGrade.set(key, current);
  }

  return [...byGrade.values()].sort(
    (a, b) => gradeSortValue(b.key) - gradeSortValue(a.key) || a.key.localeCompare(b.key, 'ko')
  );
};

export const filterRosterGroups = (
  groups: ClassRosterGroup[],
  filters: DashboardFilterState,
  headerQuery = '',
  options?: {
    studentVisible?: (student: Consultation) => boolean;
    sortStudents?: (a: Consultation, b: Consultation) => number;
    sortGroups?: (a: ClassRosterGroup, b: ClassRosterGroup) => number;
  }
): ClassRosterGroup[] => {
  const search = headerQuery.trim();
  const classQuery = filters.classQuery.trim();

  const next = groups.flatMap((group) => {
    if (filters.gradeKey !== 'all' && group.classInfo.gradeKey !== filters.gradeKey) return [];
    if (filters.teacher !== 'all' && group.classInfo.teacher !== filters.teacher) return [];
    if (classQuery && !includesIgnoreCase(group.classInfo.name, classQuery)) return [];

    if (filters.seat === 'open') {
      if (group.classInfo.unassigned || group.remainingSeats <= 0) return [];
    }
    if (filters.seat === 'full') {
      if (group.classInfo.unassigned || group.remainingSeats > 0) return [];
    }

    let students = group.students;
    if (search) {
      students = students.filter((student) =>
        includesIgnoreCase(student.name || '', search) || includesIgnoreCase(student.school || '', search)
      );
    }
    if (options?.studentVisible) {
      students = students.filter(options.studentVisible);
    }
    if (options?.sortStudents) {
      students = [...students].sort(options.sortStudents);
    }

    if (students.length === 0) return [];

    return [{
      ...group,
      students,
      matchedStudentIds: search ? students.map((student) => student.id) : [],
    }];
  });

  if (options?.sortGroups) {
    return [...next].sort(options.sortGroups);
  }
  return next;
};
