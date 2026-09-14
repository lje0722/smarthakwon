import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Consultation } from '../types';
import { DatePickerCell } from './DatePickerCell';
import { RequestPanel } from '../requests/RequestPanel';
import { useRequests } from '../requests/RequestContext';

interface NotesModalProps {
  open: boolean;
  student: Consultation;
  onSave: (updated: Consultation) => void;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ open, student, onSave, onClose }) => {
  const { pending } = useRequests();
  const [modalNewNote, setModalNewNote] = useState('');
  const [modalNewMethod, setModalNewMethod] = useState('일반 전화');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteDeleteIndex, setNoteDeleteIndex] = useState<number | null>(null);
  const [inlineProfile, setInlineProfile] = useState(student.profile || '');
  const [requestDirty, setRequestDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const requestAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInlineProfile(student.profile || '');
  }, [student.profile, student.id]);

  useEffect(() => {
    if (!open) {
      setNoteDeleteIndex(null);
      setDiscardOpen(false);
      setModalNewNote('');
      setModalNewMethod('일반 전화');
      setNewDate(new Date().toISOString().split('T')[0]);
      setRequestDirty(false);
      return;
    }
    const timer = window.setTimeout(() => {
      requestAnchorRef.current?.scrollIntoView({ block: 'nearest' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, student.id]);

  const profileDirty = inlineProfile !== (student.profile || '');
  const noteDraftDirty = modalNewNote.trim().length > 0;
  const dirty = profileDirty || noteDraftDirty || requestDirty;

  const tryClose = () => {
    if (pending) return;
    if (noteDeleteIndex !== null) {
      setNoteDeleteIndex(null);
      return;
    }
    if (discardOpen) {
      setDiscardOpen(false);
      return;
    }
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const tryCloseRef = useRef(tryClose);
  tryCloseRef.current = tryClose;

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      tryCloseRef.current();
    };
    window.addEventListener('keydown', onEsc, true);
    return () => window.removeEventListener('keydown', onEsc, true);
  }, [open]);

  if (!open) return null;

  const handleAddNote = () => {
    if (!modalNewNote.trim()) return;
    onSave({
      ...student,
      notes: [...student.notes, { date: newDate, method: modalNewMethod, content: modalNewNote }],
    });
    setModalNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const confirmDeleteNote = () => {
    if (noteDeleteIndex === null) return;
    onSave({ ...student, notes: student.notes.filter((_, i) => i !== noteDeleteIndex) });
    setNoteDeleteIndex(null);
  };

  const saveProfileIfNeeded = () => {
    if (inlineProfile !== (student.profile || '')) onSave({ ...student, profile: inlineProfile });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 p-4">
            <h2 className="text-lg font-bold text-gray-900">{student.name} 학생 상담 이력</h2>
            <button
              type="button"
              onClick={tryClose}
              disabled={pending}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-gray-200 p-4">
              <label className="mb-1 block text-sm font-semibold text-gray-800">학생 특징 / 상담 요약</label>
              <textarea
                value={inlineProfile}
                onChange={(event) => setInlineProfile(event.target.value)}
                onBlur={saveProfileIfNeeded}
                className="min-h-[120px] w-full resize-y rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div ref={requestAnchorRef}>
              <RequestPanel studentId={student.id} onDirtyChange={setRequestDirty} />
            </div>

            <div className="border-b border-gray-200 bg-blue-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">새로운 상담 기록 추가</h3>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="w-[120px] rounded border border-gray-300 bg-white">
                    <DatePickerCell value={newDate} onChange={setNewDate} />
                  </div>
                  <select
                    value={modalNewMethod}
                    onChange={(event) => setModalNewMethod(event.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>일반 전화</option>
                    <option>카카오톡 보이스톡</option>
                    <option>카카오톡</option>
                    <option>왓츠앱</option>
                    <option>직접 방문</option>
                  </select>
                </div>
                <textarea
                  placeholder="상담 내용을 입력하세요..."
                  value={modalNewNote}
                  onChange={(event) => setModalNewNote(event.target.value)}
                  className="min-h-[80px] w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!modalNewNote.trim()}
                    className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    기록 추가
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {[...student.notes].map((note, originalIndex) => ({ note, originalIndex })).reverse().map(({ note, originalIndex }) => (
                  <div key={originalIndex} className="flex flex-col gap-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{note.date}</span>
                      <span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{note.method}</span>
                    </div>
                    <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3 pr-8 text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                      <button
                        type="button"
                        onClick={() => setNoteDeleteIndex(originalIndex)}
                        className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-gray-200/70 hover:text-gray-500"
                        title="상담 기록 삭제"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {note.content}
                    </div>
                  </div>
                ))}
                {student.notes.length === 0 && (
                  <div className="py-8 text-center text-gray-500">상담 이력이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
          {pending && (
            <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[12px] text-neutral-500">
              요청 저장 중...
            </div>
          )}
        </div>
      </div>

      {noteDeleteIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-sm flex-col rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-800">상담 기록 삭제</h2>
            </div>
            <div className="p-4 text-sm leading-relaxed text-gray-700">
              이 상담 기록을 삭제하시겠습니까?
            </div>
            <div className="flex justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 p-4">
              <button type="button" onClick={() => setNoteDeleteIndex(null)} className="rounded bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">취소</button>
              <button type="button" onClick={confirmDeleteNote} className="rounded bg-gray-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800">삭제</button>
            </div>
          </div>
        </div>
      )}

      {discardOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-sm flex-col rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-800">변경사항을 버리시겠습니까?</h2>
            </div>
            <div className="p-4 text-sm leading-relaxed text-gray-700">
              저장하지 않은 요청·상담 입력이 있습니다.
            </div>
            <div className="flex justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 p-4">
              <button
                type="button"
                onClick={() => setDiscardOpen(false)}
                className="rounded bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                계속 작성
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscardOpen(false);
                  onClose();
                }}
                className="rounded bg-gray-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                버리고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
