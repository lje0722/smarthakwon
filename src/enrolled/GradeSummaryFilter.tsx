import React from 'react';
import type { GradeSummaryItem } from './types';

interface GradeSummaryFilterProps {
  items: GradeSummaryItem[];
  selected: string;
  totalStudents: number;
  totalClasses: number;
  totalRemaining: number;
  onSelect: (key: string) => void;
}

const boxClass = (active: boolean) =>
  [
    'min-w-[148px] rounded-md border px-3 py-2.5 text-left transition-colors',
    active
      ? 'border-neutral-800 bg-white'
      : 'border-neutral-200 bg-white hover:border-neutral-300',
  ].join(' ');

const seatEmphasisClass = (seats: number): string =>
  seats < 0 ? 'text-red-600' : seats === 0 ? 'text-amber-600' : 'text-neutral-900';

export const GradeSummaryFilter: React.FC<GradeSummaryFilterProps> = ({
  items,
  selected,
  totalStudents,
  totalClasses,
  totalRemaining,
  onSelect,
}) => (
  <div className="flex gap-2 overflow-x-auto pb-0.5">
    <button
      type="button"
      onClick={() => onSelect('all')}
      className={boxClass(selected === 'all')}
    >
      <div className="text-[12px] font-medium text-neutral-500">전체</div>
      <div className="mt-1 text-[12px] text-neutral-500 whitespace-nowrap">
        반 {totalClasses}개 · 원생 {totalStudents}명
      </div>
      <div className={`text-[18px] font-bold leading-tight whitespace-nowrap ${seatEmphasisClass(totalRemaining)}`}>
        잔여 {totalRemaining}석
      </div>
    </button>
    {items.map((item) => {
      const active = selected === item.key;
      return (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={boxClass(active)}
        >
          <div className="text-[12px] font-medium text-neutral-500">{item.label}</div>
          <div className="mt-1 text-[12px] text-neutral-500 whitespace-nowrap">
            반 {item.classCount}개 · 원생 {item.studentCount}명
          </div>
          <div className={`text-[18px] font-bold leading-tight whitespace-nowrap ${seatEmphasisClass(item.remainingSeats)}`}>
            잔여 {item.remainingSeats}석
          </div>
        </button>
      );
    })}
  </div>
);
