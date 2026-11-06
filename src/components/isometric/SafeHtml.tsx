'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface HtmlPortalEntry {
  id: string;
  children: React.ReactNode;
  center?: boolean;
  style?: React.CSSProperties;
  zIndex?: number;
}

const portalEntries = new Map<string, HtmlPortalEntry>();
const portalDomNodes = new Map<string, HTMLDivElement>();
const portalListeners = new Set<() => void>();

function notifyPortalListeners() {
  portalListeners.forEach((listener) => listener());
}

/**
 * Lớp phủ DOM (Overlay Host) đặt bên ngoài <Canvas>, dùng chung 1 React Root duy nhất
 * để hiển thị toàn bộ nhãn 3D, bong bóng hội thoại, bảng tên mà KHÔNG BAO GIỜ gọi
 * ReactDOM.createRoot() hay root.unmount(), triệt tiêu 100% lỗi:
 * "Attempted to synchronously unmount a root while React was already rendering" trên React 19 / Next.js 15.
 */
export function HtmlOverlayHost() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTick((t) => t + 1);
    };
    portalListeners.add(handleUpdate);
    return () => {
      portalListeners.delete(handleUpdate);
    };
  }, []);

  const entries = Array.from(portalEntries.values());

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 12,
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          ref={(node) => {
            if (node) {
              portalDomNodes.set(entry.id, node);
            } else {
              portalDomNodes.delete(entry.id);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'none',
            willChange: 'transform',
            zIndex: entry.zIndex ?? 10,
            ...entry.style,
          }}
        >
          {entry.children}
        </div>
      ))}
    </div>
  );
}

const _projVec = new THREE.Vector3();

export interface SafeHtmlProps {
  position?: [number, number, number];
  center?: boolean;
  zIndexRange?: [number, number];
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Component thay thế hoàn toàn <Html> của @react-three/drei bên trong <Canvas>.
 * Tự động chiếu tọa độ 3D sang 2D ở 60-120 FPS và render qua HtmlOverlayHost.
 */
export function Html({
  position = [0, 0, 0],
  center = false,
  zIndexRange,
  style,
  children,
}: SafeHtmlProps) {
  const rawId = useId();
  const idRef = useRef<string>(`html3d_${rawId.replace(/:/g, '_')}`);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const id = idRef.current;
    portalEntries.set(id, {
      id,
      children,
      center,
      style,
      zIndex: zIndexRange ? zIndexRange[0] : 10,
    });
    notifyPortalListeners();
  });

  useEffect(() => {
    const id = idRef.current;
    return () => {
      portalEntries.delete(id);
      portalDomNodes.delete(id);
      notifyPortalListeners();
    };
  }, []);

  useFrame(({ camera, size }) => {
    const el = portalDomNodes.get(idRef.current);
    const grp = groupRef.current;
    if (!el || !grp) return;

    grp.updateWorldMatrix(true, false);
    _projVec.setFromMatrixPosition(grp.matrixWorld);
    _projVec.project(camera);

    if (_projVec.z < -1 || _projVec.z > 1) {
      if (el.style.display !== 'none') {
        el.style.display = 'none';
      }
      return;
    }

    const x = (_projVec.x * 0.5 + 0.5) * size.width;
    const y = (-(_projVec.y * 0.5) + 0.5) * size.height;

    if (x < -250 || x > size.width + 250 || y < -150 || y > size.height + 150) {
      if (el.style.display !== 'none') {
        el.style.display = 'none';
      }
      return;
    }

    if (el.style.display !== 'block') {
      el.style.display = 'block';
    }
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)${
      center ? ' translate(-50%, -50%)' : ''
    }`;
  });

  return <group ref={groupRef} position={position} />;
}

export default Html;

