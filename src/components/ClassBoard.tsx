import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CLASS_DATA, MARK_META, MAX_COLS, TEACHER_ORDER, TOTAL_CLASSES, TOTAL_STUDENTS,
  MONTH_HEADER_CLASS, MONTH_LABEL, annotateDates,
  ClassDef, ClassStudent, Mark,
} from '../classData';
import { Users, Clock, Pencil, Save, Plus, Trash2 } from 'lucide-react';

interface ClassBoardProps {
  searchTerm: string;
  teacherFilter?: string;
}

const CELL_W = 46;
const MARK_CYCLE: Mark[] = ['na', 'offline', 'online', 'recorded']; // 불참 → 출석 → 온라인 → 녹화

const nextMark = (m: Mark): Mark => {
  const i = MARK_CYCLE.indexOf(m);
  return MARK_CYCLE[(i + 1) % MARK_CYCLE.length];
};

const countAttended = (marks: Mark[]): number => marks.filter((m) => m !== 'na').length;

const blankMarks = (total: number): Mark[] => Array.from({ length: total }, () => 'na' as Mark);

/** 연속된 같은 월 구간 → colspan용 */
const monthSpans = (annotated: { day: number; month: number }[]) => {
  const spans: { month: number; start: number; len: number }[] = [];
  annotated.forEach((a, i) => {
    const last = spans[spans.length - 1];
    if (last && last.month === a.month) last.len += 1;
    else spans.push({ month: a.month, start: i, len: 1 });
  });
  return spans;
};

