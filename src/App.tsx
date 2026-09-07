import React, { useState, useMemo, useRef, useEffect } from 'react';
import { initialData } from './data';
import { Consultation, SortField, SortOrder, DEFAULT_STATUS_OPTIONS, ENROLLED_STATUS, INQUIRY_STATUS, GRADE_OPTIONS, getStatusStyle, migrateStatus, parseDateValue, normalizeDateInput } from './types';
import { EditableRow } from './components/EditableRow';
import { EditableListItem } from './components/EditableListItem';
import { ClassBoard } from './components/ClassBoard';
import { ColumnFilterHeader } from './components/ColumnFilterHeader';
import { TEACHER_ORDER } from './classData';
import { Search, Plus, ArrowUpDown, ChevronDown, ChevronUp, RotateCcw, Settings, X } from 'lucide-react';

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

  // 페이지 전환 (학생현황판 / 수업현황판)
  const [page, setPage] = useState<'students' | 'classes'>('students');
  const [classSearch, setClassSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const studentSearchRef = useRef<HTMLInputElement>(null);
  const classSearchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+F → 상단 앱 검색창 포커스 (브라우저 기본 검색 대신)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const el = page === 'classes' ? classSearchRef.current : studentSearchRef.current;
        el?.focus();
        el?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [page]);
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
  const [activeTab, setActiveTab] = useState<'all' | '원생' | '예비원생'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    if (activeTab === '예비원생') return data.filter(item => item.status !== ENROLLED_STATUS);
    return data;
  }, [data, activeTab]);

  const schoolChoices = useMemo(
    () => Array.from(new Set(tabData.map(d => d.school).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko')),
    [tabData]
  );
  const gradeChoices = useMemo(
    () => sortByGradeDesc([...new Set(tabData.map(d => d.grade).filter(Boolean))]),
    [tabData]
  );
  const evalGradeChoices = useMemo(
    () => {
      const vals = tabData.map(d => d.evalGrade || '-');
      return sortByGradeDesc([...new Set(vals)]);
    },
    [tabData]
  );
  const classChoices = useMemo(
    () => sortByGradeDesc([...new Set(tabData.map(d => d.className || '-'))]),
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
    } else if (activeTab === '예비원생') {
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
      result.sort((a, b) => (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0));
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
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    return result;
  }, [data, searchTerm, statusFilter, columnFilters, sortField, sortOrder, activeTab, statusOptions]);

  const handleSort = (field: SortField) => {
    if (Date.now() < ignoreSortUntilRef.current) return;
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const handleResetAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setColumnFilters({ school: null, grade: null, evalGrade: null, className: null, status: null });
    setOpenColumnFilter(null);
    setSortField('date');
    setSortOrder('desc');
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
    if (!fromId || !toId || fromId === toId) return;
    const visibleIds = processedData.map(row => row.id);
    const from = visibleIds.indexOf(fromId);
    const to = visibleIds.indexOf(toId);
    if (from < 0 || to < 0) return;
    const nextVisible = [...visibleIds];
    const [moved] = nextVisible.splice(from, 1);
    let insertAt = nextVisible.indexOf(toId);
    if (insertAt < 0) return;
    if (place === 'after') insertAt += 1;
    nextVisible.splice(insertAt, 0, moved);
    setData(prev => {
      const byId = new Map(prev.map(row => [row.id, row]));
      const used = new Set(nextVisible);
      let i = 0;
      return prev.map(row => {
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Header & Control Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Left: 페이지 전환 + 페이지별 서브 컨트롤 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setPage('students')}
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${page === 'students' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                학생현황판
              </button>
              <button
                onClick={() => setPage('classes')}
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${page === 'classes' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                수업현황판
              </button>
            </div>

            {page === 'students' && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>전체</button>
                <button onClick={() => setActiveTab('원생')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === '원생' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>원생</button>
                <button onClick={() => setActiveTab('예비원생')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === '예비원생' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>예비원생</button>
              </div>
            )}

            {page === 'classes' && (
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5 whitespace-nowrap">
                2026 여름 특강 참석표
              </span>
            )}
          </div>

          {/* Center: 검색 + 필터 (가운데 정렬) */}
          <div className="flex-1 flex items-center justify-center gap-3">
            {page === 'students' ? (
              <>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-2 text-gray-400" />
                  <input
                    ref={studentSearchRef}
                    type="text"
                    placeholder="이름 또는 학교 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all w-64 outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-2 text-gray-400" />
                  <input
                    ref={classSearchRef}
                    type="text"
                    placeholder="반 또는 학생 검색... (Ctrl+F)"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all w-72 outline-none"
                  />
                </div>
                <select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-auto text-center font-medium"
                  style={{ textAlignLast: 'center' }}
                >
                  <option value="all">모든 선생님</option>
                  {TEACHER_ORDER.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Right: 액션 버튼 */}
          <div className="flex items-center gap-2 shrink-0">
            {page === 'students' ? (
              <>
                <button onClick={handleResetAll} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm" title="초기화">
                  <RotateCcw className="w-3.5 h-3.5" />
                  초기화
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm" title="설정">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={handleAddConsultation} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  신규 문의
                </button>
              </>
            ) : (
              <button
                onClick={() => { setClassSearch(''); setTeacherFilter('all'); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
                title="검색·필터 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 flex flex-col gap-4">

        {page === 'classes' && (
          <ClassBoard searchTerm={classSearch} teacherFilter={teacherFilter} />
        )}

        {page === 'students' && <>
        {/* Summary Cards */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} 
               className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
             >
               Status 요약
               {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
          </div>
          {isSummaryExpanded && (
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${visibleSummaryStatuses.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-7'}`}>
              {visibleSummaryStatuses.map((status) => (
                <div
                  key={status}
                  className={`rounded-lg border px-3 py-2 flex flex-col justify-center cursor-pointer hover:shadow-sm transition-shadow ${getStatusStyle(status).card} ${statusFilter === status ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                >
                  <div className="text-[10px] sm:text-xs font-semibold tracking-wide opacity-80 mb-0.5 truncate" title={status}>{STATUS_SHORT_LABEL[status] || status}</div>
                  <div className="text-xl sm:text-2xl font-bold leading-none">{summaryCounts[status] || 0}<span className="text-sm font-normal ml-1 opacity-70">명</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-center border-collapse table-fixed min-w-[1220px]">
              <colgroup>
                <col style={{ width: 16 }} />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-0 py-2.5 w-4 min-w-4 max-w-4"></th>
                  {isStudentView ? (
                    <th
                      className="px-2 py-2.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors w-[90px]"
                      onClick={() => handleSort('studentNumber')}
                    >
                      <div className="flex items-center justify-center gap-1">학생번호 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  ) : (
                    <th
                      className="px-2 py-2.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors w-[110px]"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center justify-center gap-1">문의 날짜 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  )}
                  <th
                    className="px-2 py-2.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors w-[140px]"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-center gap-1">이름 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="px-2 py-2.5 whitespace-nowrap w-[200px]">특이사항</th>
                  <th className="px-1 py-2.5 whitespace-nowrap w-[110px]">
                    <ColumnFilterHeader
                      label="학교"
                      options={schoolChoices}
                      selected={columnFilters.school}
                      isOpen={openColumnFilter === 'school'}
                      onToggle={() => setOpenColumnFilter(openColumnFilter === 'school' ? null : 'school')}
                      onClose={() => setOpenColumnFilter(null)}
                      onChange={(next) => applyColumnFilter('school', next)}
                    />
                  </th>
                  <th className="px-1 py-2.5 whitespace-nowrap w-[80px]">
                    <ColumnFilterHeader
                      label="학년"
                      options={gradeChoices}
                      selected={columnFilters.grade}
                      isOpen={openColumnFilter === 'grade'}
                      onToggle={() => setOpenColumnFilter(openColumnFilter === 'grade' ? null : 'grade')}
                      onClose={() => setOpenColumnFilter(null)}
                      onChange={(next) => applyColumnFilter('grade', next)}
                    />
                  </th>
                  {isStudentView ? (
                    <th
                      className="px-2 py-2.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors w-[140px]"
                      onClick={() => handleSort('studentPhone')}
                    >
                      <div className="flex items-center justify-center gap-1">학생 전화번호 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                    </th>
                  ) : (
                    <>
                      <th className="px-1 py-2.5 whitespace-nowrap w-[88px]">
                        <ColumnFilterHeader
                          label="평가학년"
                          options={evalGradeChoices}
                          selected={columnFilters.evalGrade}
                          isOpen={openColumnFilter === 'evalGrade'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'evalGrade' ? null : 'evalGrade')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('evalGrade', next)}
                        />
                      </th>
                      <th
                        className="px-2 py-2.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors w-[110px]"
                        onClick={() => handleSort('testDate')}
                      >
                        <div className="flex items-center justify-center gap-1">테스트일 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                      </th>
                      <th className="px-1 py-2.5 whitespace-nowrap w-[150px]">
                        <ColumnFilterHeader
                          label="추천 반"
                          options={classChoices}
                          selected={columnFilters.className}
                          isOpen={openColumnFilter === 'className'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'className' ? null : 'className')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('className', next)}
                        />
                      </th>
                      <th className="px-1 py-2.5 whitespace-nowrap w-[108px]">
                        <ColumnFilterHeader
                          label="Status"
                          options={statusChoices}
                          selected={columnFilters.status}
                          isOpen={openColumnFilter === 'status'}
                          onToggle={() => setOpenColumnFilter(openColumnFilter === 'status' ? null : 'status')}
                          onClose={() => setOpenColumnFilter(null)}
                          onChange={(next) => applyColumnFilter('status', next)}
                        />
                      </th>
                    </>
                  )}
                  {isStudentView && (
                    <th className="px-1 py-2.5 whitespace-nowrap w-[140px]">
                      <ColumnFilterHeader
                        label="반"
                        options={classChoices}
                        selected={columnFilters.className}
                        isOpen={openColumnFilter === 'className'}
                        onToggle={() => setOpenColumnFilter(openColumnFilter === 'className' ? null : 'className')}
                        onClose={() => setOpenColumnFilter(null)}
                        onChange={(next) => applyColumnFilter('className', next)}
                      />
                    </th>
                  )}
                  <th className="px-2 py-2.5 whitespace-nowrap w-[88px]">상담내역</th>
                  {!isStudentView && <th className="px-2 py-2.5 whitespace-nowrap w-[104px]"></th>}
                  <th className="px-2 py-2.5 whitespace-nowrap w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedData.length > 0 ? (
                  processedData.map((row) => (
                    <EditableRow key={row.id} data={row} onSave={handleSaveRow} onDelete={handleDeleteRow} onReorder={handleReorderRows} statusOptions={statusOptions} classOptions={classOptions} schoolOptions={schools} gradeOptions={grades} isStudentView={isStudentView} nextStudentNumber={nextStudentNumber} displayStudentNumber={shortStudentNum} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={isStudentView ? 10 : 13} className="px-4 py-8 text-center text-gray-500 text-sm">
                      조건에 맞는 상담 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between">
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
    </div>
  );
}
