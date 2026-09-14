export const shortStudentNum = (value?: string): string => {
  const match = (value || '').match(/(\d+)\s*$/);
  if (!match) return value || '';
  return match[1].slice(-3).padStart(3, '0');
};
