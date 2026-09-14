import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { Consultation } from '../types';
import type { SortOrder } from '../types';
import type { LearningStatus, StudentAction } from './types';
import { StudentRow } from './StudentRow';

export const STUDENT_TABLE_MIN_WIDTH = 1360;

export const StudentColgroup: React.FC = () => (
  <colgroup>
    <col style={{ width: 72 }} />
    <col style={{ width: 128 }} />
    <col style={{ width: 140 }} />
    <col style={{ width: 72 }} />
    <col style={{ width: 80 }} />
    <col style={{ width: 80 }} />
    <col style={{ width: 220 }} />
    <col style={{ width: 88 }} />
    <col style={{ width: 40 }} />
  </colgroup>
);

export const StudentTableHeader: React.FC<{
  journalSort?: SortOrder | null;
  onSortJournal?: () => void;
}> = ({ journalSort, onSortJournal }) => (
  <thead className="bg-white text-[12px] font-medium text-neutral-500">
    <tr className="h-10 border-b border-neutral-200">
      <th className="sticky left-0 z-[21] bg-white px-3 text-left whitespace-nowrap">학생번호</th>
      <th className="sticky left-[72px] z-[21] bg-white px-3 text-left whitespace-nowrap">이름</th>
      <th className="px-3 text-left whitespace-nowrap">학교</th>
      <th className="px-3 text-left whitespace-nowrap">학년</th>
      <th className="px-3 text-left whitespace-nowrap">평가학년</th>
      <th className="px-3 text-left whitespace-nowrap">학습 상태</th>
      <th
        className={`px-3 text-left whitespace-nowrap ${onSortJournal ? 'cursor-pointer hover:text-neutral-800' : ''}`}
        onClick={onSortJournal}
        aria-sort={journalSort === 'desc' ? 'descending' : journalSort === 'asc' ? 'ascending' : 'none'}
      >
        <div className="flex items-center gap-1">상담일지 {onSortJournal && <ArrowUpDown className="h-3 w-3 opacity-50" />}</div>
      </th>
      <th className="px-2 text-left whitespace-nowrap">수업 로그</th>
      <th className="px-1" aria-label="더보기" />
    </tr>
  </thead>
);

interface StudentTableProps {
  students: Consultation[];
  matchedStudentIds: string[];
  statusById: Record<string, LearningStatus>;
  selectedId: string | null;
  onSave: (student: Consultation) => void;
  onMessage: (message: string) => void;
  onAction: (student: Consultation, action: StudentAction) => void;
  onSelect: (id: string) => void;
  onReorder: (fromId: string, toId: string, place: 'before' | 'after') => void;
  onOpenJournal: (student: Consultation, button: HTMLButtonElement | null) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  matchedStudentIds,
  statusById,
  selectedId,
  onSave,
  onMessage,
  onAction,
  onSelect,
  onReorder,
  onOpenJournal,
}) => (
  <table className="w-full min-w-[1360px] table-fixed border-collapse text-left">
    <StudentColgroup />
    <tbody>
      {students.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
          highlighted={matchedStudentIds.includes(student.id)}
          selected={selectedId === student.id}
          status={statusById[student.id] ?? { level: null }}
          onSave={onSave}
          onMessage={onMessage}
          onAction={(action) => onAction(student, action)}
          onSelect={() => onSelect(student.id)}
          onReorder={onReorder}
          onOpenJournal={onOpenJournal}
        />
      ))}
    </tbody>
  </table>
);
