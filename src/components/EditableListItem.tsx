import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface EditableListItemProps {
  value: string;
  onRename: (oldValue: string, newValue: string) => void;
  onDelete: () => void;
  confirmDelete?: boolean;
}

export const EditableListItem: React.FC<EditableListItemProps> = ({
  value,
  onRename,
  onDelete,
  confirmDelete = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [askingDelete, setAskingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!askingDelete) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setAskingDelete(false);
    };
    window.addEventListener('keydown', onEsc, true);
    return () => window.removeEventListener('keydown', onEsc, true);
  }, [askingDelete]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== value && editValue.trim() !== '') {
      onRename(value, editValue.trim());
    } else {
      setEditValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (askingDelete) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 text-sm text-gray-800 shadow-sm">
        <span className="min-w-0 flex-1 leading-snug">‘{value}’ 상태를 삭제할까요?</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAskingDelete(false)}
            className="h-6 rounded px-2 text-[12px] text-gray-600 hover:bg-white"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-6 rounded bg-red-600 px-2 text-[12px] text-white hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex justify-between items-center bg-white border border-gray-100 rounded px-2 py-1.5 text-sm text-gray-700 shadow-sm">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 border-b border-blue-400 outline-none px-1 py-0.5 text-sm text-gray-900 bg-blue-50/50"
        />
      ) : (
        <span
          className="truncate flex-1 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
          onClick={() => setIsEditing(true)}
          title="클릭하여 수정"
        >
          {value}
        </span>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirmDelete) setAskingDelete(true);
          else onDelete();
        }}
        className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors ml-2"
        title="삭제"
      >
        <X className="w-4 h-4" />
      </button>
    </li>
  );
};
