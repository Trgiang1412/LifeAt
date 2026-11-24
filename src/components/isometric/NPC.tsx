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
import { FashionAvatar } from './FashionAvatar';
import KeyPromptBadge from './KeyPromptBadge';

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

      {/* 3. 3D Model NPC phong cách Thời Trang Cao Cấp (FashionAvatar) */}
      <group
        ref={avatarGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
      >
        <FashionAvatar
          outfitColor={badgeColor}
          hatColor="#f8fafc"
          avatarStyle="suit"
          hatStyle="beret"
          accessory="crossbody_bag"
          scale={1.32}
          isNpc={true}
        />
      </group>

      {/* 
        4. 3D Tooltip Html tối giản: Chỉ hiện đúng phím [E] khi người chơi đến gần, không hiện chữ rối mắt
      */}
      {isInRange && (
        <Html
          position={[_vTooltipPos.x, _vTooltipPos.y, _vTooltipPos.z]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <KeyPromptBadge keyLabel="E" color="#38bdf8" />
        </Html>
      )}
    </RigidBody>
  );
}

