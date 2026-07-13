import React from 'react';
import { ConsultationStatus, getStatusStyle } from '../types';

export const StatusBadge: React.FC<{ status: ConsultationStatus }> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap ${getStatusStyle(status).badge}`}>
      {status}
    </span>
  );
};
