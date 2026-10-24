import React, { forwardRef } from 'react';
import type { OpenRequestSummary } from './types';

interface JournalButtonProps {
  summary: OpenRequestSummary;
  onClick: () => void;
}

const baseClass =
  'h-7 text-[12px] font-normal transition-colors whitespace-nowrap';

export const JournalButton = forwardRef<HTMLButtonElement, JournalButtonProps>(
  ({ summary, onClick }, ref) => {
    const { urgent, normal } = summary;
    const colorClass = urgent > 0
      ? 'text-red-600 hover:text-red-700'
      : normal > 0
        ? 'text-emerald-700 hover:text-emerald-800'
        : 'text-neutral-500 hover:text-neutral-800';
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`${baseClass} ${colorClass}`}
        title="상담일지"
      >
        상담일지
      </button>
    );
  }
);

JournalButton.displayName = 'JournalButton';
