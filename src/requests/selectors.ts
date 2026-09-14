import type { Consultation } from '../types';
import { emptyOpenSummary, type OpenRequestSummary, type StudentRequest } from './types';

export const isOpenRequest = (request: StudentRequest): boolean => request.status === 'open';

export const sortOpenRequests = (requests: StudentRequest[]): StudentRequest[] =>
  [...requests.filter(isOpenRequest)].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

export const sortDoneRequests = (requests: StudentRequest[]): StudentRequest[] =>
  [...requests.filter((request) => request.status === 'done')].sort((a, b) =>
    (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt)
  );

export const summarizeOpenRequests = (requests: StudentRequest[]): OpenRequestSummary => {
  const summary = emptyOpenSummary();
  for (const request of requests) {
    if (!isOpenRequest(request)) continue;
    const created = Date.parse(request.createdAt) || 0;
    if (request.priority === 'urgent') {
      summary.urgent += 1;
      if (summary.oldestUrgentAt === null || created < summary.oldestUrgentAt) {
        summary.oldestUrgentAt = created;
      }
    } else {
      summary.normal += 1;
      if (summary.oldestNormalAt === null || created < summary.oldestNormalAt) {
        summary.oldestNormalAt = created;
      }
    }
  }
  return summary;
};

export const relevantOldestAt = (summary: OpenRequestSummary): number => {
  if (summary.urgent > 0) return summary.oldestUrgentAt ?? Number.MAX_SAFE_INTEGER;
  if (summary.normal > 0) return summary.oldestNormalAt ?? Number.MAX_SAFE_INTEGER;
  return Number.MAX_SAFE_INTEGER;
};

export const compareByOpenRequests = (
  left: OpenRequestSummary,
  right: OpenRequestSummary
): number => {
  const leftUrgent = left.urgent > 0 ? 1 : 0;
  const rightUrgent = right.urgent > 0 ? 1 : 0;
  if (leftUrgent !== rightUrgent) return rightUrgent - leftUrgent;
  return relevantOldestAt(left) - relevantOldestAt(right);
};

export const mergeOpenSummaries = (summaries: OpenRequestSummary[]): OpenRequestSummary => {
  const merged = emptyOpenSummary();
  for (const summary of summaries) {
    merged.urgent += summary.urgent;
    merged.normal += summary.normal;
    if (summary.oldestUrgentAt !== null && (merged.oldestUrgentAt === null || summary.oldestUrgentAt < merged.oldestUrgentAt)) {
      merged.oldestUrgentAt = summary.oldestUrgentAt;
    }
    if (summary.oldestNormalAt !== null && (merged.oldestNormalAt === null || summary.oldestNormalAt < merged.oldestNormalAt)) {
      merged.oldestNormalAt = summary.oldestNormalAt;
    }
  }
  return merged;
};

export const buildOpenSummaryMap = (requests: StudentRequest[]): Record<string, OpenRequestSummary> => {
  const byStudent: Record<string, StudentRequest[]> = {};
  for (const request of requests) {
    (byStudent[request.studentId] ??= []).push(request);
  }
  const next: Record<string, OpenRequestSummary> = {};
  for (const [studentId, list] of Object.entries(byStudent)) {
    next[studentId] = summarizeOpenRequests(list);
  }
  return next;
};

export const compareStudentsByOpenRequests = (
  a: Consultation,
  b: Consultation,
  summaryOf: (id: string) => OpenRequestSummary,
  fallback: (left: Consultation, right: Consultation) => number
): number => {
  const byRequest = compareByOpenRequests(summaryOf(a.id), summaryOf(b.id));
  return byRequest !== 0 ? byRequest : fallback(a, b);
};
