import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { DashboardFilterState } from './types';
import { EMPTY_DASHBOARD_FILTERS } from './types';

interface DashboardFiltersProps {
  value: DashboardFilterState;
  teachers: string[];
  onChange: (next: DashboardFilterState) => void;
  onResetSearch?: () => void;
  onResetExtra?: () => void;
}

const inputClass =
  'h-8 w-[148px] rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-blue-600';
const selectClass =
  'h-8 rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-700 outline-none focus:border-blue-600';

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  value,
  teachers,
  onChange,
  onResetSearch,
  onResetExtra,
}) => {
  const patch = (partial: Partial<DashboardFilterState>) => onChange({ ...value, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={value.classQuery}
        onChange={(e) => patch({ classQuery: e.target.value })}
        placeholder="반"
        className={inputClass}
      />
      <select
        value={value.teacher}
        onChange={(e) => patch({ teacher: e.target.value })}
        className={selectClass}
      >
        <option value="all">담당 선생님</option>
        {teachers.map((teacher) => (
          <option key={teacher} value={teacher}>{teacher}</option>
        ))}
      </select>
      <select
        value={value.seat}
        onChange={(e) => patch({ seat: e.target.value as DashboardFilterState['seat'] })}
        className={selectClass}
      >
        <option value="all">자리 상태 전체</option>
        <option value="open">자리 있음</option>
        <option value="full">마감</option>
      </select>
      <button
        type="button"
        onClick={() => {
          onChange({ ...EMPTY_DASHBOARD_FILTERS, gradeKey: value.gradeKey });
          onResetSearch?.();
          onResetExtra?.();
        }}
        className="flex h-8 items-center gap-1 rounded-md bg-neutral-100 px-2.5 text-[13px] text-neutral-700 hover:bg-neutral-200"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        초기화
      </button>
    </div>
  );
};
