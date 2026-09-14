import React, { useRef } from 'react';
import { GRADE_OPTIONS, type Consultation } from '../types';
import { JournalButton } from '../requests/JournalButton';
import { useRequests } from '../requests/RequestContext';
import {
  dropEdgeFromPointer,
  dropLineClass,
  hideDragGhost,
  isRowDragInteractive,
  rowFillClass,
  useRowDropEdge,
} from '../components/rowDrag';
import { shortStudentNum } from './format';
import type { LearningStatus, StudentAction } from './types';
import { LearningStatusCell } from './LearningStatusCell';
import { LessonLogButton } from './LessonLogButton';
import { StudentMoreMenu } from './StudentMoreMenu';

interface StudentRowProps {
  student: Consultation;
  highlighted: boolean;
  selected: boolean;
  status: LearningStatus;
  onSave: (student: Consultation) => void;
  onMessage: (message: string) => void;
  onAction: (action: StudentAction) => void;
  onSelect: () => void;
  onReorder: (fromId: string, toId: string, place: 'before' | 'after') => void;
  onOpenJournal: (student: Consultation, button: HTMLButtonElement | null) => void;
}

const gradeSelectClass =
  'w-full h-7 px-0 text-[13px] text-left bg-transparent border-0 outline-none appearance-none cursor-pointer';

const GradeSelect: React.FC<{
  value: string;
  onChange: (next: string) => void;
}> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${gradeSelectClass} ${value ? 'text-neutral-600' : 'text-neutral-300'}`}
  >
    <option value="">-</option>
    {value && !(GRADE_OPTIONS as readonly string[]).includes(value) && (
      <option value={value}>{value}</option>
    )}
    {GRADE_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export const StudentRow: React.FC<StudentRowProps> = ({
  student,
  highlighted,
  selected,
  status,
  onSave,
  onMessage,
  onAction,
  onSelect,
  onReorder,
  onOpenJournal,
}) => {
  const journalRef = useRef<HTMLButtonElement>(null);
  const { openSummary } = useRequests();
  const summary = openSummary(student.id);
  const { dropEdge, setDropEdge, dragging, setDragging } = useRowDropEdge();
  const fill = rowFillClass({ dragging, selected, searchHit: highlighted });
  const line = dropLineClass(dropEdge);
  const cell = `border-b border-neutral-100 px-3 h-11 ${line}`;
  const sticky = `sticky z-[1] ${fill}`;

  return (
    <>
      <tr
        className={`group ${fill}`}
        draggable
        data-row-drag="true"
        onMouseDown={() => onSelect()}
        onDragStart={(e) => {
          if (isRowDragInteractive(e.target)) {
            e.preventDefault();
            return;
          }
          onSelect();
          setDragging(true);
          e.dataTransfer.setData('text/plain', student.id);
          e.dataTransfer.effectAllowed = 'move';
          hideDragGhost(e);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragging) {
            setDropEdge(null);
            return;
          }
          setDropEdge(dropEdgeFromPointer(e.clientY, e.currentTarget.getBoundingClientRect()));
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropEdge(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const place = dropEdgeFromPointer(e.clientY, e.currentTarget.getBoundingClientRect());
          setDropEdge(null);
          onReorder(e.dataTransfer.getData('text/plain'), student.id, place);
        }}
        onDragEnd={() => {
          setDragging(false);
          setDropEdge(null);
        }}
      >
        <td
          className={`sticky left-0 ${sticky} ${cell} text-[12px] font-mono tabular-nums text-neutral-500 whitespace-nowrap`}
          title={student.studentNumber || ''}
        >
          {shortStudentNum(student.studentNumber)}
        </td>
        <td
          className={`sticky left-[72px] ${sticky} ${cell} text-[14px] font-medium text-neutral-900 max-w-[128px]`}
          title={student.name}
        >
          <span className="block truncate">{student.name || '-'}</span>
        </td>
        <td className={`${cell} text-[13px] text-neutral-600 max-w-[140px]`} title={student.school}>
          <span className="block truncate">{student.school || '-'}</span>
        </td>
        <td className={`${cell} align-middle`}>
          <GradeSelect
            value={student.grade || ''}
            onChange={(grade) => onSave({ ...student, grade })}
          />
        </td>
        <td className={`${cell} align-middle`}>
          <GradeSelect
            value={student.evalGrade || ''}
            onChange={(evalGrade) => onSave({ ...student, evalGrade })}
          />
        </td>
        <td className={`${cell} align-middle`}>
          <LearningStatusCell status={status} />
        </td>
        <td className={`${cell} !border-0`}>
          <JournalButton
            ref={journalRef}
            summary={summary}
            onClick={() => onOpenJournal(student, journalRef.current)}
          />
        </td>
        <td className={`${cell} px-2`}>
          <LessonLogButton studentId={student.id} onMessage={onMessage} />
        </td>
        <td className={`${cell} px-1`}>
          <StudentMoreMenu onAction={onAction} />
        </td>
      </tr>
    </>
  );
};