const NoteCell: React.FC<{
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}> = ({ value, onChange, highlight }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(360, Math.max(240, window.innerWidth * 0.7));
      let left = r.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const panelH = panelRef.current?.offsetHeight ?? 180;
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow >= panelH + 8 ? r.bottom + 4 : Math.max(8, r.top - panelH - 4);
      setPos({ top, left, width });
    };
    place();
    // 패널 높이 측정 후 한 번 더 위치 보정
    requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      areaRef.current?.focus();
      const el = areaRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [open, pos]);

  const commit = () => {
    onChange(draft);
    setOpen(false);
    setPos(null);
  };

  const cancel = () => {
    setDraft(value);
    setOpen(false);
    setPos(null);
  };

  return (
    <td className={`sticky right-10 z-10 border border-gray-200 px-1.5 py-0.5 ${highlight ? 'bg-yellow-50' : 'bg-white'}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(true)}
        title={value || '메모 입력...'}
        className="w-full text-left truncate bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-1.5 py-1 text-xs text-gray-700 outline-none"
      >
        {value || <span className="text-gray-300">메모 입력...</span>}
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={commit} aria-hidden />
            <div
              ref={panelRef}
              style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { visibility: 'hidden', top: 0, left: 0 }}
              className="fixed z-[110] rounded-lg border border-blue-300 bg-white shadow-xl p-2"
            >
              <textarea
                ref={areaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancel();
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
                }}
                rows={5}
                placeholder="메모 입력..."
                className="w-full resize-y border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400 min-h-[96px]"
              />
              <div className="mt-1.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancel}
                  className="px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 rounded"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={commit}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  확인
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </td>
  );
};

const ScheduleEditor: React.FC<{
  days: string;
  time: string;
  onChange: (days: string, time: string) => void;
}> = ({ days, time, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState(days);
  const [t, setT] = useState(time);

  const save = () => {
    setEditing(false);
    onChange(d.trim() || days, t.trim() || time);
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          value={d}
          onChange={(e) => setD(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
          className="w-24 border border-blue-400 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="요일"
        />
        <input
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="w-40 border border-blue-400 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="시간"
        />
        <button onClick={save} className="text-xs font-medium text-blue-700 hover:text-blue-900 px-1">확인</button>
      </span>
    );
  }

  return (
    <button
      onClick={() => { setD(days); setT(time); setEditing(true); }}
      className="group/sched flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      title="클릭하여 요일·시간 변경"
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="font-medium">{days} {time}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover/sched:opacity-100 transition-opacity" />
    </button>
  );
};

type StudentDraft = { marks: Mark[]; note: string; name: string };

type RosterStudent = Pick<ClassStudent, 'no' | 'name'>;

const ClassTable: React.FC<{
  cls: ClassDef;
  schedule: { days: string; time: string };
  onSchedule: (days: string, time: string) => void;
  q: string;
}> = ({ cls, schedule, onSchedule, q }) => {
  const pad = (n: number) => Array.from({ length: Math.max(0, n) });
  const annotated = useMemo(() => annotateDates(cls.dates), [cls.dates]);
  const spans = useMemo(() => monthSpans(annotated), [annotated]);
  const padCount = Math.max(0, MAX_COLS - cls.dates.length);

  const buildDraft = (students: ClassStudent[]) =>
    Object.fromEntries(
      students.map((s) => [s.no, { marks: [...s.marks], note: s.note || '', name: s.name }])
    ) as Record<number, StudentDraft>;

  const [roster, setRoster] = useState<RosterStudent[]>(() =>
    cls.students.map((s) => ({ no: s.no, name: s.name }))
  );
  const [saved, setSaved] = useState(() => buildDraft(cls.students));
  const [draft, setDraft] = useState(() => buildDraft(cls.students));
  const [nextNo, setNextNo] = useState(() => Math.max(0, ...cls.students.map((s) => s.no)) + 1);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => {
    const rosterChanged =
      roster.length !== Object.keys(saved).length ||
      roster.some((r) => !saved[r.no] || saved[r.no].name !== draft[r.no]?.name);
    const draftChanged = JSON.stringify(saved) !== JSON.stringify(draft);
    return rosterChanged || draftChanged;
  }, [saved, draft, roster]);

  const paintRef = useRef<{ active: boolean; mark: Mark }>({ active: false, mark: 'offline' });
  const [paintMark, setPaintMark] = useState<Mark | null>(null);

  useEffect(() => {
    const up = () => {
      paintRef.current.active = false;
      setPaintMark(null);
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const setCell = (studentNo: number, col: number, mark: Mark) => {
    if (col >= cls.total) return;
    setDraft((prev) => {
      const cur = prev[studentNo];
      if (!cur || cur.marks[col] === mark) return prev;
      const marks = [...cur.marks];
      marks[col] = mark;
      return { ...prev, [studentNo]: { ...cur, marks } };
    });
  };

  const handleCellDown = (studentNo: number, col: number, current: Mark) => {
    if (col >= cls.total) return;
    const mark = nextMark(current);
    paintRef.current = { active: true, mark };
    setPaintMark(mark);
    setCell(studentNo, col, mark);
  };

  const handleCellEnter = (studentNo: number, col: number) => {
    if (!paintRef.current.active || col >= cls.total) return;
    setCell(studentNo, col, paintRef.current.mark);
  };

  const handleSave = () => {
    // 이름도 draft에 반영된 상태로 저장
    const next: Record<number, StudentDraft> = {};
    for (const r of roster) {
      const d = draft[r.no];
      if (d) next[r.no] = { ...d, name: d.name };
    }
    setSaved(JSON.parse(JSON.stringify(next)));
    setDraft(JSON.parse(JSON.stringify(next)));
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) {
      addInputRef.current?.focus();
      return;
    }
    const no = nextNo;
    setNextNo((n) => n + 1);
    setRoster((prev) => [...prev, { no, name }]);
    setDraft((prev) => ({
      ...prev,
      [no]: { marks: blankMarks(cls.total), note: '', name },
    }));
    setNewName('');
    setAdding(false);
  };

  const handleDelete = (no: number) => {
    const name = draft[no]?.name || '';
    if (!confirm(`"${name}" 학생을 이 반에서 삭제할까요?`)) return;
    setRoster((prev) => prev.filter((r) => r.no !== no));
    setDraft((prev) => {
      const next = { ...prev };
      delete next[no];
      return next;
    });
  };

  // 검색: 반은 필터링하되, 반이 보이면 학생 전원 표시 + 매칭 이름만 하이라이트
  const displayRoster = roster;

  return (
    <section className={`bg-white border rounded-lg shadow-sm overflow-hidden shrink-0 ${dirty ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3 flex-wrap px-3 py-2.5 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-gray-800 text-[15px]">{cls.name}</h3>
        <ScheduleEditor days={schedule.days} time={schedule.time} onChange={onSchedule} />
        <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
          <Users className="w-3.5 h-3.5" />
          수강 {roster.length}명
        </span>
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
          총 {cls.total}회
        </span>
        {paintMark && (
          <span className={`text-[11px] px-2 py-0.5 rounded border ${MARK_META[paintMark].cell}`}>
            드래그 중: {MARK_META[paintMark].label}
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              dirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={dirty ? '변경사항 저장' : '변경사항 없음'}
          >
            <Save className="w-3.5 h-3.5" />
            저장
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-center w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 34 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 56 }} />
            {pad(MAX_COLS).map((_, i) => (
              <col key={i} style={{ width: CELL_W }} />
            ))}
            <col style={{ width: 200 }} />
            <col style={{ width: 40 }} />
          </colgroup>
          <thead>
            {/* 월 구간 헤더 (캘린더형) */}
            <tr>
              <th rowSpan={2} className="border border-gray-200 px-1 py-1.5 text-[11px] font-semibold bg-gray-100 text-gray-600">No.</th>
              <th rowSpan={2} className="sticky left-0 z-10 bg-gray-100 border border-gray-200 px-2 py-1.5 text-xs font-semibold text-left text-gray-600">이름</th>
              <th rowSpan={2} className="border border-gray-200 px-1 py-1.5 text-[11px] font-semibold text-emerald-700 bg-gray-100" title="참여 회수 / 총 회수">참여</th>
              {spans.map((sp) => (
                <th
                  key={`m-${sp.start}`}
                  colSpan={sp.len}
                  className={`border border-gray-200 py-0.5 text-[10px] font-semibold tracking-wide ${MONTH_HEADER_CLASS[sp.month] ?? 'bg-gray-50 text-gray-600'}`}
                >
                  {MONTH_LABEL[sp.month] ?? `${sp.month + 1}월`}
                </th>
              ))}
              {padCount > 0 && (
                <th colSpan={padCount} className="border border-gray-200 bg-gray-50" />
              )}
              <th rowSpan={2} className="sticky right-10 z-10 bg-gray-100 border border-gray-200 px-2 py-1.5 text-xs font-semibold text-left text-gray-600">Note</th>
              <th rowSpan={2} className="sticky right-0 z-10 bg-gray-100 border border-gray-200 px-1 py-1.5 text-[10px] font-semibold" />
            </tr>
            <tr className="bg-gray-100 text-gray-600">
              {pad(MAX_COLS).map((_, i) => {
                const a = annotated[i];
                const color = a ? (MONTH_HEADER_CLASS[a.month] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-50 text-gray-300';
                return (
                  <th key={i} className={`border border-gray-200 py-1.5 text-[11px] font-semibold ${color}`}>
                    {a ? a.day : ''}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayRoster.map((r, idx) => {
              const d = draft[r.no];
              if (!d) return null;
              const hl = !!q && d.name.toLowerCase().includes(q);
              const attended = countAttended(d.marks);
              return (
                <tr key={r.no} className={hl ? 'bg-yellow-50' : 'hover:bg-blue-50/40 group'}>
                  <td className="border border-gray-200 text-[11px] text-gray-400">{idx + 1}</td>
                  <td className={`sticky left-0 z-10 border border-gray-200 px-1 py-1 text-left ${hl ? 'bg-yellow-50' : 'bg-white'}`}>
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [r.no]: { ...prev[r.no], name: e.target.value },
                        }))
                      }
                      className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 focus:bg-white rounded px-1 py-0.5 text-sm font-medium text-gray-800 outline-none"
                    />
                  </td>
                  <td className="border border-gray-200 text-sm font-bold text-emerald-700 bg-emerald-50/50">
                    {attended}<span className="text-[10px] font-normal text-gray-400">/{cls.total}</span>
                  </td>
                  {pad(MAX_COLS).map((_, ci) => {
                    const editable = ci < cls.total;
                    const mark: Mark | null = editable ? d.marks[ci] : null;
                    const meta = mark ? MARK_META[mark] : null;
                    const day = cls.dates[ci];
                    return (
                      <td
                        key={ci}
                        onMouseDown={(e) => {
                          if (!editable || !mark) return;
                          e.preventDefault();
                          handleCellDown(r.no, ci, mark);
                        }}
                        onMouseEnter={() => editable && handleCellEnter(r.no, ci)}
                        className={`border border-gray-200 h-8 text-[11px] leading-none select-none ${
                          editable ? 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-300' : 'bg-gray-50 text-gray-200'
                        } ${meta ? meta.cell : ''}`}
                        title={
                          editable && meta && day
                            ? `${d.name} · ${day}일 · ${meta.label} (클릭/드래그로 변경)`
                            : '해당 없음'
                        }
                      >
                        {meta ? meta.glyph : ''}
                      </td>
                    );
                  })}
                  <NoteCell
                    value={d.note}
                    highlight={hl}
                    onChange={(note) =>
                      setDraft((prev) => ({
                        ...prev,
                        [r.no]: { ...prev[r.no], note },
                      }))
                    }
                  />
                  <td className={`sticky right-0 z-10 border border-gray-200 px-0.5 ${hl ? 'bg-yellow-50' : 'bg-white'}`}>
                    <button
                      onClick={() => handleDelete(r.no)}
                      className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="학생 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 수강 추가 */}
      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
        {adding ? (
          <div className="flex items-center gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setAdding(false); setNewName(''); }
              }}
              placeholder="학생 이름 입력..."
              className="flex-1 max-w-xs border border-blue-400 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              추가
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); }}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            수강 추가
          </button>
        )}
      </div>

      {dirty && (
        <div className="px-3 py-1.5 text-[11px] text-amber-700 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
          <span>저장되지 않은 변경사항이 있습니다.</span>
          <button onClick={handleSave} className="font-semibold underline hover:no-underline">저장하기</button>
        </div>
      )}
    </section>
  );
};

