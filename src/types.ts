export type ConsultationStatus = string;

export const ENROLLED_STATUS = '원생 (등록완료)';
export const INQUIRY_STATUS = '문의';

export const PRE_ENROLLMENT_STATUSES: string[] = [
  '문의',
  '테스트 대기',
  '채점대기',
  '상담대기',
  '보류',
  '반 대기',
];

export const DEFAULT_STATUS_OPTIONS: string[] = [
  ...PRE_ENROLLMENT_STATUSES,
  ENROLLED_STATUS,
];

/** 이전 프로토타입 상태를 새 예비원생 단계로 맞춘다. */
export const LEGACY_STATUS_MAP: Record<string, string> = {
  '초기 문의': '문의',
  '레벨테스트 완료 (등록 여부 미정)': '상담대기',
  '반 배정 완료 (등록 대기)': '반 대기',
  '신규 반 개설 대기': '반 대기',
  '기존 반 대기 (정원 초과)': '반 대기',
  '등록 취소/보류': '보류',
};

export const migrateStatus = (status: string): string =>
  LEGACY_STATUS_MAP[status] ?? status;

// 상태별 색상 (배지/셀렉트/요약카드). Tailwind 스캐너가 인식하도록 리터럴 문자열로 작성.
export const STATUS_STYLES: Record<string, { badge: string; card: string }> = {
  '문의': {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    card: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  '테스트 대기': {
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    card: 'bg-sky-50 border-sky-200 text-sky-800',
  },
  '채점대기': {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    card: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  '상담대기': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    card: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  '보류': {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    card: 'bg-gray-50 border-gray-200 text-gray-700',
  },
  '반 대기': {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    card: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  '원생 (등록완료)': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    card: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
};

export const getStatusStyle = (status: string) =>
  STATUS_STYLES[status] || {
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    card: 'bg-gray-50 border-gray-200 text-gray-800',
  };

/** 행 상태 점. 의미색은 브랜드·경고·성공만 쓴다. */
export const STATUS_DOT: Record<string, string> = {
  '문의': 'bg-neutral-400',
  '테스트 대기': 'bg-neutral-400',
  '채점대기': 'bg-amber-500',
  '상담대기': 'bg-amber-500',
  '보류': 'bg-indigo-300',
  '반 대기': 'bg-blue-600',
  '원생 (등록완료)': 'bg-emerald-600',
};

export const getStatusDot = (status: string) => STATUS_DOT[status] || 'bg-neutral-400';

export interface ConsultationNote {
  date: string;
  method: string;
  content: string;
}

export const GRADE_OPTIONS = ['G12', 'G11', 'G10', 'G9', 'G8', 'G7', 'G6', 'G5', 'G4', 'G3', 'G2', 'G1'] as const;

export interface Consultation {
  id: string;
  date: string;
  name: string;
  school: string;
  grade: string;
  evalGrade?: string;
  testDate?: string;
  status: string;
  className: string;
  memo?: string;
  /** 상담 팝업 상단 요약. 최근 특징이나 상담 결과를 적는 용도 */
  profile?: string;
  notes: ConsultationNote[];
  // 원생(등록완료) 전용 정보
  studentNumber?: string;
  studentPhone?: string;
  parentPhone?: string;
  email?: string;
}

export type SortField = 'date' | 'name' | 'school' | 'grade' | 'status' | 'className' | 'evalGrade' | 'testDate' | 'studentNumber' | 'studentPhone' | 'journal' | 'manual';
export type SortOrder = 'asc' | 'desc';

const MONTH_NAME: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** 여러 날짜 표기를 타임스탬프로 바꿔 연·월·일 순으로 비교한다. */
export const parseDateValue = (raw?: string): number => {
  if (!raw) return 0;
  const s = raw.trim();
  let m = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);

  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const first = +m[1];
    const second = +m[2];
    const year = +m[3];
    if (first > 12) return Date.UTC(year, second - 1, first);
    if (second > 12) return Date.UTC(year, first - 1, second);
    return Date.UTC(year, second - 1, first);
  }

  m = s.match(/^(\d{1,2})\s*([A-Za-z]{3})\s*(\d{4})$/);
  if (m) {
    const month = MONTH_NAME[m[2].toLowerCase()];
    if (month !== undefined) return Date.UTC(+m[3], month, +m[1]);
  }

  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
};

export const formatDateYmd = (raw?: string): string => {
  const t = parseDateValue(raw);
  if (!t) return (raw || '').trim();
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
};

export const normalizeDateInput = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return parseDateValue(trimmed) ? formatDateYmd(trimmed) : trimmed;
};
