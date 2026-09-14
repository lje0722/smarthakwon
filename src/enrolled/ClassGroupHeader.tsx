import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { seatBadgeText } from './groupAndFilter';
import type { ClassRosterGroup } from './types';

interface ClassGroupHeaderProps {
  group: ClassRosterGroup;
  collapsed: boolean;
  onToggle: () => void;
}

const seatTone = (group: ClassRosterGroup): string => {
  if (group.classInfo.unassigned) return 'text-neutral-500 bg-neutral-100';
  if (group.remainingSeats > 0) return 'text-neutral-700 bg-neutral-100';
  if (group.remainingSeats === 0) return 'text-neutral-600 bg-neutral-100';
  return 'text-amber-800 bg-amber-50';
};

export const ClassGroupHeader: React.FC<ClassGroupHeaderProps> = ({
  group,
  collapsed,
  onToggle,
}) => {
  const { classInfo, currentCount } = group;
  const badge = seatBadgeText(group);
  const meta = [classInfo.teacher, classInfo.days, classInfo.time]
    .filter((part) => part && part !== '-')
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onToggle}
      className="sticky top-10 z-[15] flex w-full items-center gap-3 border-y border-neutral-200 bg-[#f3f3f1] px-3 py-2 text-left"
    >
      {collapsed
        ? <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
        : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-neutral-900">{classInfo.name}</div>
        <div className="truncate text-[12px] text-neutral-500">
          {meta || (classInfo.unassigned ? '수강반 미배정' : '')}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[12px]">
        <span className="text-neutral-600">
          {classInfo.unassigned
            ? `현재 ${currentCount}명`
            : `현재 ${currentCount}명 / 정원 ${classInfo.capacity}명`}
        </span>
        {badge && (
          <span className={`rounded px-1.5 py-0.5 ${seatTone(group)}`}>{badge}</span>
        )}
      </div>
    </button>
  );
};
