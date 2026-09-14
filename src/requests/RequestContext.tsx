import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUserName } from './currentUser';
import { REQUEST_PERSISTENCE, requestRepository } from './repository';
import { buildOpenSummaryMap } from './selectors';
import { emptyOpenSummary, type OpenRequestSummary, type RequestPriority, type StudentRequest } from './types';

interface RequestContextValue {
  requests: StudentRequest[];
  ready: boolean;
  persistence: 'browser' | 'server';
  loadError: string | null;
  pending: boolean;
  addRequest: (studentId: string, content: string, priority: RequestPriority) => Promise<void>;
  updateContent: (id: string, content: string) => Promise<void>;
  updatePriority: (id: string, priority: RequestPriority) => Promise<void>;
  completeRequest: (id: string) => Promise<void>;
  reopenRequest: (id: string) => Promise<void>;
  requestsFor: (studentId: string) => StudentRequest[];
  openSummary: (studentId: string) => OpenRequestSummary;
  openSummaryMap: Record<string, OpenRequestSummary>;
}

const RequestContext = createContext<RequestContextValue | null>(null);

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const requestsRef = useRef(requests);
  const pendingRef = useRef(false);
  requestsRef.current = requests;

  useEffect(() => {
    let cancelled = false;
    requestRepository.load()
      .then((rows) => {
        if (!cancelled) {
          setRequests(rows);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '요청을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: StudentRequest[]) => {
    if (pendingRef.current) throw new Error('요청을 저장하는 중입니다.');
    pendingRef.current = true;
    setPending(true);
    try {
      await requestRepository.saveAll(next);
      setRequests(next);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);

  const addRequest = useCallback(async (studentId: string, content: string, priority: RequestPriority) => {
    const now = new Date().toISOString();
    const row: StudentRequest = {
      id: newId(),
      studentId,
      content,
      priority,
      status: 'open',
      createdAt: now,
      createdBy: getCurrentUserName(),
      completedAt: null,
      completedBy: null,
    };
    await persist([...requestsRef.current, row]);
  }, [persist]);

  const patchRequest = useCallback(async (id: string, patch: Partial<StudentRequest>) => {
    const next = requestsRef.current.map((row) => (row.id === id ? { ...row, ...patch } : row));
    await persist(next);
  }, [persist]);

  const updateContent = useCallback(async (id: string, content: string) => {
    await patchRequest(id, { content });
  }, [patchRequest]);

  const updatePriority = useCallback(async (id: string, priority: RequestPriority) => {
    await patchRequest(id, { priority });
  }, [patchRequest]);

  const completeRequest = useCallback(async (id: string) => {
    await patchRequest(id, {
      status: 'done',
      completedAt: new Date().toISOString(),
      completedBy: getCurrentUserName(),
    });
  }, [patchRequest]);

  const reopenRequest = useCallback(async (id: string) => {
    await patchRequest(id, {
      status: 'open',
      completedAt: null,
      completedBy: null,
    });
  }, [patchRequest]);

  const byStudent = useMemo(() => {
    const map: Record<string, StudentRequest[]> = {};
    for (const request of requests) {
      (map[request.studentId] ??= []).push(request);
    }
    return map;
  }, [requests]);

  const openSummaryMap = useMemo(() => buildOpenSummaryMap(requests), [requests]);

  const value = useMemo<RequestContextValue>(() => ({
    requests,
    ready,
    persistence: REQUEST_PERSISTENCE,
    loadError,
    pending,
    addRequest,
    updateContent,
    updatePriority,
    completeRequest,
    reopenRequest,
    requestsFor: (studentId) => byStudent[studentId] ?? [],
    openSummary: (studentId) => openSummaryMap[studentId] ?? emptyOpenSummary(),
    openSummaryMap,
  }), [
    requests, ready, loadError, pending, addRequest, updateContent, updatePriority,
    completeRequest, reopenRequest, byStudent, openSummaryMap,
  ]);

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
};

export const useRequests = (): RequestContextValue => {
  const value = useContext(RequestContext);
  if (!value) throw new Error('useRequests must be used within RequestProvider');
  return value;
};