export const ClassBoard: React.FC<ClassBoardProps> = ({ searchTerm, teacherFilter = 'all' }) => {
  const q = searchTerm.trim().toLowerCase();

  const [schedules, setSchedules] = useState<Record<string, { days: string; time: string }>>(() =>
    Object.fromEntries(CLASS_DATA.map((c) => [c.name, { days: c.days, time: c.time }]))
  );

  // 반 단위 필터: 선생님 + 반/학생 검색
  const teachers = useMemo(() => {
    return TEACHER_ORDER.filter((name) => teacherFilter === 'all' || name === teacherFilter).map((name) => {
      const classes = CLASS_DATA.filter((c) => c.teacher === name).filter((c) => {
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.students.some((s) => s.name.toLowerCase().includes(q));
      });
      return { name, classes };
    }).filter((t) => t.classes.length > 0);
  }, [q, teacherFilter]);

  const shownClasses = teachers.reduce((n, t) => n + t.classes.length, 0);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-5">
      <div className="flex items-center gap-4 flex-wrap text-xs bg-white border border-gray-200 rounded-lg px-4 py-2.5 shrink-0 sticky top-0 z-20">
        <span className="font-bold text-gray-800 text-sm">총 {TOTAL_CLASSES}개 반 · {TOTAL_STUDENTS}명</span>
        <span className="h-4 w-px bg-gray-200" />
        <span className="text-gray-500 font-semibold">범례</span>
        {MARK_CYCLE.map((m) => (
          <span key={m} className="flex items-center gap-1.5 text-gray-600">
            <span className={`inline-flex items-center justify-center min-w-[42px] h-6 px-1 rounded border border-gray-200 text-[11px] ${MARK_META[m].cell}`}>
              {MARK_META[m].glyph || '\u00A0'}
            </span>
            {MARK_META[m].label}
          </span>
        ))}
        <span className="ml-auto text-gray-400">학생 검색 시 해당 반 전체 표시 · 하이라이트 · Ctrl+F</span>
      </div>

      {shownClasses === 0 && (
        <div className="text-center text-gray-500 text-sm py-12 bg-white border border-gray-200 rounded-lg">
          조건에 맞는 반이 없습니다.
        </div>
      )}

      {teachers.map((t) => (
        <div key={t.name} className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-bold text-gray-800 bg-yellow-100 border border-yellow-200 rounded px-2.5 py-0.5">{t.name}</span>
            <span className="text-xs text-gray-400">{t.classes.length}개 반</span>
          </div>
          {t.classes.map((c) => (
            <ClassTable
              key={c.name}
              cls={c}
              schedule={schedules[c.name]}
              onSchedule={(days, time) => setSchedules((prev) => ({ ...prev, [c.name]: { days, time } }))}
              q={q}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
