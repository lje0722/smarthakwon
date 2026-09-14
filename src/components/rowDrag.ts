import type { DragEvent as ReactDragEvent } from 'react';
import { useEffect, useState } from 'react';

export type DropEdge = 'before' | 'after';

export const isRowDragInteractive = (target: EventTarget | null): boolean => {
  const el = target instanceof Element ? target : (target as Node | null)?.parentElement;
  return Boolean(el?.closest('input, select, textarea, [data-no-drag]'));
};

export const dropEdgeFromPointer = (clientY: number, rect: DOMRect): DropEdge =>
  clientY < rect.top + rect.height / 2 ? 'before' : 'after';

export const dropLineClass = (edge: DropEdge | null): string => {
  if (edge === 'before') return 'shadow-[inset_0_2px_0_0_#2563eb]';
  if (edge === 'after') return 'shadow-[inset_0_-2px_0_0_#2563eb]';
  return '';
};

export const hideDragGhost = (event: ReactDragEvent): void => {
  const ghost = document.createElement('div');
  ghost.style.position = 'absolute';
  ghost.style.top = '-9999px';
  ghost.style.width = '1px';
  ghost.style.height = '1px';
  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 0, 0);
  requestAnimationFrame(() => ghost.remove());
};

export const rowFillClass = (opts: {
  dragging: boolean;
  selected: boolean;
  searchHit?: boolean;
}): string => {
  if (opts.dragging) return 'bg-blue-100';
  if (opts.selected) return 'bg-blue-50';
  if (opts.searchHit) return 'bg-amber-50/70';
  return 'bg-white hover:bg-gray-50/80';
};

export const reorderIds = (
  ids: string[],
  fromId: string,
  toId: string,
  place: DropEdge
): string[] | null => {
  if (!fromId || !toId || fromId === toId) return null;
  const from = ids.indexOf(fromId);
  if (from < 0 || ids.indexOf(toId) < 0) return null;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  let insertAt = next.indexOf(toId);
  if (insertAt < 0) return null;
  if (place === 'after') insertAt += 1;
  next.splice(insertAt, 0, moved);
  return next;
};

export const reorderSubset = (
  full: string[],
  visible: string[],
  fromId: string,
  toId: string,
  place: DropEdge
): string[] | null => {
  const nextVisible = reorderIds(visible, fromId, toId, place);
  if (!nextVisible) return null;
  const visibleSet = new Set(visible);
  const fullSet = new Set(full);
  const merged = [...full];
  for (const id of visible) {
    if (!fullSet.has(id)) merged.push(id);
  }
  let i = 0;
  return merged.map((id) => (visibleSet.has(id) ? nextVisible[i++] : id));
};

export const applyIdOrder = <T extends { id: string }>(items: T[], order?: string[]): T[] => {
  if (!order || order.length === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const next: T[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    seen.add(id);
    next.push(item);
  }
  for (const item of items) {
    if (seen.has(item.id)) continue;
    next.push(item);
  }
  return next;
};

export const useRowDropEdge = () => {
  const [dropEdge, setDropEdge] = useState<DropEdge | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const clear = () => {
      setDropEdge(null);
      setDragging(false);
    };
    window.addEventListener('dragend', clear);
    return () => {
      window.removeEventListener('dragend', clear);
    };
  }, []);

  return { dropEdge, setDropEdge, dragging, setDragging };
};
