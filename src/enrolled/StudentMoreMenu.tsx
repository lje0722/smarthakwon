import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import type { StudentAction } from './types';

interface StudentMoreMenuProps {
  onAction: (action: StudentAction) => void;
}

const ITEMS: { action: StudentAction; label: string }[] = [
  { action: 'edit-profile', label: '학생정보 수정' },
  { action: 'move-class', label: '반 이동' },
  { action: 'leave-temporary', label: '휴원' },
  { action: 'withdraw', label: '퇴원' },
  { action: 'enrollment-history', label: '수강 이력' },
];

export const StudentMoreMenu: React.FC<StudentMoreMenuProps> = ({ onAction }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="더보기"
        onClick={() => {
          setRect(buttonRef.current?.getBoundingClientRect() ?? null);
          setOpen((value) => !value);
        }}
        className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && rect && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: Math.min(rect.bottom + 4, window.innerHeight - 220),
            left: Math.max(8, rect.right - 168),
            zIndex: 80,
          }}
          className="w-40 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-md"
        >
          {ITEMS.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(item.action);
              }}
              className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
