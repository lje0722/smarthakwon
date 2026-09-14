import React from 'react';
import type { LearningStatus } from './types';

interface LearningStatusCellProps {
  status: LearningStatus;
}

export const LearningStatusCell: React.FC<LearningStatusCellProps> = ({ status }) => (
  <span
    className="text-[13px] text-neutral-700"
    title="ERP에서 불러온 학습 상태"
  >
    {status.level ?? '-'}
  </span>
);
