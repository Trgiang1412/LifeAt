'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

interface Position {
  x: number;
  y: number;
}

interface DraggableWidgetWrapperProps {
  id: string;
  defaultPosition: Position;
  zIndex: number;
  onBringToFront: (id: string) => void;
  visible?: boolean;
  children: React.ReactNode;
}

export default function DraggableWidgetWrapper({
  id,
  defaultPosition,
  zIndex,
  onBringToFront,
  visible = true,
  children,
}: DraggableWidgetWrapperProps) {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position);
  positionRef.current = position;
  const isDraggingRef = useRef(false);

  // Load saved position from localStorage once mounted
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeat_widget_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[id] && typeof parsed[id].x === 'number' && typeof parsed[id].y === 'number') {
          const clampedX = Math.max(10, Math.min(window.innerWidth - 180, parsed[id].x));
          const clampedY = Math.max(60, Math.min(window.innerHeight - 120, parsed[id].y));
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
    } catch {}

    // If no saved position, ensure defaultPosition is within viewport
    if (typeof window !== 'undefined') {
      const clampedX = Math.max(10, Math.min(window.innerWidth - 340, defaultPosition.x));
      const clampedY = Math.max(65, Math.min(window.innerHeight - 200, defaultPosition.y));
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [id, defaultPosition]);

  const savePosition = useCallback(
    (pos: Position) => {
      try {
        const saved = localStorage.getItem('lifeat_widget_positions');
        const parsed = saved ? JSON.parse(saved) : {};
        parsed[id] = pos;
        localStorage.setItem('lifeat_widget_positions', JSON.stringify(parsed));
      } catch {}
    },
    [id]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button (left click) or single touch
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Do NOT drag when interacting with buttons, inputs, sliders, chips, links, or icons
    if (
      target.closest(
        'button, input, textarea, a, select, [role="button"], [role="slider"], .MuiSlider-root, .MuiChip-root'
      )
    ) {
      onBringToFront(id);
      return;
    }

    onBringToFront(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = positionRef.current.x;
    const initialY = positionRef.current.y;

    isDraggingRef.current = true;
    setIsDragging(true);

    const currentTarget = e.currentTarget;
    try {
      currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    let currentPos = { x: initialX, y: initialY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Keep within viewport boundaries
      const maxX = Math.max(10, window.innerWidth - 120);
      const maxY = Math.max(10, window.innerHeight - 100);

      const newX = Math.min(maxX, Math.max(10, initialX + deltaX));
      const newY = Math.min(maxY, Math.max(65, initialY + deltaY));

      currentPos = { x: newX, y: newY };
      setPosition(currentPos);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);

      try {
        currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {}

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      savePosition(currentPos);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      sx={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: isDragging ? 'none' : 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
        display: visible ? 'block' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.25s ease',
        '& .MuiPaper-root': {
          boxShadow: isDragging
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 25px rgba(129, 140, 248, 0.45)'
            : undefined,
          border: isDragging
            ? '1px solid rgba(129, 140, 248, 0.7)'
            : undefined,
        },
        // The first Box inside Paper is the header across all widgets
        '& .MuiPaper-root > .MuiBox-root:first-of-type': {
          cursor: isDragging ? 'grabbing' : 'grab',
        },
      }}
    >
      {children}
    </Box>
  );
}

