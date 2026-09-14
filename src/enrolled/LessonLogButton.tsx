import React from 'react';
import { LESSON_LOG_PLACEHOLDER, openStudentLessonLog } from './lessonLog';

interface LessonLogButtonProps {
  studentId: string;
  onMessage: (message: string) => void;
}

export const LessonLogButton: React.FC<LessonLogButtonProps> = ({ studentId, onMessage }) => (
  <button
    type="button"
    onClick={() => {
      const result = openStudentLessonLog(studentId);
      if (!result.ok) onMessage(LESSON_LOG_PLACEHOLDER);
    }}
    className="h-7 whitespace-nowrap rounded px-2 text-[12px] text-neutral-600 hover:bg-neutral-100"
  >
    수업 로그
  </button>
);
