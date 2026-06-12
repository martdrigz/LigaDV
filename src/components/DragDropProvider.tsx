import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface DragContextType {
  startDrag: (e: React.PointerEvent, id: string) => void;
}

const DragContext = createContext<DragContextType | null>(null);

interface DropPayload {
  id: string;
  targetItemId: string | null;
  targetZone: string | null;
}

interface DragDropProviderProps {
  children: ReactNode;
  onDrop: (payload: DropPayload) => void;
}

export function DragDropProvider({ children, onDrop }: DragDropProviderProps) {
  const dragRef = useRef<{
    id: string;
    el: HTMLElement;
    sx: number;
    sy: number;
    active: boolean;
    ghost?: HTMLElement;
    ox: number; 
    oy: number;
    sourceZone: string | null;
  } | null>(null);

  const hoverRef = useRef<{
    zone: HTMLElement | null;
    item: HTMLElement | null;
  }>({ zone: null, item: null });

  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const cleanup = useCallback(() => {
    const d = dragRef.current;
    if (d?.ghost) {
      d.ghost.classList.add('drag-ghost-fade-out');
      const ghost = d.ghost;
      setTimeout(() => ghost.remove(), 250);
    }
    if (d?.el) {
      d.el.classList.remove('is-dragging');
    }
    
    const h = hoverRef.current;
    h.zone?.classList.remove('drop-active');
    h.item?.classList.remove('swap-target');
    hoverRef.current = { zone: null, item: null };

    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.classList.remove('dragging-active');
    dragRef.current = null;
  }, []);

  const startGhost = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;

    const r = d.el.getBoundingClientRect();
    d.ox = d.sx - r.left;
    d.oy = d.sy - r.top;

    const g = d.el.cloneNode(true) as HTMLElement;
    g.classList.add('drag-ghost');
    // Ensure styles are set for fixed positioning
    g.style.width = `${r.width}px`;
    g.style.height = `${r.height}px`;
    
    // Set initial position precisely to avoid jump
    const initialX = r.left;
    const initialY = r.top;
    g.style.transform = `translate3d(${initialX}px, ${initialY}px, 0) rotate(-1.5deg) scale(1.05)`;
    
    document.body.appendChild(g);
    d.ghost = g;
    d.el.classList.add('is-dragging');
    document.body.classList.add('dragging-active');
    d.active = true;
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;

    if (!d.active) {
      if (Math.hypot(dx, dy) < 6) return;
      startGhost();
    }

    if (d.ghost) {
      // Use translate3d for hardware acceleration
      d.ghost.style.transform = `translate3d(${e.clientX - d.ox}px, ${e.clientY - d.oy}px, 0) rotate(-1.5deg) scale(1.05)`;
    }

    const below = document.elementFromPoint(e.clientX, e.clientY);
    const zone = below?.closest('[data-droppable]') as HTMLElement | null;
    const item = below?.closest('[data-item-id]') as HTMLElement | null;
    const h = hoverRef.current;

    if (h.zone !== zone) {
      h.zone?.classList.remove('drop-active');
      zone?.classList.add('drop-active');
      h.zone = zone;
    }

    const tgt = (item && item.getAttribute('data-item-id') !== d.id) ? item : null;
    if (h.item !== tgt) {
      h.item?.classList.remove('swap-target');
      tgt?.classList.add('swap-target');
      h.item = tgt;
    }

    if (e.cancelable) e.preventDefault();
  }, [startGhost]);

  const onUp = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    if (d.active) {
      const below = document.elementFromPoint(e.clientX, e.clientY);
      const item = below?.closest('[data-item-id]:not(.drag-ghost)') as HTMLElement | null;
      const zone = below?.closest('[data-droppable]') as HTMLElement | null;

      const targetId = item?.getAttribute('data-item-id');
      // If we dropped on an item, we still want the zone it belongs to
      const targetZone = zone?.getAttribute('data-droppable');

      onDropRef.current({
        id: d.id,
        targetItemId: targetId && targetId !== d.id ? targetId : null,
        targetZone: targetZone ?? null,
      });
    }

    cleanup();
  }, [cleanup]);

  const startDrag = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    
    // Crucial for mobile: ensures move events continue to fire even if finger leaves element
    target.setPointerCapture(e.pointerId);

    dragRef.current = {
      id,
      el: target,
      sx: e.clientX,
      sy: e.clientY,
      active: false,
      ox: 0,
      oy: 0,
      sourceZone: target.closest('[data-droppable]')?.getAttribute('data-droppable') || null
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { once: true });
  }, [onMove, onUp]);

  return (
    <DragContext.Provider value={{ startDrag }}>
      {children}
    </DragContext.Provider>
  );
}

export const useDrag = () => {
  const context = useContext(DragContext);
  if (!context) throw new Error('useDrag must be used within a DragDropProvider');
  return context;
};
