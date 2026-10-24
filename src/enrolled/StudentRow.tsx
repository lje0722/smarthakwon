import React, { useRef } from 'react';
import { GRADE_OPTIONS, type Consultation } from '../types';
import { JournalButton } from '../requests/JournalButton';
import { useRequests } from '../requests/RequestContext';
import { actionBadgeClass } from '../requests/actionColor';
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
  onRowMouseDown: () => void;
  onRowMouseEnter: () => void;
  onReorder: (fromId: string, toId: string, place: 'before' | 'after') => void;
  onOpenJournal: (student: Consultation, button: HTMLButtonElement | null) => void;
}

const gradeSelectClass =
  'w-full h-7 px-0 text-[13px] text-center bg-transparent border-0 outline-none appearance-none cursor-pointer';

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
  onRowMouseDown,
  onRowMouseEnter,
  onReorder,
  onOpenJournal,
}) => {
  const journalRef = useRef<HTMLButtonElement>(null);
  const { openSummary, requestsFor } = useRequests();
  const summary = openSummary(student.id);
  const openActions: string[] = [];
  const seenActions = new Set<string>();
  for (const request of requestsFor(student.id)) {
    if (request.status !== 'open' || seenActions.has(request.action)) continue;
    seenActions.add(request.action);
    openActions.push(request.action);
  }
  const { dropEdge, setDropEdge, dragging, setDragging } = useRowDropEdge();
  const fill = rowFillClass({ dragging, selected, searchHit: highlighted });
  const stickyFill = rowFillClass({ dragging, selected, searchHit: highlighted }, 'sticky');
  const line = dropLineClass(dropEdge);
  const cell = `border-b border-neutral-100 px-3 h-11 text-center ${line}`;
  const sticky = `sticky z-[1] ${stickyFill}`;

  return (
    <tr
      className={`group ${fill}`}
      onMouseDown={(e) => {
        if (!isRowDragInteractive(e.target)) e.preventDefault();
        onRowMouseDown();
      }}
      onMouseEnter={onRowMouseEnter}
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
    >
      <td
        className={`sticky left-0 z-[1] ${stickyFill} border-b border-neutral-100 h-11 ${line} cursor-grab active:cursor-grabbing`}
        draggable
        onDragStart={(e) => {
          setDragging(true);
          e.dataTransfer.setData('text/plain', student.id);
          e.dataTransfer.effectAllowed = 'move';
          hideDragGhost(e);
        }}
        onDragEnd={() => {
          setDragging(false);
          setDropEdge(null);
        }}
        title="끌어서 순서 변경"
      />
      <td
        className={`sticky left-[24px] ${sticky} ${cell} text-[12px] font-mono tabular-nums text-neutral-500 whitespace-nowrap`}
        title={student.studentNumber || ''}
      >
        {shortStudentNum(student.studentNumber)}
      </td>
      <td
        className={`sticky left-[104px] ${sticky} ${cell} text-[14px] font-medium text-neutral-900`}
        title={student.name}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
          <span aria-hidden="true" />
          <span className="min-w-0 truncate">{student.name || '-'}</span>
          <span className="flex min-w-0 items-center justify-start gap-1">
            {openActions.length > 0 && (
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${actionBadgeClass(openActions[0])}`}
              >
                {openActions[0]}
              </span>
            )}
            {openActions.length > 1 && (
              <span className="shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-neutral-500">
                +{openActions.length - 1}
              </span>
            )}
          </span>
        </div>
      </td>
      <td className={`${cell} text-[13px] text-neutral-600 max-w-[148px]`} title={student.school}>
        <span className="block truncate text-center">{student.school || '-'}</span>
      </td>
      <td className={`${cell} align-middle`}>
        <GradeSelect
          value={student.grade || ''}
          onChange={(grade) => onSave({ ...student, grade })}
        />
      </td>
      <td className={`${cell} align-middle`}>
        <LearningStatusCell status={status} />
      </td>
      <td className={`${cell} px-2`}>
        <LessonLogButton studentId={student.id} onMessage={onMessage} />
      </td>
      <td className={`${cell} !border-0`}>
        <JournalButton
          ref={journalRef}
          summary={summary}
          onClick={() => onOpenJournal(student, journalRef.current)}
        />
      </td>
      <td className={`${cell} px-1`}>
        <StudentMoreMenu onAction={onAction} />
      </td>
    </tr>
  );
};
