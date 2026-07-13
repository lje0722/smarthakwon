export type ConsultationStatus = string;

export const ENROLLED_STATUS = '원생 (등록완료)';

export const DEFAULT_STATUS_OPTIONS: string[] = [
  '초기 문의',
  '레벨테스트 완료 (등록 여부 미정)',
  '반 배정 완료 (등록 대기)',
  '신규 반 개설 대기',
  '기존 반 대기 (정원 초과)',
  '등록 취소/보류',
  '원생 (등록완료)',
];

// 상태별 색상 (배지/셀렉트/요약카드). Tailwind 스캐너가 인식하도록 리터럴 문자열로 작성.
export const STATUS_STYLES: Record<string, { badge: string; card: string }> = {
  '초기 문의': {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    card: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  '레벨테스트 완료 (등록 여부 미정)': {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    card: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  '반 배정 완료 (등록 대기)': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    card: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  '신규 반 개설 대기': {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    card: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  '기존 반 대기 (정원 초과)': {
    badge: 'bg-[#e9e3ad] text-[#5c581c] border-[#d3cb78]',
    card: 'bg-[#f5f1cd] border-[#ddd684] text-[#5c581c]',
  },
  '등록 취소/보류': {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    card: 'bg-gray-50 border-gray-200 text-gray-700',
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

export interface ConsultationNote {
  date: string;
  method: string;
  content: string;
}

export interface Consultation {
  id: string;
  date: string;
  name: string;
  school: string;
  grade: string;
  status: string;
  className: string;
  memo?: string;
  notes: ConsultationNote[];
  // 원생(등록완료) 전용 정보
  studentNumber?: string;
  studentPhone?: string;
  parentPhone?: string;
  email?: string;
}

export type SortField = 'date' | 'name' | 'status' | 'className' | 'studentNumber' | 'studentPhone';
export type SortOrder = 'asc' | 'desc';
