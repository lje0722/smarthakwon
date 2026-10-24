import React from 'react';
import type { Consultation, SortOrder } from '../types';
import type { ClassRosterGroup, LearningStatus, StudentAction } from './types';
import { ClassGroupHeader } from './ClassGroupHeader';
import { StudentTable } from './StudentTable';

interface ClassGroupProps {
  group: ClassRosterGroup;
  collapsed: boolean;
  selectedIds: Set<string>;
  onToggle: () => void;
  statusById: Record<string, LearningStatus>;
  journalSort?: SortOrder | null;
  onSortJournal?: () => void;
  onSave: (student: Consultation) => void;
  onMessage: (message: string) => void;
  onAction: (student: Consultation, action: StudentAction) => void;
  onSelectionChange: (ids: Set<string>) => void;
  onReorder: (fromId: string, toId: string, place: 'before' | 'after') => void;
  onOpenJournal: (student: Consultation, button: HTMLButtonElement | null) => void;
}

export const ClassGroup: React.FC<ClassGroupProps> = ({
  group,
  collapsed,
  selectedIds,
  onToggle,
  statusById,
  journalSort,
  onSortJournal,
  onSave,
  onMessage,
  onAction,
  onSelectionChange,
  onReorder,
  onOpenJournal,
}) => (
  <section className="mb-3">
    <ClassGroupHeader group={group} collapsed={collapsed} onToggle={onToggle} />
    {!collapsed && (
      <StudentTable
        students={group.students}
        matchedStudentIds={group.matchedStudentIds}
        statusById={statusById}
        selectedIds={selectedIds}
        journalSort={journalSort}
        onSortJournal={onSortJournal}
        onSave={onSave}
        onMessage={onMessage}
        onAction={onAction}
        onSelectionChange={onSelectionChange}
        onReorder={onReorder}
        onOpenJournal={onOpenJournal}
      />
    )}
  </section>
);
