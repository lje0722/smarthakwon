import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { Consultation } from '../types';
import type { SortOrder } from '../types';
import type { LearningStatus, StudentAction } from './types';
import { StudentRow } from './StudentRow';

export const STUDENT_TABLE_MIN_WIDTH = 1180;

export const StudentColgroup: React.FC = () => (
  <colgroup>
    <col style={{ width: 80 }} />
    <col style={{ width: 132 }} />
    <col style={{ width: 148 }} />
    <col style={{ width: 76 }} />
    <col style={{ width: 110 }} />
    <col style={{ width: 96 }} />
    <col style={{ width: 220 }} />
    <col style={{ width: 44 }} />
  </colgroup>
);

const headCell =
  'sticky top-16 z-[16] border-b border-neutral-200 bg-white px-3 text-center whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
const headCellFrozen =
  'sticky top-16 z-[26] border-b border-neutral-200 bg-white px-3 text-center whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.06)]';

export const StudentTableHeader: React.FC<{
  journalSort?: SortOrder | null;
  onSortJournal?: () => void;
}> = ({ journalSort, onSortJournal }) => (
  <thead className="text-[12px] font-medium text-neutral-500">
    <tr className="h-10">
      <th className={`sticky left-0 ${headCellFrozen}`}>학생번호</th>
      <th className={`sticky left-[80px] ${headCellFrozen}`}>이름</th>
      <th className={headCell}>학교</th>
      <th className={headCell}>학년</th>
      <th className={headCell}>학습상태</th>
      <th className={`${headCell} px-2`}>수업 로그</th>
      <th
        className={`${headCell} ${onSortJournal ? 'cursor-pointer hover:text-neutral-800' : ''}`}
        onClick={onSortJournal}
        aria-sort={journalSort === 'desc' ? 'descending' : journalSort === 'asc' ? 'ascending' : 'none'}
      >
        <div className="flex items-center justify-center gap-1">상담일지 {onSortJournal && <ArrowUpDown className="h-3 w-3 opacity-50" />}</div>
      </th>
      <th className={`${headCell} px-1`} aria-label="더보기" />
    </tr>
  </thead>
);

interface StudentTableProps {
  students: Consultation[];
  matchedStudentIds: string[];
  statusById: Record<string, LearningStatus>;
  selectedId: string | null;
  journalSort?: SortOrder | null;
  onSortJournal?: () => void;
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
  journalSort,
  onSortJournal,
  onSave,
  onMessage,
  onAction,
  onSelect,
  onReorder,
  onOpenJournal,
}) => (
  <table className="w-full table-fixed border-collapse text-center" style={{ minWidth: STUDENT_TABLE_MIN_WIDTH }}>
    <StudentColgroup />
    <StudentTableHeader journalSort={journalSort} onSortJournal={onSortJournal} />
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
