import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Consultation } from '../types';
import { GRADE_OPTIONS, type SortOrder } from '../types';
import { buildClassCatalog, listTeachers, gradeSortValue } from './classCatalog';
import { buildRosterGroups, compareStudents, filterRosterGroups, summarizeGrades } from './groupAndFilter';
import { loadLearningStatusMap } from './learningStatus';
import { applyIdOrder, reorderSubset } from '../components/rowDrag';
import { NotesModal } from '../components/NotesModal';
import { useRequests } from '../requests/RequestContext';
import { compareByOpenRequests, compareStudentsByOpenRequests, mergeOpenSummaries } from '../requests/selectors';
import { emptyOpenSummary } from '../requests/types';
import type {
  DashboardFilterState,
  LearningStatus,
  StudentAction,
} from './types';
import { EMPTY_DASHBOARD_FILTERS } from './types';
import { ClassGroup } from './ClassGroup';
import { DashboardFilters } from './DashboardFilters';
import { GradeSummaryFilter } from './GradeSummaryFilter';
import { StudentColgroup, StudentTableHeader, STUDENT_TABLE_MIN_WIDTH } from './StudentTable';

interface CurrentStudentDashboardProps {
  students: Consultation[];
  classOptions: string[];
  schoolOptions: string[];
  onSave: (student: Consultation) => void;
  searchTerm?: string;
  onResetSearch?: () => void;
  classOrder?: Record<string, string[]>;
  onClassOrderChange?: (next: Record<string, string[]>) => void;
}

interface ActionDialog {
  student: Consultation;
  action: StudentAction;
}

