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
    if (urgent > 0 && normal > 0) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            className={`${baseClass} text-red-600 hover:text-red-700`}
            title="상담일지"
          >
            상담일지
          </button>
          <span className="text-[12px] font-medium text-red-600">급한 {urgent}</span>
          <span className="text-[12px] font-medium text-emerald-700">일반 {normal}</span>
        </span>
      );
    }
    if (urgent > 0) {
      return (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={`${baseClass} text-red-600 hover:text-red-700`}
          title="상담일지"
        >
          상담일지 · 급한 {urgent}
        </button>
      );
    }
    if (normal > 0) {
      return (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={`${baseClass} text-emerald-700 hover:text-emerald-800`}
          title="상담일지"
        >
          상담일지 · 일반 {normal}
        </button>
      );
    }
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`${baseClass} text-neutral-500 hover:text-neutral-800`}
        title="상담일지"
      >
        상담일지
      </button>
    );
  }
);

JournalButton.displayName = 'JournalButton';
