import React, { useRef } from 'react';
import { formatDateYmd, parseDateValue } from '../types';

interface DatePickerCellProps {
  value?: string;
  onChange: (next: string) => void;
  muted?: boolean;
}

export const DatePickerCell: React.FC<DatePickerCellProps> = ({ value, onChange, muted = false }) => {
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
    <div className="relative h-7 w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        className={`absolute inset-0 flex items-center font-mono tabular-nums outline-none rounded-sm ${
          muted
            ? `justify-start text-[12px] ${display ? 'text-neutral-500' : 'text-neutral-300'} hover:text-neutral-800`
            : 'justify-center text-[13px] text-gray-800 hover:bg-white hover:border hover:border-gray-300 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
        }`}
      >
        {display || (muted ? '' : '\u00a0')}
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
