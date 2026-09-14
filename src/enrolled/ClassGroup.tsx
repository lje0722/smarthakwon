import React from 'react';
import type { Consultation } from '../types';
import type { ClassRosterGroup, LearningStatus, StudentAction } from './types';
import { ClassGroupHeader } from './ClassGroupHeader';
import { StudentTable } from './StudentTable';

interface ClassGroupProps {
  group: ClassRosterGroup;
  collapsed: boolean;
  selectedId: string | null;
  onToggle: () => void;
  statusById: Record<string, LearningStatus>;
  onSave: (student: Consultation) => void;
  onMessage: (message: string) => void;
  onAction: (student: Consultation, action: StudentAction) => void;
  onSelect: (id: string) => void;
  onReorder: (fromId: string, toId: string, place: 'before' | 'after') => void;
  onOpenJournal: (student: Consultation, button: HTMLButtonElement | null) => void;
}

export const ClassGroup: React.FC<ClassGroupProps> = ({
  group,
  collapsed,
  selectedId,
  onToggle,
  statusById,
  onSave,
  onMessage,
  onAction,
  onSelect,
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
        selectedId={selectedId}
        onSave={onSave}
        onMessage={onMessage}
        onAction={onAction}
        onSelect={onSelect}
        onReorder={onReorder}
        onOpenJournal={onOpenJournal}
      />
    )}
  </section>
);