export const CurrentStudentDashboard: React.FC<CurrentStudentDashboardProps> = ({
  students,
  classOptions,
  schoolOptions,
  onSave,
  searchTerm = '',
  onResetSearch,
  classOrder = {},
  onClassOrderChange,
}) => {
  const [filters, setFilters] = useState<DashboardFilterState>(EMPTY_DASHBOARD_FILTERS);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<ActionDialog | null>(null);
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    school: '',
    grade: '',
    evalGrade: '',
    studentNumber: '',
    studentPhone: '',
    email: '',
  });
  const [moveClassName, setMoveClassName] = useState('');
  const [statusById, setStatusById] = useState<Record<string, LearningStatus>>({});
  const journalButtonRef = useRef<HTMLButtonElement | null>(null);
  const [journalStudentId, setJournalStudentId] = useState<string | null>(null);
  const [journalSort, setJournalSort] = useState<SortOrder | null>(null);
  const { openSummaryMap } = useRequests();

  const catalog = useMemo(() => buildClassCatalog(students), [students]);
  const groups = useMemo(() => buildRosterGroups(students, catalog), [students, catalog]);
  const summaries = useMemo(() => summarizeGrades(groups), [groups]);
  const teachers = useMemo(() => listTeachers(catalog), [catalog]);
  const visibleGroups = useMemo(() => {
    const ordered = groups.map((group) => ({
      ...group,
      students: applyIdOrder(group.students, classOrder[group.classInfo.id]),
    }));
    const summaryOf = (id: string) => openSummaryMap[id] ?? emptyOpenSummary();
    const dir = journalSort === 'asc' ? -1 : 1;
    return filterRosterGroups(ordered, filters, searchTerm, {
      sortStudents: journalSort
        ? (a, b) => compareStudentsByOpenRequests(a, b, summaryOf, compareStudents) * dir
        : undefined,
      sortGroups: journalSort
        ? (a, b) => {
          const left = mergeOpenSummaries(a.students.map((student) => summaryOf(student.id)));
          const right = mergeOpenSummaries(b.students.map((student) => summaryOf(student.id)));
          const byRequest = compareByOpenRequests(left, right);
          if (byRequest !== 0) return byRequest * dir;
          const grade = gradeSortValue(b.classInfo.gradeKey) - gradeSortValue(a.classInfo.gradeKey);
          if (grade !== 0) return grade;
          if (a.classInfo.unassigned !== b.classInfo.unassigned) return a.classInfo.unassigned ? 1 : -1;
          return a.classInfo.name.localeCompare(b.classInfo.name, 'ko');
        }
        : undefined,
    });
  }, [groups, filters, searchTerm, classOrder, openSummaryMap, journalSort]);

  const totalStudents = groups.reduce((sum, group) => sum + group.currentCount, 0);
  const totalClasses = groups.length;
  const totalRemaining = groups.reduce(
    (sum, group) => sum + (group.classInfo.unassigned ? 0 : Math.max(0, group.remainingSeats)),
    0
  );

  useEffect(() => {
    setStatusById((prev) => {
      const missing = students.map((student) => student.id).filter((id) => !prev[id]);
      if (missing.length === 0) return prev;
      return { ...prev, ...loadLearningStatusMap(missing) };
    });
  }, [students]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const openAction = (student: Consultation, action: StudentAction) => {
    if (action === 'leave-temporary' || action === 'withdraw' || action === 'enrollment-history') {
      setDialog({ student, action });
      return;
    }
    if (action === 'edit-profile') {
      setProfileDraft({
        name: student.name || '',
        school: student.school || '',
        grade: student.grade || '',
        evalGrade: student.evalGrade || '',
        studentNumber: student.studentNumber || '',
        studentPhone: student.studentPhone || '',
        email: student.email || '',
      });
      setDialog({ student, action });
      return;
    }
    setMoveClassName(student.className && student.className !== '-' ? student.className : '');
    setDialog({ student, action });
  };

  const handleReorder = (classId: string, visibleIds: string[], fromId: string, toId: string, place: 'before' | 'after') => {
    const base = classOrder[classId]
      ?? groups.find((group) => group.classInfo.id === classId)?.students.map((student) => student.id)
      ?? visibleIds;
    const next = reorderSubset(base, visibleIds, fromId, toId, place);
    if (!next || !onClassOrderChange) return;
    onClassOrderChange({ ...classOrder, [classId]: next });
    setJournalSort(null);
  };

  const confirmAction = () => {
    if (!dialog) return;
    const { student, action } = dialog;
    if (action === 'edit-profile') {
      onSave({
        ...student,
        name: profileDraft.name.trim(),
        school: profileDraft.school.trim(),
        grade: profileDraft.grade,
        evalGrade: profileDraft.evalGrade,
        studentNumber: profileDraft.studentNumber.trim(),
        studentPhone: profileDraft.studentPhone.trim(),
        email: profileDraft.email.trim(),
      });
    } else if (action === 'move-class') {
      onSave({ ...student, className: moveClassName || '-' });
    } else if (action === 'leave-temporary') {
      setMessage(`${student.name} 휴원 액션은 준비되었습니다. 아직 저장되지 않습니다.`);
    } else if (action === 'withdraw') {
      setMessage(`${student.name} 퇴원 액션은 준비되었습니다. 아직 저장되지 않습니다.`);
    }
    setDialog(null);
  };

  const journalStudent = students.find((student) => student.id === journalStudentId) ?? null;

  const closeJournal = () => {
    setJournalStudentId(null);
    window.requestAnimationFrame(() => {
      journalButtonRef.current?.focus();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <GradeSummaryFilter
        items={summaries}
        selected={filters.gradeKey}
        totalStudents={totalStudents}
        totalClasses={totalClasses}
        totalRemaining={totalRemaining}
        onSelect={(key) => setFilters((prev) => ({
          ...prev,
          gradeKey: key === 'all' ? 'all' : prev.gradeKey === key ? 'all' : key,
        }))}
      />

      <DashboardFilters
        value={filters}
        teachers={teachers}
        onChange={setFilters}
        onResetSearch={onResetSearch}
        onResetExtra={() => setJournalSort(null)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-neutral-200 bg-white">
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: STUDENT_TABLE_MIN_WIDTH }}>
            <div className="sticky top-0 z-20 bg-white">
              <table className="w-full table-fixed border-collapse text-left">
                <StudentColgroup />
                <StudentTableHeader
                  journalSort={journalSort}
                  onSortJournal={() => setJournalSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                />
              </table>
            </div>
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <ClassGroup
                  key={group.classInfo.id}
                  group={group}
                  collapsed={Boolean(collapsed[group.classInfo.id])}
                  selectedId={selectedId}
                  onToggle={() => setCollapsed((prev) => ({
                    ...prev,
                    [group.classInfo.id]: !prev[group.classInfo.id],
                  }))}
                  statusById={statusById}
                  onSave={onSave}
                  onMessage={setMessage}
                  onAction={openAction}
                  onSelect={setSelectedId}
                  onReorder={(fromId, toId, place) => handleReorder(
                    group.classInfo.id,
                    group.students.map((student) => student.id),
                    fromId,
                    toId,
                    place
                  )}
                  onOpenJournal={(student, button) => {
                    journalButtonRef.current = button;
                    setJournalStudentId(student.id);
                  }}
                />
              ))
            ) : (
              <div className="px-4 py-10 text-center text-[13px] text-neutral-400">
                조건에 맞는 학생이 없습니다.
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between border-t border-neutral-200 bg-white px-4 py-2 text-[12px] text-neutral-400">
          <span>
            {visibleGroups.length}개 반 · {visibleGroups.reduce((sum, group) => sum + group.students.length, 0)}명
          </span>
          <span>학습 상태는 ERP에서 불러오며, 정원은 프론트에서 계산합니다.</span>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-4 py-2 text-[13px] text-neutral-700 shadow-md">
          {message}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDialog(null)}>
          <div
            className="w-full max-w-md rounded-md border border-neutral-200 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-neutral-200 px-4 py-3 text-[15px] font-medium text-neutral-900">
              {dialog.action === 'edit-profile' && '학생정보 수정'}
              {dialog.action === 'move-class' && '반 이동'}
              {dialog.action === 'leave-temporary' && '휴원'}
              {dialog.action === 'withdraw' && '퇴원'}
              {dialog.action === 'enrollment-history' && '수강 이력'}
            </div>
            <div className="px-4 py-4 text-[13px] text-neutral-700">
              {dialog.action === 'edit-profile' && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    이름
                    <input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none" />
                  </label>
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    학생번호
                    <input value={profileDraft.studentNumber} onChange={(e) => setProfileDraft({ ...profileDraft, studentNumber: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none" />
                  </label>
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    학교
                    <input list="enrolled-schools" value={profileDraft.school} onChange={(e) => setProfileDraft({ ...profileDraft, school: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none" />
                  </label>
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    학년
                    <select value={profileDraft.grade} onChange={(e) => setProfileDraft({ ...profileDraft, grade: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none">
                      <option value="">-</option>
                      {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                  </label>
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    평가학년
                    <select value={profileDraft.evalGrade} onChange={(e) => setProfileDraft({ ...profileDraft, evalGrade: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none">
                      <option value="">-</option>
                      {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                  </label>
                  <label className="col-span-1 text-[12px] text-neutral-500">
                    전화
                    <input value={profileDraft.studentPhone} onChange={(e) => setProfileDraft({ ...profileDraft, studentPhone: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none" />
                  </label>
                  <label className="col-span-2 text-[12px] text-neutral-500">
                    이메일
                    <input value={profileDraft.email} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] outline-none" />
                  </label>
                  <datalist id="enrolled-schools">
                    {schoolOptions.map((school) => <option key={school} value={school} />)}
                  </datalist>
                </div>
              )}
              {dialog.action === 'move-class' && (
                <label className="block text-[12px] text-neutral-500">
                  이동할 반
                  <select
                    value={moveClassName}
                    onChange={(e) => setMoveClassName(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-neutral-200 px-2 text-[13px] text-neutral-800 outline-none"
                  >
                    <option value="">반 미배정</option>
                    {classOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              )}
              {dialog.action === 'leave-temporary' && (
                <p>{dialog.student.name} 휴원은 운영 이력으로 남기는 액션입니다. 이번 화면에서는 처리만 연결할 수 있게 두었고, 아직 저장하지 않습니다.</p>
              )}
              {dialog.action === 'withdraw' && (
                <p>{dialog.student.name} 퇴원은 운영 이력으로 남기는 액션입니다. 이번 화면에서는 처리만 연결할 수 있게 두었고, 아직 저장하지 않습니다.</p>
              )}
              {dialog.action === 'enrollment-history' && (
                <p className="text-neutral-400">연결된 수강 이력이 없습니다. 나중에 반 이동·휴원·퇴원 이력과 연결합니다.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3">
              <button type="button" onClick={() => setDialog(null)} className="h-8 rounded px-3 text-[13px] text-neutral-600 hover:bg-neutral-200">
                {dialog.action === 'enrollment-history' ? '닫기' : '취소'}
              </button>
              {dialog.action !== 'enrollment-history' && (
                <button
                  type="button"
                  onClick={confirmAction}
                  className="h-8 rounded bg-neutral-800 px-3 text-[13px] text-white hover:bg-neutral-900"
                >
                  {dialog.action === 'leave-temporary' || dialog.action === 'withdraw' ? '확인' : '저장'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {journalStudent && (
        <NotesModal
          open
          student={journalStudent}
          onSave={onSave}
          onClose={closeJournal}
        />
      )}
    </div>
  );
};
