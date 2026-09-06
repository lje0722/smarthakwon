import React, { useRef } from 'react';
import { formatDateYmd, parseDateValue } from '../types';

interface DatePickerCellProps {
  value?: string;
  onChange: (next: string) => void;
}

export const DatePickerCell: React.FC<DatePickerCellProps> = ({ value, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  const display = formatDateYmd(value);
  const iso = parseDateValue(value) ? formatDateYmd(value) : '';

  const openPicker = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  };

  return (
    <div className="relative h-8 w-full">
      <button
        type="button"
        onClick={openPicker}
        className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-gray-800 tabular-nums rounded hover:bg-white hover:border hover:border-gray-300 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
      >
        {display || <span className="text-gray-300">선택</span>}
      </button>
      <input
        ref={ref}
        type="date"
        value={iso}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 opacity-0"
        tabIndex={-1}
      />
    </div>
  );
};
