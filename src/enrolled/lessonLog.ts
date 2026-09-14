export type LessonLogResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not-configured'; studentId: string };

/**
 * 기존 ERP 수업 로그로 이동하는 진입점.
 * 학생별 URL/매핑 ID가 준비되면 이 함수만 교체한다.
 */
export function openStudentLessonLog(studentId: string): LessonLogResult {
  // ERP 상세 URL이 아직 없어서 임의 주소를 만들지 않는다.
  return { ok: false, reason: 'not-configured', studentId };
}

export const LESSON_LOG_PLACEHOLDER =
  '기존 ERP 수업 로그 URL이 아직 연결되지 않았습니다. 학생별 매핑이 준비되면 openStudentLessonLog에서 연결합니다.';
