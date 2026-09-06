import React, { useState, useEffect } from 'react';
import { Consultation, ENROLLED_STATUS, GRADE_OPTIONS, getStatusStyle } from '../types';
import { X, GraduationCap } from 'lucide-react';
import { DatePickerCell } from './DatePickerCell';

interface EditableRowProps {
  data: Consultation;
  onSave: (updatedData: Consultation) => void;
  statusOptions: string[];
  classOptions: string[];
  schoolOptions: string[];
  gradeOptions: string[];
  isStudentView?: boolean;
  nextStudentNumber?: string;
  displayStudentNumber?: (s?: string) => string;
  onDelete?: (id: string) => void;
}

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
};

export const EditableRow: React.FC<EditableRowProps> = ({
  data,
  onSave,
  statusOptions,
  classOptions,
  schoolOptions,
  gradeOptions,
  isStudentView = false,
  nextStudentNumber = '',
  displayStudentNumber,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNewNote, setModalNewNote] = useState('');
  const [modalNewMethod, setModalNewMethod] = useState('일반 전화');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const [showConvert, setShowConvert] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [convertForm, setConvertForm] = useState({ studentNumber: '', studentPhone: '', parentPhone: '', email: '' });

  const [inlineName, setInlineName] = useState(data.name);
  useEffect(() => { setInlineName(data.name); }, [data.name]);

  const [inlineMemo, setInlineMemo] = useState(data.memo || '');
  useEffect(() => { setInlineMemo(data.memo || ''); }, [data.memo]);

  const [inlinePhone, setInlinePhone] = useState(data.studentPhone || '');
  useEffect(() => { setInlinePhone(data.studentPhone || ''); }, [data.studentPhone]);

  const [inlineProfile, setInlineProfile] = useState(data.profile || '');
  useEffect(() => { setInlineProfile(data.profile || ''); }, [data.profile]);

  useEffect(() => {
    if (!isModalOpen && !showConvert && !showDelete) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setShowConvert(false);
        setShowDelete(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isModalOpen, showConvert, showDelete]);

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

  const handleAddNoteFromModal = () => {
    const updatedNotes = [...data.notes, { date: newDate, method: modalNewMethod, content: modalNewNote }];
    onSave({ ...data, notes: updatedNotes });
    setModalNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const cellClass = 'px-2 py-1.5 text-sm text-gray-700 border-b border-gray-100 align-middle text-center';
  const fieldClass = 'w-full h-8 px-1.5 text-sm text-center bg-transparent border border-transparent hover:border-gray-300 hover:bg-white focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded outline-none transition-colors cursor-text';
  const selectClass = 'w-full h-8 px-1.5 text-sm text-center bg-transparent border border-transparent hover:border-gray-300 hover:bg-white focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded outline-none transition-colors appearance-none cursor-pointer';

  return (
    <>
      <tr className="group hover:bg-gray-50/80 transition-colors">
        <td className={cellClass}>
          {isStudentView ? (
            <span
              className="font-mono text-[13px] font-semibold text-gray-800 whitespace-nowrap"
              title={data.studentNumber || ''}
            >
              {displayStudentNumber ? displayStudentNumber(data.studentNumber) : (data.studentNumber || '')}
            </span>
          ) : (
            <DatePickerCell value={data.date} onChange={(next) => onSave({ ...data, date: next })} />
          )}
        </td>

        <td className={`${cellClass} font-medium`}>
          <input
            type="text"
            value={inlineName}
            onChange={(e) => setInlineName(e.target.value)}
            onBlur={() => {
              if (inlineName !== data.name) onSave({ ...data, name: inlineName.trim() });
            }}
            onKeyDown={blurOnEnter}
            className={`${fieldClass} font-semibold text-gray-900`}
          />
        </td>

        <td className={cellClass}>
          <input
            type="text"
            value={inlineMemo}
            maxLength={18}
            onChange={(e) => setInlineMemo(e.target.value)}
            onBlur={() => {
              if (inlineMemo !== (data.memo || '')) onSave({ ...data, memo: inlineMemo.trim() });
            }}
            onKeyDown={blurOnEnter}
            title={inlineMemo}
            className="w-[132px] h-8 px-2 text-[13px] font-medium text-center text-gray-800 bg-stone-100 border border-stone-200 hover:border-stone-300 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded outline-none transition-colors mx-auto"
          />
        </td>

        <td className={cellClass}>
          <select
            value={data.school}
            onChange={(e) => onSave({ ...data, school: e.target.value })}
            className={selectClass}
            style={{ textAlignLast: 'center' }}
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
            className={`${selectClass} font-medium`}
            style={{ textAlignLast: 'center' }}
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
              className={`${fieldClass} font-mono text-[13px]`}
            />
          </td>
        ) : (
          <td className={cellClass}>
            <select
              value={data.evalGrade || ''}
              onChange={(e) => onSave({ ...data, evalGrade: e.target.value })}
              className={`${selectClass} font-medium`}
              style={{ textAlignLast: 'center' }}
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
              className={selectClass}
              style={{ textAlignLast: 'center' }}
            >
              <option value="-">-</option>
              {!classOptions.includes(data.className) && data.className !== '-' && <option value={data.className}>{data.className}</option>}
              {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </td>
        ) : (
          <>
            <td className={cellClass}>
              <DatePickerCell value={data.testDate} onChange={(next) => onSave({ ...data, testDate: next })} />
            </td>
            <td className={cellClass}>
              <select
                value={data.className}
                onChange={(e) => onSave({ ...data, className: e.target.value })}
                className={`${selectClass} truncate`}
                style={{ textAlignLast: 'center' }}
                title={data.className}
              >
                <option value="-">-</option>
                {!classOptions.includes(data.className) && data.className !== '-' && <option value={data.className}>{data.className}</option>}
                {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </td>
            <td className={cellClass}>
              <select
                value={data.status}
                onChange={(e) => handleStatusSelect(e.target.value)}
                className={`h-8 px-2 text-[11px] font-semibold rounded-full border cursor-pointer outline-none appearance-none w-full text-center ${getStatusStyle(data.status).badge}`}
                style={{ textAlignLast: 'center' }}
                title={data.status}
              >
                {!selectableStatuses.includes(data.status) && <option value={data.status}>{data.status}</option>}
                {selectableStatuses.map(opt => <option key={opt} value={opt} className="bg-white text-gray-900">{opt}</option>)}
              </select>
            </td>
          </>
        )}

        <td className={cellClass}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors whitespace-nowrap"
          >
            상담내역
          </button>
        </td>

        {!isStudentView && (
          <td className={`${cellClass} whitespace-nowrap`}>
            {data.status !== ENROLLED_STATUS ? (
              <button
                type="button"
                onClick={openConvert}
                className="inline-flex items-center justify-center gap-1 h-8 px-2.5 text-xs font-medium rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                원생 등록
              </button>
            ) : null}
          </td>
        )}
        <td className={`${cellClass} w-[40px]`}>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="학생 삭제"
          >
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-900">{data.name} 학생 상담 이력</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-1">학생 특징 / 상담 요약</label>
              <p className="text-xs text-gray-500 mb-2">최근 특이사항이나 이전 상담 결과를 적어 두면, 상담내역을 모두 읽지 않아도 됩니다.</p>
              <textarea
                value={inlineProfile}
                onChange={(e) => setInlineProfile(e.target.value)}
                onBlur={() => {
                  if (inlineProfile !== (data.profile || '')) onSave({ ...data, profile: inlineProfile });
                }}
                className="w-full min-h-[120px] border border-amber-200 bg-amber-50/60 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-white resize-y leading-relaxed"
              />
            </div>
            <div className="p-4 border-b border-gray-200 bg-blue-50/50">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">새로운 상담 기록 추가</h3>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="w-[120px] border border-gray-300 rounded bg-white">
                    <DatePickerCell value={newDate} onChange={setNewDate} />
                  </div>
                  <select value={modalNewMethod} onChange={e => setModalNewMethod(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500">
                    <option>일반 전화</option>
                    <option>카카오톡 보이스톡</option>
                    <option>카카오톡</option>
                    <option>왓츠앱</option>
                    <option>직접 방문</option>
                  </select>
                </div>
                <textarea placeholder="상담 내용을 입력하세요..." value={modalNewNote} onChange={(e) => setModalNewNote(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]" />
                <div className="flex justify-end">
                  <button onClick={handleAddNoteFromModal} disabled={!modalNewNote.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">기록 추가</button>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {[...data.notes].reverse().map((note, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800">{note.date}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100">{note.method}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</div>
                  </div>
                ))}
                {data.notes.length === 0 && <div className="text-center text-gray-500 py-8">상담 이력이 없습니다.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

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
