import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Consultation, ENROLLED_STATUS, GRADE_OPTIONS, getStatusDot } from '../types';
import { X, GraduationCap, MoreHorizontal } from 'lucide-react';
import { DatePickerCell } from './DatePickerCell';
import { JournalButton } from '../requests/JournalButton';
import { useRequests } from '../requests/RequestContext';
import {
  dropEdgeFromPointer,
  dropLineClass,
  hideDragGhost,
  isRowDragInteractive,
  rowFillClass,
  useRowDropEdge,
} from './rowDrag';


interface EditableRowProps {
  data: Consultation;
  onSave: (updatedData: Consultation) => void;
  statusOptions: string[];
  classOptions: string[];
  schoolOptions: string[];
  gradeOptions: string[];
  isStudentView?: boolean;
  isProspectBoard?: boolean;
  nextStudentNumber?: string;
  displayStudentNumber?: (s?: string) => string;
  onDelete?: (id: string) => void;
  onReorder?: (fromId: string, toId: string, place: 'before' | 'after') => void;
  selected?: boolean;
  onSelect?: () => void;
  onOpenJournal?: (button: HTMLButtonElement | null) => void;
}

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
};

const memoPreview = (text: string): { tags: string[] } | { text: string } => {
  const parts = text.split(/[,/·|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { tags: parts.slice(0, 2) };
  return { text: text.length > 22 ? `${text.slice(0, 22)}…` : text };
};

export const EditableRow: React.FC<EditableRowProps> = ({
  data,
  onSave,
  statusOptions,
  classOptions,
  schoolOptions,
  gradeOptions,
  isStudentView = false,
  isProspectBoard = false,
  nextStudentNumber = '',
  displayStudentNumber,
  onDelete,
  onReorder,
  selected = false,
  onSelect,
  onOpenJournal,
}) => {
  const journalRef = useRef<HTMLButtonElement>(null);
  const { openSummary } = useRequests();
  const journalSummary = openSummary(data.id);

  const [showConvert, setShowConvert] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [convertForm, setConvertForm] = useState({ studentNumber: '', studentPhone: '', parentPhone: '', email: '' });

  const [inlineName, setInlineName] = useState(data.name);
  useEffect(() => { setInlineName(data.name); }, [data.name]);

  const [inlineMemo, setInlineMemo] = useState(data.memo || '');
  useEffect(() => { setInlineMemo(data.memo || ''); }, [data.memo]);
  const [memoEditing, setMemoEditing] = useState(false);
  const { dropEdge, setDropEdge, dragging, setDragging } = useRowDropEdge();
  const [memoRect, setMemoRect] = useState<DOMRect | null>(null);
  const memoAreaRef = useRef<HTMLTextAreaElement>(null);
  const memoCellRef = useRef<HTMLTableCellElement>(null);

  const [inlinePhone, setInlinePhone] = useState(data.studentPhone || '');
  useEffect(() => { setInlinePhone(data.studentPhone || ''); }, [data.studentPhone]);

  useEffect(() => {
    if (!memoEditing) return;
    memoAreaRef.current?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (memoAreaRef.current?.contains(event.target as Node)) return;
      const next = memoAreaRef.current?.value.trim() ?? '';
      setInlineMemo(next);
      if (next !== (data.memo || '')) onSave({ ...data, memo: next });
      setMemoEditing(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [memoEditing, data, onSave]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || moreBtnRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (!showConvert && !showDelete && !memoEditing && !menuOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      setShowConvert(false);
      setShowDelete(false);
      if (memoEditing) {
        setInlineMemo(data.memo || '');
        setMemoEditing(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [showConvert, showDelete, memoEditing, menuOpen]);

  const selectableStatuses = statusOptions.filter(status => status !== ENROLLED_STATUS);
  const gradeSelectOptions = [...new Set([...GRADE_OPTIONS, ...gradeOptions])];

  const openConvert = () => {
    setConvertForm({
      studentNumber: data.studentNumber || nextStudentNumber,
      studentPhone: data.studentPhone || '',
      parentPhone: data.parentPhone || '',
      email: data.email || '',
    });
    setShowConvert(true);
  };

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus === ENROLLED_STATUS && data.status !== ENROLLED_STATUS) {
      openConvert();
    } else {
      onSave({ ...data, status: newStatus });
    }
  };

  const confirmConvert = () => {
    // 등록은 같은 Consultation.id를 유지한다. 요청은 studentId로 이어지며 중복 생성하지 않는다.
    onSave({
      ...data,
      status: ENROLLED_STATUS,
      studentNumber: convertForm.studentNumber.trim(),
      studentPhone: convertForm.studentPhone.trim(),
      parentPhone: convertForm.parentPhone.trim(),
      email: convertForm.email.trim(),
    });
    setShowConvert(false);
  };

  const fill = rowFillClass({ dragging, selected });
  const line = dropLineClass(dropEdge);
  const cellClass = `px-3 h-12 text-[13px] text-neutral-600 border-b border-neutral-100 align-middle ${line}`;
  const fieldClass = 'w-full h-7 px-0 text-[13px] text-left bg-transparent border-0 outline-none';
  const selectClass = 'w-full h-7 px-0 text-[13px] text-left text-neutral-600 bg-transparent border-0 outline-none appearance-none cursor-pointer';
  const stickyAction = `sticky ${fill}`;
  const memoView = inlineMemo ? memoPreview(inlineMemo) : null;
  const openMemo = () => {
    setMemoRect(memoCellRef.current?.getBoundingClientRect() ?? null);
    setMemoEditing(true);
  };

  return (
    <>
      <tr
        className={`group transition-colors ${fill}`}
        draggable={Boolean(onReorder)}
        data-row-drag={onReorder ? true : undefined}
        onMouseDown={() => onSelect?.()}
        onDragStart={(e) => {
          if (!onReorder || isRowDragInteractive(e.target)) {
            e.preventDefault();
            return;
          }
          onSelect?.();
          setDragging(true);
          e.dataTransfer.setData('text/plain', data.id);
          e.dataTransfer.effectAllowed = 'move';
          hideDragGhost(e);
        }}
        onDragOver={(e) => {
          if (!onReorder) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragging) {
            setDropEdge(null);
            return;
          }
          setDropEdge(dropEdgeFromPointer(e.clientY, e.currentTarget.getBoundingClientRect()));
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropEdge(null);
        }}
        onDrop={(e) => {
          if (!onReorder) return;
          e.preventDefault();
          const place = dropEdgeFromPointer(e.clientY, e.currentTarget.getBoundingClientRect());
          setDropEdge(null);
          onReorder(e.dataTransfer.getData('text/plain'), data.id, place);
        }}
        onDragEnd={() => {
          setDragging(false);
          setDropEdge(null);
        }}
      >
        <td className={`${cellClass} w-4 min-w-4 max-w-4 px-0`} aria-hidden="true" />
        <td className={cellClass}>
          {isStudentView ? (
            <span
              className="font-mono text-[12px] tabular-nums text-neutral-500 whitespace-nowrap"
              title={data.studentNumber || ''}
            >
              {displayStudentNumber ? displayStudentNumber(data.studentNumber) : (data.studentNumber || '')}
            </span>
          ) : (
            <DatePickerCell value={data.date} onChange={(next) => onSave({ ...data, date: next })} muted />
          )}
        </td>

        <td className={cellClass}>
          <input
            type="text"
            value={inlineName}
            onChange={(e) => setInlineName(e.target.value)}
            onBlur={() => {
              if (inlineName !== data.name) onSave({ ...data, name: inlineName.trim() });
            }}
            onKeyDown={blurOnEnter}
            className={`${fieldClass} text-[14px] font-medium text-neutral-900`}
          />
        </td>

        <td
          ref={memoCellRef}
          className={`${cellClass} relative`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (memoEditing) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              openMemo();
            }
          }}
        >
          <button
            type="button"
            onClick={openMemo}
            title={inlineMemo}
            className="w-full h-7 text-left text-[12px] text-neutral-600 truncate outline-none"
          >
            {memoView && 'tags' in memoView
              ? (
                <span className="inline-flex items-center gap-1">
                  {memoView.tags.map((tag) => (
                    <span key={tag} className="max-w-[72px] truncate text-[11px] text-neutral-600">{tag}</span>
                  ))}
                </span>
              )
              : memoView && 'text' in memoView
                ? memoView.text
                : ''}
          </button>
          {memoEditing && createPortal(
            <textarea
              ref={memoAreaRef}
              value={inlineMemo}
              onChange={(e) => setInlineMemo(e.target.value)}
              onBlur={(e) => {
                const next = e.target.value.trim();
                setInlineMemo(next);
                if (next !== (data.memo || '')) onSave({ ...data, memo: next });
                setMemoEditing(false);
              }}
              style={{
                position: 'fixed',
                left: Math.max(8, memoRect?.left ?? 8),
                top: Math.max(8, memoRect?.top ?? 8),
                width: Math.max(memoRect?.width ?? 200, 320),
                zIndex: 80,
              }}
              className="min-h-[88px] px-2.5 py-2 text-[13px] text-neutral-800 bg-white border border-neutral-300 rounded-md shadow-lg outline-none resize-y leading-relaxed"
            />,
            document.body
          )}
        </td>

        <td className={cellClass}>
          <select
            value={data.school}
            onChange={(e) => onSave({ ...data, school: e.target.value })}
            className={`${selectClass} ${!data.school ? 'text-neutral-300' : ''}`}
          >
            {!data.school && <option value="">-</option>}
            {!schoolOptions.includes(data.school) && data.school && <option value={data.school}>{data.school}</option>}
            {schoolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </td>

        <td className={cellClass}>
          <select
            value={data.grade}
            onChange={(e) => onSave({ ...data, grade: e.target.value })}
            className={`${selectClass} ${data.grade ? '' : 'text-neutral-300'}`}
          >
            {!data.grade && <option value="">-</option>}
            {!gradeSelectOptions.includes(data.grade) && data.grade && <option value={data.grade}>{data.grade}</option>}
            {gradeSelectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </td>

        {isStudentView ? (
          <td className={cellClass}>
            <input
              type="text"
              value={inlinePhone}
              onChange={(e) => setInlinePhone(e.target.value)}
              onBlur={() => {
                if (inlinePhone !== (data.studentPhone || '')) onSave({ ...data, studentPhone: inlinePhone.trim() });
              }}
              onKeyDown={blurOnEnter}
              className={`${fieldClass} font-mono text-[13px] ${inlinePhone ? 'text-neutral-600' : 'text-neutral-300'}`}
            />
          </td>
        ) : (
          <td className={cellClass}>
            <select
              value={data.evalGrade || ''}
              onChange={(e) => onSave({ ...data, evalGrade: e.target.value })}
              className={`${selectClass} ${data.evalGrade ? 'text-neutral-600' : 'text-neutral-300'}`}
            >
              <option value="">-</option>
              {data.evalGrade && !gradeSelectOptions.includes(data.evalGrade) && (
                <option value={data.evalGrade}>{data.evalGrade}</option>
              )}
              {gradeSelectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </td>
        )}

        {isStudentView ? (
          <td className={cellClass}>
            <select
              value={data.className}
              onChange={(e) => onSave({ ...data, className: e.target.value })}
              className={`${selectClass} truncate ${!data.className || data.className === '-' ? 'text-neutral-300' : ''}`}
            >
              <option value="-">-</option>
              {!classOptions.includes(data.className) && data.className !== '-' && <option value={data.className}>{data.className}</option>}
              {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </td>
        ) : (
          <>
            <td className={cellClass}>
              <DatePickerCell value={data.testDate} onChange={(next) => onSave({ ...data, testDate: next })} muted />
            </td>
            <td className={cellClass}>
              <select
                value={data.className}
                onChange={(e) => onSave({ ...data, className: e.target.value })}
                className={`${selectClass} truncate ${!data.className || data.className === '-' ? 'text-neutral-300' : ''}`}
                title={data.className}
              >
                <option value="-">-</option>
                {!classOptions.includes(data.className) && data.className !== '-' && <option value={data.className}>{data.className}</option>}
                {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </td>
            <td className={cellClass}>
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(data.status)}`} />
                <select
                  value={data.status}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                  className="h-7 min-w-0 flex-1 text-[13px] font-normal text-neutral-600 bg-transparent border-0 outline-none appearance-none cursor-pointer"
                  title={data.status}
                >
                  {!selectableStatuses.includes(data.status) && <option value={data.status}>{data.status}</option>}
                  {selectableStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </td>
          </>
        )}

        <>
            <td className={`${cellClass} ${stickyAction} ${isProspectBoard ? 'right-[112px]' : 'right-10'} w-[220px] !border-0 z-[1]`}>
              <JournalButton
                ref={journalRef}
                summary={journalSummary}
                onClick={() => onOpenJournal?.(journalRef.current)}
              />
            </td>
            {isProspectBoard && (
              <td className={`${cellClass} ${stickyAction} right-10 w-[72px] !border-0 z-[1]`}>
                <button
                  type="button"
                  onClick={openConvert}
                  className="h-7 px-0 text-[12px] font-normal text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  등록
                </button>
              </td>
            )}
            <td className={`${cellClass} ${stickyAction} right-0 z-[1] w-10 !border-0`}>
              <button
                ref={moreBtnRef}
                type="button"
                onClick={() => {
                  setMenuRect(moreBtnRef.current?.getBoundingClientRect() ?? null);
                  setMenuOpen((open) => !open);
                }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                title="더보기"
                aria-label="더보기"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: 'fixed',
                    top: (menuRect?.bottom ?? 0) + 4,
                    right: Math.max(12, window.innerWidth - (menuRect?.right ?? 0)),
                    zIndex: 80,
                  }}
                  className="min-w-[120px] bg-white border border-neutral-200 rounded-md shadow-lg py-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDelete(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-neutral-50"
                  >
                    삭제
                  </button>
                </div>,
                document.body
              )}
            </td>
        </>
      </tr>

      {showConvert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-emerald-50 rounded-t-lg">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-emerald-900">원생으로 등록</h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{data.name || '이 학생'}</span> 님을 <span className="font-semibold text-emerald-700">원생</span>으로 등록하시겠습니까?
                <br />아래 학생 정보를 입력해 주세요.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학생번호</label>
                <input type="text" value={convertForm.studentNumber} onChange={e => setConvertForm({ ...convertForm, studentNumber: e.target.value })} placeholder="예: STU2026-0001" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학생 전화번호</label>
                <input type="text" value={convertForm.studentPhone} onChange={e => setConvertForm({ ...convertForm, studentPhone: e.target.value })} placeholder="예: 9398 7380" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학부모 번호</label>
                <input type="text" value={convertForm.parentPhone} onChange={e => setConvertForm({ ...convertForm, parentPhone: e.target.value })} placeholder="예: 8123 4567" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">이메일</label>
                <input type="email" value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })} placeholder="예: student@email.com" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button onClick={() => setShowConvert(false)} className="px-4 py-1.5 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">취소</button>
              <button onClick={confirmConvert} className="px-4 py-1.5 rounded text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">원생으로 등록</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-red-50 rounded-t-lg">
              <h2 className="text-base font-bold text-red-800">학생 삭제</h2>
            </div>
            <div className="p-4 text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">{data.name || '이 학생'}</span>을(를) 삭제하시겠습니까?
              <br />삭제하면 목록에서 사라지며, 되돌릴 수 없습니다.
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button onClick={() => setShowDelete(false)} className="px-4 py-1.5 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">취소</button>
              <button
                onClick={() => {
                  onDelete?.(data.id);
                  setShowDelete(false);
                }}
                className="px-4 py-1.5 rounded text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
