import React, { useState, useEffect } from 'react';
import { Consultation, ENROLLED_STATUS, getStatusStyle } from '../types';
import { Edit2, Save, X, GraduationCap } from 'lucide-react';

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
}

export const EditableRow: React.FC<EditableRowProps> = ({ data, onSave, statusOptions, classOptions, schoolOptions, gradeOptions, isStudentView = false, nextStudentNumber = '', displayStudentNumber }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Consultation>(data);
  const [newNote, setNewNote] = useState('');
  const [newMethod, setNewMethod] = useState('일반 전화');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNewNote, setModalNewNote] = useState('');
  const [modalNewMethod, setModalNewMethod] = useState('일반 전화');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // 원생 전환 팝업
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState({ studentNumber: '', studentPhone: '', parentPhone: '', email: '' });

  const [inlineName, setInlineName] = useState(data.name);
  useEffect(() => { setInlineName(data.name); }, [data.name]);

  const handleInlineNameBlur = () => {
    if (inlineName !== data.name && inlineName.trim() !== '') {
      onSave({ ...data, name: inlineName.trim() });
    } else {
      setInlineName(data.name);
    }
  };

  const [inlineMemo, setInlineMemo] = useState(data.memo || '');
  useEffect(() => { setInlineMemo(data.memo || ''); }, [data.memo]);
  const handleInlineMemoBlur = () => {
    if (inlineMemo !== (data.memo || '')) onSave({ ...data, memo: inlineMemo });
  };

  // 학생 전화번호 인라인 (원생 뷰)
  const [inlinePhone, setInlinePhone] = useState(data.studentPhone || '');
  useEffect(() => { setInlinePhone(data.studentPhone || ''); }, [data.studentPhone]);
  const handlePhoneBlur = () => {
    if (inlinePhone !== (data.studentPhone || '')) onSave({ ...data, studentPhone: inlinePhone.trim() });
  };

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus === ENROLLED_STATUS && data.status !== ENROLLED_STATUS) {
      setConvertForm({
        studentNumber: data.studentNumber || nextStudentNumber,
        studentPhone: data.studentPhone || '',
        parentPhone: data.parentPhone || '',
        email: data.email || '',
      });
      setShowConvert(true);
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

  const handleSave = () => {
    let finalNotes = [...editData.notes];
    if (newNote.trim()) {
      finalNotes.push({ date: new Date().toISOString().split('T')[0], method: newMethod, content: newNote.trim() });
    }
    onSave({ ...editData, notes: finalNotes });
    setIsEditing(false);
    setNewNote('');
  };

  const handleAddNoteFromModal = () => {
    const updatedNotes = [...data.notes, { date: newDate, method: modalNewMethod, content: modalNewNote }];
    onSave({ ...data, notes: updatedNotes });
    setModalNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
    setNewNote('');
  };

  const handleChange = (field: keyof Consultation, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const cellClass = "px-2 py-2 text-sm text-gray-700 border-b border-gray-100 align-top";
  const inputClass = "w-full border border-blue-400 rounded px-2 py-1 text-sm bg-blue-50/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";
  const selectInlineClass = "w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-0.5 text-sm outline-none transition-colors appearance-none cursor-pointer";
  const inlineTextClass = "w-full bg-transparent border border-transparent hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded px-1 py-0.5 text-sm outline-none transition-colors";

  const latestNote = data.notes.length > 0 ? data.notes[data.notes.length - 1] : null;

  return (
    <>
      <tr className="hover:bg-gray-50 group transition-colors">
        {/* 1열: 원생뷰=학생번호, 그 외=최초 문의 날짜 */}
        <td className={cellClass}>
          {isStudentView ? (
            <span
              className="font-mono text-[13px] font-semibold text-gray-800 whitespace-nowrap"
              title={data.studentNumber || ''}
            >
              {displayStudentNumber ? displayStudentNumber(data.studentNumber) : (data.studentNumber || '')}
            </span>
          ) : isEditing ? (
            <input type="date" value={editData.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
          ) : (
            <span className="whitespace-nowrap">{data.date}</span>
          )}
        </td>

        <td className={`${cellClass} font-medium`}>
          {isEditing ? (
            <input type="text" value={editData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} />
          ) : (
            <input
              type="text"
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              onBlur={handleInlineNameBlur}
              className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded px-1 py-0.5 text-sm outline-none transition-colors font-semibold text-gray-900 cursor-text"
              placeholder="이름 입력..."
            />
          )}
        </td>

        <td className={cellClass}>
          {isEditing ? (
            <input type="text" value={editData.memo || ''} onChange={(e) => handleChange('memo', e.target.value)} className={inputClass} placeholder="특이사항..." />
          ) : (
            <input
              type="text"
              value={inlineMemo}
              onChange={(e) => setInlineMemo(e.target.value)}
              onBlur={handleInlineMemoBlur}
              className={inlineTextClass}
              placeholder="클릭하여 입력..."
            />
          )}
        </td>

        <td className={cellClass}>
          {isEditing ? (
            <input type="text" value={editData.school} onChange={(e) => handleChange('school', e.target.value)} className={inputClass} />
          ) : (
            <select value={data.school} onChange={(e) => onSave({ ...data, school: e.target.value })} className={selectInlineClass}>
              {!schoolOptions.includes(data.school) && <option value={data.school}>{data.school}</option>}
              {schoolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
        </td>

        <td className={cellClass}>
          {isEditing ? (
            <input type="text" value={editData.grade} onChange={(e) => handleChange('grade', e.target.value)} className={inputClass} />
          ) : (
            <select value={data.grade} onChange={(e) => onSave({ ...data, grade: e.target.value })} className={selectInlineClass}>
              {!gradeOptions.includes(data.grade) && <option value={data.grade}>{data.grade}</option>}
              {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
        </td>

        {/* 6열: 원생뷰=학생 전화번호, 그 외=Status */}
        <td className={cellClass}>
          {isStudentView ? (
            <input
              type="text"
              value={inlinePhone}
              onChange={(e) => setInlinePhone(e.target.value)}
              onBlur={handlePhoneBlur}
              className={`${inlineTextClass} font-mono text-[13px]`}
              placeholder="전화번호..."
            />
          ) : isEditing ? (
            <select value={editData.status} onChange={(e) => handleChange('status', e.target.value)} className={`${inputClass} max-w-[180px]`}>
              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <select
              value={data.status}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className={`px-2 py-1 text-[11px] font-semibold rounded-full border cursor-pointer outline-none appearance-none pr-5 w-full text-center bg-no-repeat ${getStatusStyle(data.status).badge}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: `right 0.3rem center`,
                backgroundSize: `0.75rem 0.75rem`,
                textAlignLast: 'center',
              }}
              title={data.status}
            >
              {!statusOptions.includes(data.status) && <option value={data.status}>{data.status}</option>}
              {statusOptions.map(opt => <option key={opt} value={opt} className="bg-white text-gray-900">{opt}</option>)}
            </select>
          )}
        </td>

        <td className={cellClass}>
          {isEditing ? (
            <select value={editData.className} onChange={(e) => handleChange('className', e.target.value)} className={inputClass}>
              <option value="-">-</option>
              {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          ) : (
            <select value={data.className} onChange={(e) => onSave({ ...data, className: e.target.value })} className={selectInlineClass}>
              <option value="-">-</option>
              {!classOptions.includes(data.className) && data.className !== '-' && <option value={data.className}>{data.className}</option>}
              {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          )}
        </td>

        <td className={cellClass}>
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <select value={newMethod} onChange={e => setNewMethod(e.target.value)} className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500">
                  <option>일반 전화</option>
                  <option>카카오톡 보이스톡</option>
                  <option>카카오톡</option>
                  <option>왓츠앱</option>
                  <option>직접 방문</option>
                </select>
              </div>
              <textarea placeholder="새 상담내역 추가..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className={`${inputClass} min-h-[40px] resize-y`} rows={2} />
            </div>
          ) : (
            <div className="line-clamp-2 leading-tight text-gray-700 cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 transition-colors" title={latestNote?.content} onClick={() => setIsModalOpen(true)}>
              {latestNote ? (
                <>
                  <span className="font-semibold text-gray-500 mr-1 text-[10px]">[{latestNote.date} | {latestNote.method}]</span>
                  {latestNote.content}
                </>
              ) : (
                <span className="text-gray-400 italic">상담 내역 없음 (클릭하여 추가)</span>
              )}
            </div>
          )}
        </td>

        <td className={`${cellClass} text-right whitespace-nowrap w-[60px]`}>
          {isEditing ? (
            <div className="flex justify-end gap-1">
              <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="저장"><Save className="w-4 h-4" /></button>
              <button onClick={handleCancel} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="취소"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="수정">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </td>
      </tr>

      {/* 상담 이력 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-900">{data.name} 학생 상담 이력</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-gray-200 bg-blue-50/50">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">새로운 상담 기록 추가</h3>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white" />
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

      {/* 원생 전환 팝업 */}
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
    </>
  );
};
