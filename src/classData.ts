// 2026 여름 특강 참석표 — 실제 시트(PDF) 내용을 그대로 전사한 데이터
// 마크 코드: '/'또는'.'=출석(오프라인), Z=온라인(Zoom), R=녹화(Rec), X=미수강(N/A)
// 코드가 세션 수보다 짧으면 나머지는 출석(오프라인)으로 채움.

export type Mark = 'offline' | 'online' | 'recorded' | 'na';

export interface ClassStudent {
  no: number;
  name: string;
  marks: Mark[];
  attended: number; // 참여 회수 (N/A 제외)
  note?: string;
}

export interface ClassDef {
  teacher: string;
  name: string;
  days: string;
  time: string;
  dates: number[];
  total: number; // 총 수업 회수
  students: ClassStudent[];
}

export const MARK_META: Record<Mark, { label: string; glyph: string; cell: string }> = {
  na: { label: '불참', glyph: 'N/A', cell: 'bg-gray-100 text-gray-400' },
  offline: { label: '출석', glyph: '', cell: 'bg-white text-transparent' },
  online: { label: '온라인', glyph: 'Zoom', cell: 'bg-amber-100 text-amber-800 font-semibold' },
  recorded: { label: '녹화본', glyph: 'Rec', cell: 'bg-orange-100 text-orange-800 font-semibold' },
};

// 날짜 숫자 배열 → 월 추정 (여름특강: 22일 이상이면 6월 시작, 작으면 7월 시작 / 숫자가 작아지면 다음 달)
export const annotateDates = (dates: number[]): { day: number; month: number }[] => {
  if (dates.length === 0) return [];
  let month = dates[0] >= 22 ? 5 : 6; // 0-indexed: 5=6월, 6=7월
  let prev = 0;
  return dates.map((day, i) => {
    if (i > 0 && day < prev) month += 1;
    prev = day;
    return { day, month };
  });
};

export const MONTH_HEADER_CLASS: Record<number, string> = {
  // 옅은 파스텔로만 구분 (원본 -100/-800보다 부드럽게)
  5: 'bg-sky-50 text-sky-700',
  6: 'bg-emerald-50 text-emerald-700',
  7: 'bg-violet-50 text-violet-700',
  8: 'bg-amber-50 text-amber-700',
};

export const MONTH_LABEL: Record<number, string> = {
  5: '6월', 6: '7월', 7: '8월', 8: '9월',
};

const CODE: Record<string, Mark> = { '/': 'offline', '.': 'offline', Z: 'online', R: 'recorded', X: 'na' };

const parse = (code: string, total: number): Mark[] => {
  const out: Mark[] = [];
  for (const ch of code) out.push(CODE[ch] ?? 'offline');
  while (out.length < total) out.push('offline');
  return out.slice(0, total);
};

type RawStudent = [string, string] | [string, string, string];
interface RawClass {
  teacher: string;
  name: string;
  days: string;
  time: string;
  dates: number[];
  students: RawStudent[];
}

