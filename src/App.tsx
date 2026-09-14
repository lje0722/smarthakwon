import React, { useState, useMemo, useRef, useEffect } from 'react';
import { initialData } from './data';
import { Consultation, SortField, SortOrder, DEFAULT_STATUS_OPTIONS, ENROLLED_STATUS, INQUIRY_STATUS, GRADE_OPTIONS, migrateStatus, parseDateValue, normalizeDateInput } from './types';
import { EditableRow } from './components/EditableRow';
import { EditableListItem } from './components/EditableListItem';
import { ColumnFilterHeader } from './components/ColumnFilterHeader';
import { CurrentStudentDashboard } from './enrolled/CurrentStudentDashboard';
import { Search, Plus, ArrowUpDown, ChevronDown, ChevronUp, RotateCcw, Settings, X } from 'lucide-react';
import { reorderIds } from './components/rowDrag';
import { NotesModal } from './components/NotesModal';
import { useRequests } from './requests/RequestContext';
import { compareStudentsByOpenRequests } from './requests/selectors';
import { emptyOpenSummary } from './requests/types';

// 요약 카드 및 좁은 화면용 짧은 라벨
const STATUS_SHORT_LABEL: Record<string, string> = {
  '문의': '문의',
  '테스트 대기': '테스트 대기',
  '채점대기': '채점대기',
  '상담대기': '상담대기',
  '보류': '보류',
  '반 대기': '반 대기',
  '원생 (등록완료)': '원생',
};

/** 예비원생 퍼널: 왼쪽에서 오른쪽으로 쿨톤이 조금씩 깊어진다. */
const PROSPECT_FUNNEL: Record<string, { card: string; selected: string; label: string; count: string }> = {
  '문의': {
    card: 'bg-stone-100/80 border-stone-200',
    selected: 'bg-stone-100 border-stone-400',
    label: 'text-stone-500',
    count: 'text-stone-800',
  },
  '테스트 대기': {
    card: 'bg-slate-100 border-slate-200',
    selected: 'bg-slate-100 border-slate-400',
    label: 'text-slate-500',
    count: 'text-slate-800',
  },
  '채점대기': {
    card: 'bg-sky-50 border-sky-200/80',
    selected: 'bg-sky-100 border-sky-400',
    label: 'text-sky-700/80',
    count: 'text-sky-950',
  },
  '상담대기': {
    card: 'bg-blue-50 border-blue-200/80',
    selected: 'bg-blue-100/80 border-blue-400',
    label: 'text-blue-700/80',
    count: 'text-blue-950',
  },
  '보류': {
    card: 'bg-indigo-50/70 border-indigo-100',
    selected: 'bg-indigo-50 border-indigo-300',
    label: 'text-indigo-400',
    count: 'text-indigo-900',
  },
  '반 대기': {
    card: 'bg-indigo-50 border-indigo-200/80',
    selected: 'bg-indigo-100/80 border-indigo-400',
    label: 'text-indigo-700/80',
    count: 'text-indigo-950',
  },
  '원생 (등록완료)': {
    card: 'bg-emerald-50 border-emerald-100',
    selected: 'bg-emerald-50 border-emerald-400',
    label: 'text-emerald-700/80',
    count: 'text-emerald-950',
  },
};

