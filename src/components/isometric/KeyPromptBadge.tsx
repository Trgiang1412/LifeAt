'use client';

import React from 'react';
import { Html } from './SafeHtml';

export interface KeyPromptBadgeProps {
  keyLabel?: string;
  onClick?: (e?: React.MouseEvent) => void;
  color?: string;
  scale?: number;
  position?: [number, number, number];
}

/**
 * Phím bấm tương tác 3D tối giản (Keyboard Keycap Style)
 * Chỉ hiển thị phím (VD: [E] hoặc [F]) khi người chơi đến gần đối tượng, loại bỏ toàn bộ chữ rác mắt.
 */
export function KeyPromptBadge({
  keyLabel = 'E',
  onClick,
  color = '#38bdf8',
  scale = 1,
  position,
}: KeyPromptBadgeProps) {
  const badgeButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${Math.round(28 * scale)}px`,
        height: `${Math.round(28 * scale)}px`,
        borderRadius: '7px',
        backgroundColor: '#0f172a',
        border: `2px solid ${color}`,
        color: '#ffffff',
        fontWeight: 900,
        fontSize: `${Math.round(13 * scale)}px`,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        boxShadow: `0 4px 14px ${color}88, inset 0 -2px 0 rgba(0, 0, 0, 0.6)`,
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        padding: 0,
        transform: 'translateZ(0)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15) translateZ(0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateZ(0)';
      }}
    >
      {keyLabel}
    </button>
  );

  if (position) {
    return (
      <Html position={position} center zIndexRange={[15, 0]} style={{ pointerEvents: 'auto' }}>
        {badgeButton}
      </Html>
    );
  }

  return badgeButton;
}

export default KeyPromptBadge;