const RAW: RawClass[] = [
  // ───────── Sunny ─────────
  {
    teacher: 'Sunny', name: 'G12 IB AA HL Math Nov', days: '화/목/토', time: '16:15-18:15',
    dates: [23, 25, 27, 30, 2, 4, 7, 9, 11],
    students: [
      ['이시환', '', '3주 모두 오프라인 신청'],
      ['박준우', '', '3주 모두 오프라인 신청'],
      ['Miu', '', '3주 모두 오프라인 신청'],
      ['경규은', ''],
      ['간승진', ''],
      ['장준', 'Z'],
      ['신준미', 'ZZZ'],
      ['Xinyi Zeng(Michelle)', 'ZZZZR'],
    ],
  },
  {
    teacher: 'Sunny', name: 'G12 IB AA HL UWCD', days: '화/목/토', time: '09:00-11:00',
    dates: [25, 27, 30, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28, 30, 1],
    students: [
      ['곽민준', 'ZZZZZZZZZZZZZZZZZ', '6/25~7/11 온라인 / 7/14~8/1 오프라인'],
      ['곽민서', 'ZZZZZZZZZZZZZZZZZ', '6/25~7/11 온라인 / 7/14~8/1 오프라인'],
      ['황진아', '', '5.5주 모두 오프라인 신청'],
      ['박중근', 'XZZZZZZZZZZZZZZZX', '6/25(목)-7/31(금) 온라인 신청, 마지막날 참석 불가'],
      ['이서원', 'XXXXX'],
      ['장호준', 'ZZZZZRRZZZZZZZZZZ', '7/2(목)-8/1(토) 오프라인'],
      ['조현준', ''],
      ['황예성', 'XXXXXXXXZZZZZZZZZ'],
      ['황호준', 'ZZZZZRRZZZZZZZZZZ'],
      ['김규린', 'ZZZZZXZZZZZZZZZZZ'],
      ['이재형', 'XXXZZRRZZZZZZZZZZ'],
    ],
  },
  {
    teacher: 'Sunny', name: 'G12 IB AA HL OFS', days: '월/수/금', time: '09:00-11:00',
    dates: [22, 24, 26, 29, 1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27, 29, 31],
    students: [
      ['조재한', '', '6주 모두 오프라인 신청, 뒷 2-3주는 온라인 가능성'],
      ['허준혁', 'RRR', '온라인: 6/22,24,26 / 오프라인: 6/29-7/31'],
      ['손정우', '', '6주 모두 오프라인 신청'],
      ['이지율', '', '6주 모두 오프라인 신청'],
      ['Sarah A', 'XXXXXXXXXXXX'],
    ],
  },
  {
    teacher: 'Sunny', name: 'G11 AA HL ACSI', days: '월/수/금', time: '14:00-16:00',
    dates: [25, 27, 29, 1, 3, 5, 8, 10, 12, 22, 24, 26],
    students: [
      ['차유진', ''],
      ['유상우', 'ZZZ'],
    ],
  },
  {
    teacher: 'Sunny', name: 'G11 IB AA HL Math B', days: '월/수/금', time: '11:15-13:15',
    dates: [26, 29, 1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27, 29, 31],
    students: [
      ['이주용', 'XXXXXXX', '7/13~7/31 (3주) 오프라인'],
      ['강준우', 'RRZ', '6/26~7/31 (5.5주, 16회) 오프라인'],
      ['이아인', 'R', '6/26~7/31 (5.5주, 16회) 오프라인 / 일부 온라인'],
      ['양진서', 'XXXX', '6/26~7/31 오프라인 / 여행시 온라인'],
      ['신동욱', '', '6/26~7/31 (5.5주, 16회) 오프라인'],
      ['정다현', 'ZZZZZZZZZZZZZZZ', '6/26~7/13 (3주) 온라인'],
      ['홍지후', '', '6/26~7/31 (5.5주, 16회) 오프라인'],
      ['유재민', 'RXXXXXX', '6/26~7/17 오프라인'],
      ['김지우', 'XXXXXXXRRRRRRRRR', '7/13~7/24 녹화본, 7/27~7/31 오프라인'],
      ['김지효', 'ZZZZZZ', '6/26~7/31 오프라인 / 7/20부터 온라인'],
      ['김아인', 'XXXX', '7/6~31 총 12회, 오프라인'],
      ['오하민', 'ZZZZ', '원장님 반 조인 희망'],
      ['정서영', 'XXXXXXXXZZZZZZZZ', '5.5주 모두 오프라인 신청'],
      ['조은우', 'XXXXXXXZZZZZZZZZ'],
    ],
  },
  // ───────── Alex ─────────
  {
    teacher: 'Alex', name: 'G12 IB AA SL Math', days: '화/토', time: '09:00-11:00',
    dates: [27, 30, 4, 7, 11, 14, 18, 21, 25, 28, 1],
    students: [
      ['한세영', 'ZRRRR', '9358 1113'],
      ['박유빈', 'XZZZZZZZZZX', '8040 0153'],
      ['전희연', '', '8218 1807'],
      ['박종현', 'XXXXXXX', '8825 8794'],
      ['김송현', 'R', '9396 6663'],
      ['백수하', 'ZXXXXXX', '9729 0324'],
    ],
  },
  {
    teacher: 'Alex', name: 'G11 AA SL Math', days: '월/금', time: '09:00-11:00',
    dates: [26, 29, 3, 6, 10, 13, 17, 20, 24, 27, 31],
    students: [
      ['김시범', 'RZZXXXX', '8763 8969'],
      ['임유안', '', '9037 2467'],
      ['옥세인', '', '8730 7389'],
      ['정민채', 'Z', '8879 6599'],
      ['이여원', 'ZRZRZRXXXXX', '9235 5973'],
    ],
  },
  {
    teacher: 'Alex', name: 'G11 AA HL Math A', days: '화/목/토', time: '11:15-13:15',
    dates: [25, 27, 30, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28, 30, 1],
    students: [
      ['정서영', 'ZZRRRZRZXXXXXXXXX', '9668 7617'],
      ['윤재희', 'ZZZZZZZZZZZZZZZZZ', '010 6631 5676 (한국번호)'],
      ['성현준', '', '8420 0483'],
      ['이명진', 'XXZZ', '8181 3796'],
      ['이동욱', 'XXXXX', '9787 6561'],
      ['이서진', 'XXXXXXXX', '9830 2038'],
    ],
  },
  {
    teacher: 'Alex', name: 'G10 Add Math', days: '월/금', time: '16:15-18:15',
    dates: [26, 29, 3, 6, 10, 13, 17, 20, 24, 27, 31],
    students: [
      ['김동현', 'ZZXX', '9811 9595'],
      ['장기현', 'XXXXX', '9159 3176'],
      ['한규빈', 'ZZZZZZZZZXX', '8887 9859'],
      ['조효빈', 'RRRXXXXXXXX', '9059 4868'],
      ['박가온', 'RRRRR', '8952 9612'],
      ['한길우', 'RR', '8801 2906'],
      ['이재원A', 'XXXXXXXX', '8434 9920'],
      ['이채윤A', 'XX', '8030 0076'],
      ['곽지후', 'RRRRRZZZZZZ', '8436 2449'],
    ],
  },
  {
    teacher: 'Alex', name: 'G9 Math', days: '월/금', time: '11:15-13:15',
    dates: [26, 29, 3, 6, 10, 13, 17, 20, 24, 27, 31],
    students: [
      ['신준혁', 'ZZZZZZZZZZZ', '8350 2252'],
      ['정서현', 'ZZZZZZZZZZZ', '9776 5628'],
      ['강산', 'XX', '8304 7192'],
      ['마승훈', 'XXXX', '8446 5111'],
      ['현채유', 'XXXX', '9116 1242'],
      ['박소원', 'ZZ', '9753 0472'],
      ['서예린', 'ZZZZZZZZZZZ', '8506 2743'],
      ['김소이', 'RRRRXXXX', '9687 1004'],
      ['박소은', 'XX', '8598 8436'],
      ['김하영', 'XXXXX', '8518 6290 (어머님)'],
      ['박시원', 'ZZ', '9623 0603'],
    ],
  },
  // ───────── Serena ─────────
  {
    teacher: 'Serena', name: 'G8 Math', days: '월/금', time: '14:00-16:00',
    dates: [26, 29, 3, 6, 10, 13, 17, 20, 24, 27, 31],
    students: [
      ['남단우(Danwoo Nam)', 'XZZZZZZZZZZ', '8728 1357'],
      ['이하람(McKay)', 'XXXXXXXX', '8785 4115'],
      ['김규빈(Robyn)', 'ZZZZZZZZZZZ', '8341 6189'],
      ['김예경(Yekyung)', 'ZZZZZ', '8016 7260'],
      ['박서준', 'XXXZZZZZZZX', '8678 2012'],
      ['박준하', 'XXXZZZZZZZX', '9447 2012'],
      ['박온유', 'R', '8728 6543'],
      ['Duncan Mcilroy', 'ZXXXXXXXX'],
    ],
  },
  {
    teacher: 'Serena', name: 'Pre-Algebra', days: '화/토', time: '화 14:00-16:00 · 토 09:00-11:00',
    dates: [27, 30, 4, 7, 11, 14, 18, 21, 25, 28, 1],
    students: [
      ['오제성(Julian)', 'XXXZZZZZZZZ'],
      ['한필립(Philip)', 'XXX'],
    ],
  },
  {
    teacher: 'Serena', name: 'Voca Camp', days: '월/금', time: '09:00-11:00',
    dates: [6, 10, 13, 17, 20, 24, 27, 31],
    students: [
      ['안찬혁(Ahn Chanhyuk)', '', '8309 9391'],
      ['박소은(Park Soeun)', '', '8598 8436'],
      ['조민철(Cho Mincheol)', '', '9222 5942'],
      ['현채유(Hyun Chaeyu)', 'XX', '9116 1242'],
      ['권동욱(Kwon Dongwook)', '', '8930 8949'],
      ['김동현(Kim Donghyeon)', '', '9811 9595'],
      ['임지안(Lim Jian)', '', '8946 3700'],
    ],
  },
];

export const CLASS_DATA: ClassDef[] = RAW.map((rc) => {
  const total = rc.dates.length;
  return {
    teacher: rc.teacher,
    name: rc.name,
    days: rc.days,
    time: rc.time,
    dates: rc.dates,
    total,
    students: rc.students.map((s, i) => {
      const marks = parse(s[1], total);
      return {
        no: i + 1,
        name: s[0],
        marks,
        attended: marks.filter((m) => m !== 'na').length,
        note: s[2],
      };
    }),
  };
});

// 모든 표를 동일 너비로 맞추기 위한 최대 세션 수
export const MAX_COLS = CLASS_DATA.reduce((m, c) => Math.max(m, c.total), 0);

// 강사 순서 (등장 순)
export const TEACHER_ORDER: string[] = CLASS_DATA.reduce<string[]>((acc, c) => {
  if (!acc.includes(c.teacher)) acc.push(c.teacher);
  return acc;
}, []);

export const TOTAL_CLASSES = CLASS_DATA.length;
export const TOTAL_STUDENTS = CLASS_DATA.reduce((n, c) => n + c.students.length, 0);
