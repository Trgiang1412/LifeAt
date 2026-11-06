'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import {
  RigidBody,
  CapsuleCollider,
  BallCollider,
} from '@react-three/rapier';
import {
  getLocalPlayerPosition,
  getNearbyStreetNpcId,
  setNearbyStreetNpcId,
} from '@/stores/useMultiplayerStore';

// ============================================================================
// KHỞI TẠO BIẾN DÙNG CHUNG BÊN NGOÀI ĐỂ TRIỆT TIÊU GC SPIKE Ở 60-120 FPS
// ============================================================================
const _vTooltipPos = new THREE.Vector3(0, 2.3, 0);

interface NPCProps {
  id?: string;
  name: string;
  role: string;
  position: [number, number, number];
  rotationY?: number;
  badgeColor?: string;
  onInteract: () => void;
}

export default function NPC({
  id,
  name,
  role,
  position,
  rotationY = 0,
  badgeColor = '#38bdf8',
  onInteract,
}: NPCProps) {
  const npcKey = id || name;
  const [isInRange, setIsInRange] = useState(false);
  const isInRangeRef = useRef(false);
  const avatarGroupRef = useRef<THREE.Group>(null);

  // Lắng nghe phím 'E' để mở hội thoại khi người chơi ở trong bán kính NPC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((event.code === 'KeyE' || event.key === 'e' || event.key === 'E') && isInRangeRef.current) {
        const activeNpcId = getNearbyStreetNpcId();
        if (!activeNpcId || activeNpcId === npcKey) {
          event.preventDefault();
          event.stopPropagation();
          onInteract();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (getNearbyStreetNpcId() === npcKey) {
        setNearbyStreetNpcId(null);
      }
    };
  }, [npcKey, onInteract]);

  // Kiểm tra khoảng cách thực tế tới người chơi mỗi frame + hiệu ứng thở nhẹ (idle breathing)
  useFrame((state) => {
    if (avatarGroupRef.current) {
      avatarGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
    }
    const playerPos = getLocalPlayerPosition();
    const dist = Math.hypot(playerPos.x - position[0], playerPos.z - position[2]);
    const nearNow = dist <= 3.6;

    if (nearNow !== isInRangeRef.current) {
      isInRangeRef.current = nearNow;
      setIsInRange(nearNow);
      if (nearNow) {
        setNearbyStreetNpcId(npcKey);
      } else if (getNearbyStreetNpcId() === npcKey) {
        setNearbyStreetNpcId(null);
      }
    } else if (nearNow && !getNearbyStreetNpcId()) {
      setNearbyStreetNpcId(npcKey);
    }
  });

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[0, rotationY, 0]}
    >
      {/* 
        1. Thân vật lý tĩnh cản đường (CapsuleCollider) 
        Ngăn người chơi đi xuyên qua người NPC
      */}
      <CapsuleCollider
        args={[0.4, 0.35]}
        position={[0, 0.75, 0]}
        friction={0}
      />

      {/* 
        2. Vùng cảm ứng kích hoạt tương tác NPC (BallCollider bán kính 2.5m có gắn cờ sensor)
      */}
      <BallCollider
        args={[2.5]}
        sensor
        position={[0, 0.75, 0]}
        onIntersectionEnter={(payload) => {
          const type = (payload.other.rigidBodyObject?.userData as { type?: string })?.type;
          if (type === 'player') {
            setIsInRange(true);
          }
        }}
        onIntersectionExit={(payload) => {
          const type = (payload.other.rigidBodyObject?.userData as { type?: string })?.type;
          if (type === 'player') {
            setIsInRange(false);
          }
        }}
      />

      {/* 3. 3D Model NPC (Stylized Barista / Emma) */}
      <group
        ref={avatarGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
      >
        {/* Bóng đổ tròn dưới chân */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshBasicMaterial color="#000000" opacity={0.35} transparent />
        </mesh>

        {/* Thân NPC (Váy / Tạp dề Barista) */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.34, 0.75, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Tạp dề màu nâu ấm */}
        <mesh position={[0, 0.54, 0.08]} castShadow>
          <boxGeometry args={[0.28, 0.5, 0.2]} />
          <meshStandardMaterial color="#92400e" roughness={0.6} />
        </mesh>

        {/* Đầu & Mặt NPC */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.23, 16, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.5} />
        </mesh>

        {/* Tóc phong cách bồng bềnh */}
        <mesh position={[0, 1.25, -0.04]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.8} />
        </mesh>

        {/* Cốc cafe trên tay */}
        <mesh position={[0.24, 0.72, 0.22]} castShadow>
          <cylinderGeometry args={[0.06, 0.045, 0.12, 12]} />
          <meshStandardMaterial color="#fafaf9" roughness={0.3} />
        </mesh>
      </group>

      {/* 
        4. 3D Tooltip Html: Hiển thị tên NPC & hướng dẫn tương tác [E]
      */}
      <Html
        position={[_vTooltipPos.x, _vTooltipPos.y, _vTooltipPos.z]}
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        {isInRange ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              animation: 'bounceIn 0.25s ease-out',
            }}
          >
            {/* Hộp thoại thông tin NPC */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Phím bấm [E] nổi bật */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(56, 189, 248, 0.4)',
                }}
              >
                E
              </span>

              {/* Text hướng dẫn */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  Nhấn [E] trò chuyện cùng {name}
                </span>
                <span style={{ fontSize: '10px', color: badgeColor, fontWeight: 600 }}>
                  {role}
                </span>
              </div>
            </div>

            {/* Mũi tên trỏ xuống đầu NPC */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(56, 189, 248, 0.9)',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              padding: '3px 10px',
              borderRadius: '14px',
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              border: `1.5px solid ${badgeColor}`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            }}
          >
            💬 {name}
          </div>
        )}
      </Html>
    </RigidBody>
  );
}

