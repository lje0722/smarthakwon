import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatRequestTime } from './format';
import { useRequests } from './RequestContext';
import { sortDoneRequests, sortOpenRequests } from './selectors';
import { PRIORITY_LABEL, type RequestPriority, type StudentRequest } from './types';

interface RequestPanelProps {
  studentId: string;
  onDirtyChange: (dirty: boolean) => void;
}

const priorityBtn = (active: boolean, tone: 'normal' | 'urgent') => {
  if (!active) return 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50';
  return tone === 'urgent'
    ? 'border-red-300 bg-red-50 text-red-700'
    : 'border-emerald-300 bg-emerald-50 text-emerald-800';
};

export const RequestPanel: React.FC<RequestPanelProps> = ({ studentId, onDirtyChange }) => {
  const {
    requestsFor,
    addRequest,
    updateContent,
    updatePriority,
    completeRequest,
    reopenRequest,
    pending,
    persistence,
    loadError,
  } = useRequests();
  const requests = requestsFor(studentId);
  const openRows = sortOpenRequests(requests);
  const doneRows = sortDoneRequests(requests);

  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('normal');
  const [error, setError] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [dirtyRowIds, setDirtyRowIds] = useState<Record<string, boolean>>({});
  const busyRef = useRef(false);

  const draftDirty = draft.trim().length > 0;
  const editDirty = Object.values(dirtyRowIds).some(Boolean);

  useEffect(() => {
    onDirtyChange(draftDirty || editDirty);
  }, [draftDirty, editDirty, onDirtyChange]);

  const setRowDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyRowIds((prev) => {
      if (Boolean(prev[id]) === dirty) return prev;
      if (!dirty) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: true };
    });
  }, []);

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '요청을 저장하지 못했습니다.');
      throw caught;
    } finally {
      busyRef.current = false;
    }
  };

  const handleAdd = () => {
    const content = draft.trim();
    if (!content || pending) return;
    void run(async () => {
      await addRequest(studentId, content, priority);
      setDraft('');
      setPriority('normal');
    }).catch(() => {});
  };

  return (
    <div className="border-b border-neutral-200 px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-neutral-800">처리할 요청</h3>
        <span className="text-[11px] text-neutral-400">
          {persistence === 'browser' ? '이 브라우저에 저장됩니다. 서버 미연결' : '서버에 저장됩니다'}
        </span>
      </div>
      {loadError && <p className="mb-2 text-[12px] text-red-600">{loadError}</p>}

      <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="전화·카카오톡으로 들어온 요청을 적어 주세요"
          className="min-h-[72px] w-full resize-y rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(['normal', 'urgent'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`h-7 rounded border px-2.5 text-[12px] ${priorityBtn(priority === value, value)}`}
              >
                {PRIORITY_LABEL[value]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || !draft.trim()}
            className="h-7 rounded bg-neutral-800 px-3 text-[12px] text-white hover:bg-neutral-900 disabled:opacity-50"
          >
            {pending ? '저장 중...' : '요청 추가'}
          </button>
        </div>
      </div>

      {error && <p className="mb-2 text-[12px] text-red-600">{error}</p>}

      <div className="space-y-2">
        {openRows.length === 0 && (
          <p className="py-2 text-center text-[13px] text-neutral-400">미완료 요청이 없습니다.</p>
        )}
        {openRows.map((row) => (
          <RequestRow
            key={row.id}
            row={row}
            pending={pending}
            onDirty={(dirty) => setRowDirty(row.id, dirty)}
            onCommitContent={(content) => {
              if (content === row.content) return Promise.resolve();
              return run(() => updateContent(row.id, content));
            }}
            onPriority={(next) => {
              if (next === row.priority) return Promise.resolve();
              return run(() => updatePriority(row.id, next));
            }}
            onComplete={() => run(() => completeRequest(row.id))}
          />
        ))}
      </div>

      {doneRows.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-2">
          <button
            type="button"
            onClick={() => setDoneOpen((open) => !open)}
            className="flex items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-800"
          >
            {doneOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            완료된 요청 {doneRows.length}
          </button>
          {doneOpen && (
            <div className="mt-2 space-y-2">
              {doneRows.map((row) => (
                <div key={row.id} className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                    <span className={row.priority === 'urgent' ? 'text-red-600' : 'text-emerald-700'}>
                      {PRIORITY_LABEL[row.priority]}
                    </span>
                    <span>완료</span>
                    {row.completedAt && <span>{formatRequestTime(row.completedAt)}</span>}
                    {row.completedBy && <span>{row.completedBy}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] text-neutral-600">{row.content}</p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void run(() => reopenRequest(row.id)).catch(() => {})}
                    className="mt-1.5 text-[12px] text-neutral-500 hover:text-neutral-800 disabled:opacity-50"
                  >
                    다시 열기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface RequestRowProps {
  row: StudentRequest;
  pending: boolean;
  onDirty: (dirty: boolean) => void;
  onCommitContent: (content: string) => Promise<void>;
  onPriority: (priority: RequestPriority) => Promise<void>;
  onComplete: () => Promise<void>;
}

const RequestRow: React.FC<RequestRowProps> = ({
  row,
  pending,
  onDirty,
  onCommitContent,
  onPriority,
  onComplete,
}) => {
  const [text, setText] = useState(row.content);
  const textRef = useRef(text);
  textRef.current = text;

  const onDirtyRef = useRef(onDirty);
  onDirtyRef.current = onDirty;

  useEffect(() => {
    setText(row.content);
  }, [row.content]);

  useEffect(() => {
    onDirtyRef.current(text !== row.content);
    return () => onDirtyRef.current(false);
  }, [text, row.content]);

  const commitText = async () => {
    const content = textRef.current.trim();
    if (!content) {
      setText(row.content);
      return;
    }
    if (content === row.content) return;
    await onCommitContent(content);
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
        <span className={row.priority === 'urgent' ? 'font-medium text-red-600' : 'font-medium text-emerald-700'}>
          {PRIORITY_LABEL[row.priority]}
        </span>
        <span>{formatRequestTime(row.createdAt)}</span>
        {row.createdBy && <span>{row.createdBy}</span>}
      </div>
      <textarea
        value={text}
        disabled={pending}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          void commitText().catch(() => {});
        }}
        className="min-h-[48px] w-full resize-y rounded border border-transparent bg-transparent p-1 -mx-1 text-[13px] leading-relaxed text-neutral-800 outline-none hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(['normal', 'urgent'] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              void (async () => {
                try {
                  await commitText();
                  await onPriority(value);
                } catch {
                  /* 오류는 요청 패널에 표시 */
                }
              })();
            }}
            className={`h-6 rounded border px-2 text-[11px] disabled:opacity-50 ${priorityBtn(row.priority === value, value)}`}
          >
            {PRIORITY_LABEL[value]}
          </button>
        ))}
        <button
          type="button"
          disabled={pending}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            void (async () => {
              try {
                await commitText();
                await onComplete();
              } catch {
                /* 오류는 요청 패널에 표시 */
              }
            })();
          }}
          className="ml-auto h-6 rounded px-2 text-[11px] text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
        >
          처리 완료
        </button>
      </div>
    </div>
  );
};
