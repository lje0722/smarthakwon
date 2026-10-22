import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { seatBadgeText } from './groupAndFilter';
import { gradeAccentColor } from './classCatalog';
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

  return (
    <button
      type="button"
      onClick={onToggle}
      className="sticky top-0 z-[30] flex min-h-16 w-full items-center gap-3 border-t border-b border-t-neutral-200 border-b-neutral-200 border-l-4 bg-[#f3f3f1] px-3 py-2.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      style={{ borderLeftColor: gradeAccentColor(classInfo.gradeKey) }}
    >
      {collapsed
        ? <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
        : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-neutral-900">{classInfo.name}</div>
        {classInfo.unassigned ? (
          <div className="mt-0.5 text-[12px] text-neutral-400">수강반 미배정</div>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px]">
            <span>
              <span className="text-[10px] text-neutral-400">담당 </span>
              <span className="font-semibold text-neutral-800">{classInfo.teacher !== '-' ? classInfo.teacher : '미정'}</span>
            </span>
            <span>
              <span className="text-[10px] text-neutral-400">요일 </span>
              <span className="font-semibold text-neutral-800">{classInfo.days}</span>
            </span>
            <span>
              <span className="text-[10px] text-neutral-400">시간 </span>
              <span className="font-semibold text-neutral-800">{classInfo.time}</span>
            </span>
          </div>
        )}
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
