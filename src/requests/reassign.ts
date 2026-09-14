import type { StudentRequest } from './types';

/**
 * 예비원생 → 원생 전환 시 학생 ID가 바뀌면 요청을 새 ID로 옮긴다.
 * 현재 등록 흐름은 Consultation.id를 유지하므로 호출되지 않는다.
 * 요청을 복사하지 않고 studentId만 바꾼다.
 */
export const reassignRequestsToStudent = (
  requests: StudentRequest[],
  fromStudentId: string,
  toStudentId: string
): StudentRequest[] => {
  if (!fromStudentId || !toStudentId || fromStudentId === toStudentId) return requests;
  return requests.map((request) =>
    request.studentId === fromStudentId ? { ...request, studentId: toStudentId } : request
  );
};
