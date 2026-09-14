import React, { useEffect, useRef } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface ColumnFilterHeaderProps {
  label: string;
  options: string[];
  selected: string[] | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (next: string[] | null) => void;
  align?: 'center' | 'left';
}

export const ColumnFilterHeader: React.FC<ColumnFilterHeaderProps> = ({
  label,
  options,
  selected,
  isOpen,
  onToggle,
  onClose,
  onChange,
  align = 'center',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = selected !== null;
  const checked = selected ?? options;

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const toggleValue = (value: string) => {
    const current = selected ?? options;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length === options.length) onChange(null);
    else onChange(next);
  };

  return (
    <div ref={rootRef} className={`relative flex ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1 py-0.5 rounded transition-colors ${align === 'left' ? 'justify-start px-0' : 'justify-center w-full px-1'} ${active ? 'text-blue-700' : 'text-neutral-500'}`}
      >
        <span>{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${active ? 'opacity-80' : 'opacity-50'}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-40 w-52 bg-white border border-gray-200 rounded-lg shadow-lg text-left font-normal">
          <div className="px-2 py-1.5 border-b border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-gray-500 hover:text-gray-700"
            >
              해제
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => (
              <li key={opt}>
                <label className="flex items-center gap-2 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked.includes(opt)}
                    onChange={() => toggleValue(opt)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="truncate" title={opt}>{opt}</span>
                </label>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-2.5 py-2 text-xs text-gray-400">항목 없음</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