// 'G12' -> 12, 'G8 Add Math' -> 8, 없으면 -1
const gradeNum = (s: string): number => {
  const m = (s || '').match(/G\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : -1;
};

// 학년(G숫자) 내림차순, 같은 학년 내에서는 이름 오름차순
const sortByGradeDesc = (arr: string[]): string[] =>
  [...arr].sort((a, b) => gradeNum(b) - gradeNum(a) || a.localeCompare(b));

// 학생번호 뒤 숫자만 추출 (STU202605-0240 -> 240)
const studentNumTrailing = (s?: string): number => {
  const m = (s || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : -1;
};

// 학생번호 마지막 3자리만 표시 (0240 -> 240, 1 -> 001)
const shortStudentNum = (s?: string): string => {
  const m = (s || '').match(/(\d+)\s*$/);
  if (!m) return s || '';
  return m[1].slice(-3).padStart(3, '0');
};

// 가장 높은 학생번호 + 1 (중복 방지 auto-increment)
const getNextStudentNumber = (data: Consultation[]): string => {
  let max = 0;
  let template = 'STU2026-0000';
  for (const d of data) {
    const n = studentNumTrailing(d.studentNumber);
    if (n > max) {
      max = n;
      template = d.studentNumber!;
    }
  }
  const m = template.match(/(\d+)(\s*)$/);
  const width = m ? m[1].length : 4;
  const next = String(max + 1).padStart(width, '0');
  return template.replace(/\d+\s*$/, next);
};

export default function App() {
  const [data, setData] = useState<Consultation[]>(
    [...initialData]
      .map((item) => ({
        ...item,
        status: migrateStatus(item.status),
        date: normalizeDateInput(item.date),
      }))
      .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date))
  );
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [statusOptions, setStatusOptions] = useState<string[]>(DEFAULT_STATUS_OPTIONS);

  const studentSearchRef = useRef<HTMLInputElement>(null);
  const journalButtonRef = useRef<HTMLButtonElement | null>(null);
  const { openSummaryMap } = useRequests();
  const [journalStudentId, setJournalStudentId] = useState<string | null>(null);

  // Ctrl/Cmd+F → 상단 앱 검색창 포커스 (브라우저 기본 검색 대신)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        studentSearchRef.current?.focus();
        studentSearchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsNewStatus, setSettingsNewStatus] = useState('');
  const [settingsNewClass, setSettingsNewClass] = useState('');

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isSettingsOpen]);
  
  // Filters and Sorting
  const [activeTab, setActiveTab] = useState<'원생' | '예비원생'>('원생');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolledFilterKey, setEnrolledFilterKey] = useState(0);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [enrolledOrderByClass, setEnrolledOrderByClass] = useState<Record<string, string[]>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [columnFilters, setColumnFilters] = useState<{
    school: string[] | null;
    grade: string[] | null;
    evalGrade: string[] | null;
    className: string[] | null;
    status: string[] | null;
  }>({ school: null, grade: null, evalGrade: null, className: null, status: null });
  const [openColumnFilter, setOpenColumnFilter] = useState<keyof typeof columnFilters | null>(null);
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const ignoreSortUntilRef = useRef(0);

  // Derived options for filters
  const schools = useMemo(() => Array.from(new Set(data.map(d => d.school))).filter(Boolean).sort(), [data]);
  const grades = useMemo(
    () => sortByGradeDesc([...new Set([...GRADE_OPTIONS, ...data.map(d => d.grade), ...data.map(d => d.evalGrade || '')])].filter(Boolean)),
    [data]
  );
  const [classOptions, setClassOptions] = useState<string[]>([]);
  React.useEffect(() => {
    if (classOptions.length === 0 && data.length > 0) {
      setClassOptions(sortByGradeDesc([...new Set(data.map(d => d.className))].filter((c): c is string => Boolean(c) && c !== '-')));
    }
  }, [data]);

  const tabData = useMemo(() => {
    if (activeTab === '원생') return data.filter(item => item.status === ENROLLED_STATUS);
    return data.filter(item => item.status !== ENROLLED_STATUS);
  }, [data, activeTab]);

  const schoolChoices = useMemo(
    () => {
      const values = [...new Set(tabData.map(d => d.school).filter((v): v is string => Boolean(v)))] as string[];
      return values.sort((a, b) => a.localeCompare(b, 'ko'));
    },
    [tabData]
  );
  const gradeChoices = useMemo(
    () => sortByGradeDesc([...new Set(tabData.map(d => d.grade).filter((v): v is string => Boolean(v)))] as string[]),
    [tabData]
  );
  const evalGradeChoices = useMemo(
    () => {
      const vals = tabData.map(d => d.evalGrade || '-');
      return sortByGradeDesc([...new Set(vals)] as string[]);
    },
    [tabData]
  );
  const classChoices = useMemo(
    () => sortByGradeDesc([...new Set(tabData.map(d => d.className || '-'))] as string[]),
    [tabData]
  );
  const statusChoices = useMemo(
    () => (activeTab === '예비원생' ? statusOptions.filter(s => s !== ENROLLED_STATUS) : statusOptions)
      .filter(status => tabData.some(d => d.status === status)),
    [activeTab, statusOptions, tabData]
  );

  const applyColumnFilter = (key: keyof typeof columnFilters, next: string[] | null) => {
    setColumnFilters(prev => ({ ...prev, [key]: next }));
    if (next && next.length > 0) {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  // 원생 등록용 다음 학생번호 (최대 번호 + 1)
  const nextStudentNumber = useMemo(() => getNextStudentNumber(data), [data]);

  // Derived summary counts
  const summaryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusOptions.forEach(status => {
      counts[status] = 0;
    });
    data.forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });
    return counts;
  }, [data, statusOptions]);

  // 예비원생 탭에서는 원생 카운트 카드를 보여주지 않는다
  const visibleSummaryStatuses = useMemo(
    () => activeTab === '예비원생'
      ? statusOptions.filter(status => status !== ENROLLED_STATUS)
      : statusOptions,
    [activeTab, statusOptions]
  );

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply Tab Filter
    if (activeTab === '원생') {
      result = result.filter(item => item.status === ENROLLED_STATUS);
    } else {
      result = result.filter(item => item.status !== ENROLLED_STATUS);
    }

    // Apply Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item => item.name.toLowerCase().includes(term) || item.school.toLowerCase().includes(term)
      );
    }

    // Apply Filters
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    if (columnFilters.school) {
      result = result.filter(item => columnFilters.school!.includes(item.school));
    }
    if (columnFilters.grade) {
      result = result.filter(item => columnFilters.grade!.includes(item.grade));
    }
    if (columnFilters.evalGrade) {
      result = result.filter(item => columnFilters.evalGrade!.includes(item.evalGrade || '-'));
    }
    if (columnFilters.className) {
      result = result.filter(item => columnFilters.className!.includes(item.className || '-'));
    }
    if (columnFilters.status) {
      result = result.filter(item => columnFilters.status!.includes(item.status));
    }

    // Apply Sorting
    const dir = sortOrder === 'asc' ? 1 : -1;
    const summaryOf = (id: string) => openSummaryMap[id] ?? emptyOpenSummary();
    const fallbackCompare = (a: Consultation, b: Consultation) => parseDateValue(b.date) - parseDateValue(a.date);
    const compareGrade = (left?: string, right?: string) => {
      const ga = gradeNum(left || '');
      const gb = gradeNum(right || '');
      if (ga === -1 && gb === -1) return 0;
      if (ga === -1) return 1;
      if (gb === -1) return -1;
      return (ga - gb) * dir;
    };
    if (sortField === 'manual') {
      const index = new Map(data.map((item, i) => [item.id, i]));
      result.sort((a, b) => Number(index.get(a.id) ?? 0) - Number(index.get(b.id) ?? 0));
      return result;
    }
    result.sort((a, b) => {
      if (sortField === 'date') {
        return (parseDateValue(a.date) - parseDateValue(b.date)) * dir;
      }
      if (sortField === 'testDate') {
        return (parseDateValue(a.testDate) - parseDateValue(b.testDate)) * dir;
      }
      if (sortField === 'studentNumber') {
        return (studentNumTrailing(a.studentNumber) - studentNumTrailing(b.studentNumber)) * dir;
      }
      if (sortField === 'school') {
        return (a.school || '').localeCompare(b.school || '', 'ko') * dir;
      }
      if (sortField === 'grade') {
        return compareGrade(a.grade, b.grade);
      }
      if (sortField === 'evalGrade') {
        return compareGrade(a.evalGrade, b.evalGrade);
      }
      if (sortField === 'className') {
        const g = compareGrade(a.className, b.className);
        if (g !== 0) return g;
        return (a.className || '').localeCompare(b.className || '', 'ko') * dir;
      }
      if (sortField === 'status') {
        const rank = (status: string) => {
          const i = statusOptions.indexOf(status);
          return i === -1 ? statusOptions.length : i;
        };
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r * dir;
        return (a.status || '').localeCompare(b.status || '', 'ko') * dir;
      }
      if (sortField === 'journal') {
        return compareStudentsByOpenRequests(a, b, summaryOf, fallbackCompare) * dir;
      }
      const valA = (sortField === 'name' || sortField === 'studentPhone' ? a[sortField] : '') || '';
      const valB = (sortField === 'name' || sortField === 'studentPhone' ? b[sortField] : '') || '';
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    return result;
  }, [
    data,
    searchTerm,
    statusFilter,
    columnFilters,
    sortField,
    sortOrder,
    activeTab,
    statusOptions,
    openSummaryMap,
  ]);

  const handleSort = (field: SortField) => {
    if (Date.now() < ignoreSortUntilRef.current) return;
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' || field === 'journal' ? 'desc' : 'asc');
    }
  };

  const handleResetAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setColumnFilters({ school: null, grade: null, evalGrade: null, className: null, status: null });
    setOpenColumnFilter(null);
    setSortField('date');
    setSortOrder('desc');
    setEnrolledFilterKey((key) => key + 1);
  };

  const handleRenameStatus = (oldStatus: string, newStatus: string) => {
    if (newStatus.trim() && newStatus !== oldStatus) {
      const trimmed = newStatus.trim();
      setStatusOptions(statusOptions.map(s => s === oldStatus ? trimmed : s));
      setData(data.map(d => d.status === oldStatus ? { ...d, status: trimmed as any } : d));
    }
  };

  const handleRenameClass = (oldClass: string, newClass: string) => {
    if (newClass.trim() && newClass !== oldClass) {
      const trimmed = newClass.trim();
      setClassOptions(sortByGradeDesc(classOptions.map(c => c === oldClass ? trimmed : c)));
      setData(data.map(d => d.className === oldClass ? { ...d, className: trimmed } : d));
    }
  };

  const handleSaveRow = (updatedRow: Consultation) => {
    const visualIds = processedData.map(row => row.id);
    setData(prev => {
      const next = prev.map(row => row.id === updatedRow.id ? updatedRow : row);
      const byId = new Map(next.map(row => [row.id, row]));
      const used = new Set(visualIds);
      let i = 0;
      return prev.map(row => {
        if (!used.has(row.id)) return byId.get(row.id) ?? row;
        return byId.get(visualIds[i++])!;
      });
    });
    if (sortField !== 'manual') setSortField('manual');
    ignoreSortUntilRef.current = Date.now() + 500;
  };

  const handleDeleteRow = (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
  };

  const handleReorderRows = (fromId: string, toId: string, place: 'before' | 'after' = 'before') => {
    const nextVisible = reorderIds(processedData.map((row) => row.id), fromId, toId, place);
    if (!nextVisible) return;
    setData((prev) => {
      const byId = new Map(prev.map((row) => [row.id, row]));
      const used = new Set(nextVisible);
      let i = 0;
      return prev.map((row) => {
        if (!used.has(row.id)) return row;
        return byId.get(nextVisible[i++])!;
      });
    });
    setSortField('manual');
  };

  const handleAddConsultation = () => {
    const newId = (Math.max(...data.map(d => parseInt(d.id) || 0)) + 1).toString();
    const newEntry: Consultation = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      name: '',
      school: '',
      grade: '',
      status: INQUIRY_STATUS,
      className: '-',
      evalGrade: '',
      testDate: '',
      notes: []
    };
    setData([newEntry, ...data]);
    setSortField('date');
    setSortOrder('desc');
  };

  const isStudentView = activeTab === '원생';
  const isProspectBoard = activeTab === '예비원생';
  const filterAlign = 'left' as const;
  const journalStudent = data.find((row) => row.id === journalStudentId) ?? null;

  const closeProspectJournal = () => {
    const studentId = journalStudentId;
    setJournalStudentId(null);
    window.requestAnimationFrame(() => {
      if (!studentId) return;
      journalButtonRef.current?.focus();
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-neutral-900 flex flex-col">
      {/* Header & Control Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-neutral-100 p-0.5 rounded-md">
              <button onClick={() => { setActiveTab('원생'); setStatusFilter('all'); setSelectedProspectId(null); }} className={`px-3 py-1.5 text-[13px] rounded-sm transition-colors ${activeTab === '원생' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>원생</button>
              <button onClick={() => { setActiveTab('예비원생'); setStatusFilter('all'); setSelectedProspectId(null); }} className={`px-3 py-1.5 text-[13px] rounded-sm transition-colors ${activeTab === '예비원생' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>예비원생</button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-2 text-gray-400" />
              <input
                ref={studentSearchRef}
                type="text"
                placeholder="이름 또는 학교 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[13px] bg-neutral-100 border-transparent rounded-md focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all w-64 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleResetAll} className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-md text-[13px] transition-colors" title="초기화">
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center w-8 h-8 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors" title="설정">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={handleAddConsultation} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-md text-[13px] transition-colors">
              <Plus className="w-4 h-4" />
              신규 문의
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col px-4 py-3 gap-3">

        {isStudentView && (
          <CurrentStudentDashboard
            key={enrolledFilterKey}
            students={data.filter((item) => item.status === ENROLLED_STATUS)}
            classOptions={classOptions}
            schoolOptions={schools}
            onSave={handleSaveRow}
            searchTerm={searchTerm}
            onResetSearch={() => setSearchTerm('')}
            classOrder={enrolledOrderByClass}
            onClassOrderChange={setEnrolledOrderByClass}
          />
        )}

        {!isStudentView && <>
        {/* Summary Cards */}
        <div className="flex flex-col shrink-0 gap-1">
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} 
               className="flex items-center gap-1 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
             >
               상태 요약
               {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
          </div>
          {isSummaryExpanded && (
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${visibleSummaryStatuses.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-7'}`}>
              {visibleSummaryStatuses.map((status) => {
                const selected = statusFilter === status;
                const funnel = PROSPECT_FUNNEL[status];
                return (
                <div
                  key={status}
                  className={[
                    'rounded-md border px-3 py-2 flex flex-col justify-center cursor-pointer transition-colors',
                    selected ? funnel?.selected : funnel?.card,
                  ].join(' ')}
                  onClick={() => setStatusFilter(selected ? 'all' : status)}
                >
                  <div
                    className={['text-[12px] mb-1 truncate font-medium', selected ? funnel?.count : funnel?.label].join(' ')}
                    title={status}
                  >
                    {STATUS_SHORT_LABEL[status] || status}
                  </div>
                  <div className={['text-[18px] font-semibold leading-none', funnel?.count].join(' ')}>
                    {summaryCounts[status] || 0}
                    <span className="text-[12px] font-normal ml-1 text-neutral-400">명</span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white border border-neutral-200">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse table-fixed min-w-[1360px] text-left">
              <colgroup>
                <col style={{ width: 16 }} />
              </colgroup>
              <thead className="bg-white border-b border-neutral-200 text-[12px] font-medium text-neutral-500 sticky top-0 z-10">
                <tr className="h-10">
                  <th className="px-0 py-0 w-4 min-w-4 max-w-4"></th>
                  {isStudentView ? (
                    <th
                      className="px-3 whitespace-nowrap cursor-pointer hover:text-neutral-800 w-[90px]"
                      onClick={() => handleSort('studentNumber')}
                    >
                      <div className="flex items-center gap-1 justify-start">학생번호 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  ) : (
                    <th
                      className="px-3 whitespace-nowrap cursor-pointer hover:text-neutral-800 w-[108px]"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1 justify-start">문의일 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  )}
                  <th
                    className="px-3 whitespace-nowrap cursor-pointer hover:text-neutral-800 w-[148px]"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1 justify-start">이름 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="px-3 whitespace-nowrap w-[140px]">특이사항</th>
                  <th className="px-3 whitespace-nowrap w-[108px]">
                    <ColumnFilterHeader
                      label="학교"
                      options={schoolChoices}
                      selected={columnFilters.school}
                      isOpen={openColumnFilter === 'school'}
                      onToggle={() => setOpenColumnFilter(openColumnFilter === 'school' ? null : 'school')}
                      onClose={() => setOpenColumnFilter(null)}
                      onChange={(next) => applyColumnFilter('school', next)}
                      align={filterAlign}
                    />
                  </th>
                  <th className="px-3 whitespace-nowrap w-[72px]">
                    <ColumnFilterHeader
                      label="학년"
                      options={gradeChoices}
                      selected={columnFilters.grade}
                      isOpen={openColumnFilter === 'grade'}
                      onToggle={() => setOpenColumnFilter(openColumnFilter === 'grade' ? null : 'grade')}
                      onClose={() => setOpenColumnFilter(null)}
                      onChange={(next) => applyColumnFilter('grade', next)}
                      align={filterAlign}
                    />
                  </th>
                  {isStudentView ? (
                    <th
                      className="px-3 whitespace-nowrap cursor-pointer hover:text-neutral-800 w-[140px]"
                      onClick={() => handleSort('studentPhone')}
                    >
                      <div className="flex items-center gap-1 justify-start">학생 전화번호 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  ) : (
                    <>
                      <th className="px-3 whitespace-nowrap w-[88px]">
                        <ColumnFilterHeader
                          label="평가학년"
                          options={evalGradeChoices}
                          selected={columnFilters.evalGrade}
                          isOpen={openColumnFilter === 'evalGrade'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'evalGrade' ? null : 'evalGrade')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('evalGrade', next)}
                          align={filterAlign}
                        />
                      </th>
                      <th
                        className="px-3 whitespace-nowrap cursor-pointer hover:text-neutral-800 w-[108px]"
                        onClick={() => handleSort('testDate')}
                      >
                        <div className="flex items-center gap-1 justify-start">테스트일 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                      </th>
                      <th className="px-3 whitespace-nowrap w-[148px]">
                        <ColumnFilterHeader
                          label="추천반"
                          options={classChoices}
                          selected={columnFilters.className}
                          isOpen={openColumnFilter === 'className'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'className' ? null : 'className')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('className', next)}
                          align={filterAlign}
                        />
                      </th>
                      <th className="px-3 whitespace-nowrap w-[108px]">
                        <ColumnFilterHeader
                          label="상태"
                          options={statusChoices}
                          selected={columnFilters.status}
                          isOpen={openColumnFilter === 'status'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'status' ? null : 'status')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('status', next)}
                          align={filterAlign}
                        />
                      </th>
                    </>
                  )}
                  {isStudentView && (
                    <th className="px-3 whitespace-nowrap w-[140px]">
                      <ColumnFilterHeader
                        label="반"
                        options={classChoices}
                        selected={columnFilters.className}
                        isOpen={openColumnFilter === 'className'}
                        onToggle={() => setOpenColumnFilter(openColumnFilter === 'className' ? null : 'className')}
                        onClose={() => setOpenColumnFilter(null)}
                        onChange={(next) => applyColumnFilter('className', next)}
                        align={filterAlign}
                      />
                    </th>
                  )}
                  {isProspectBoard ? (
                    <>
                      <th
                        className="px-3 whitespace-nowrap w-[220px] sticky right-[112px] bg-white z-20 border-0 cursor-pointer hover:text-neutral-800"
                        onClick={() => handleSort('journal')}
                      >
                        <div className="flex items-center gap-1 justify-start">상담일지 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                      </th>
                      <th className="px-2 whitespace-nowrap w-[72px] sticky right-10 bg-white z-20 border-0">원생등록</th>
                      <th className="px-1 whitespace-nowrap w-10 sticky right-0 bg-white z-20 border-0" aria-label="더보기"></th>
                    </>
                  ) : (
                    <>
                      <th
                        className="px-3 whitespace-nowrap w-[220px] sticky right-10 bg-white z-20 border-0 cursor-pointer hover:text-neutral-800"
                        onClick={() => handleSort('journal')}
                      >
                        <div className="flex items-center gap-1 justify-start">상담일지 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                      </th>
                      <th className="px-1 whitespace-nowrap w-10 sticky right-0 bg-white z-20 border-0" aria-label="더보기"></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {processedData.length > 0 ? (
                  processedData.map((row) => (
                    <EditableRow
                      key={row.id}
                      data={row}
                      onSave={handleSaveRow}
                      onDelete={handleDeleteRow}
                      onReorder={handleReorderRows}
                      selected={selectedProspectId === row.id}
                      onSelect={() => setSelectedProspectId(row.id)}
                      statusOptions={statusOptions}
                      classOptions={classOptions}
                      schoolOptions={schools}
                      gradeOptions={grades}
                      isStudentView={isStudentView}
                      isProspectBoard={isProspectBoard}
                      nextStudentNumber={nextStudentNumber}
                      displayStudentNumber={shortStudentNum}
                      onOpenJournal={(button) => {
                        journalButtonRef.current = button;
                        setJournalStudentId(row.id);
                      }}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={isStudentView ? 10 : 13} className="px-4 py-8 text-center text-neutral-400 text-[13px]">
                      조건에 맞는 학생이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-neutral-200 px-4 py-2 text-[12px] text-neutral-400 flex justify-between bg-white">
            <span>총 {processedData.length}건</span>
            <span>데이터는 브라우저 메모리에 임시 저장됩니다.</span>
          </div>
        </div>
        </>}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-900">목록 설정</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Status Options */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-semibold text-gray-800 text-sm">상태 (Status) 목록</div>
                <div className="p-3">
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={settingsNewStatus}
                      onChange={e => setSettingsNewStatus(e.target.value)}
                      placeholder="새로운 상태 입력..."
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => {
                        if (settingsNewStatus.trim() && !statusOptions.includes(settingsNewStatus.trim())) {
                          setStatusOptions([...statusOptions, settingsNewStatus.trim()]);
                          setSettingsNewStatus('');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      추가
                    </button>
                  </div>
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {statusOptions.map(status => (
                      <EditableListItem
                        key={status}
                        value={status}
                        onRename={handleRenameStatus}
                        confirmDelete
                        onDelete={() => setStatusOptions(statusOptions.filter(s => s !== status))}
                      />
                    ))}
                  </ul>
                </div>
              </div>

              {/* Class Options */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-semibold text-gray-800 text-sm">반 (Class) 목록</div>
                <div className="p-3">
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={settingsNewClass}
                      onChange={e => setSettingsNewClass(e.target.value)}
                      placeholder="새로운 반 입력..."
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => {
                        if (settingsNewClass.trim() && !classOptions.includes(settingsNewClass.trim())) {
                          setClassOptions(sortByGradeDesc([...classOptions, settingsNewClass.trim()]));
                          setSettingsNewClass('');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      추가
                    </button>
                  </div>
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {classOptions.map(cls => (
                      <EditableListItem 
                        key={cls} 
                        value={cls} 
                        onRename={handleRenameClass}
                        onDelete={() => setClassOptions(classOptions.filter(c => c !== cls))}
                      />
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {journalStudent && (
        <NotesModal
          open
          student={journalStudent}
          onSave={handleSaveRow}
          onClose={closeProspectJournal}
        />
      )}
    </div>
  );
}
