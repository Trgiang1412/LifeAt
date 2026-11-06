'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import { RemotePlayerData } from '@/stores/useMultiplayerStore';
import { FashionAvatar, type FashionAvatarRef } from './FashionAvatar';

const _vTargetPos = new THREE.Vector3();

interface RemotePlayerProps {
  player: RemotePlayerData;
}

/**
 * Nhân vật Người Chơi Khác (Remote Player) phong cách Chibi Play Together
 * Đồng bộ thời gian thực: Chuyển động bước chân, Ván trượt, Câu cá, Emote và Bong bóng Chat 3D
 */
export default function RemotePlayer({ player }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const avatarRef = useRef<FashionAvatarRef>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const targetRotationY = useRef<number>(player.rotationY || 0);
  const walkCycleRef = useRef<number>(0);

  useEffect(() => {
    targetRotationY.current = player.rotationY || 0;
  }, [player.rotationY]);

  const isChatActive = Boolean(
    player.currentChat &&
      player.chatTime &&
      Date.now() - player.chatTime < 6000
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. Nội suy vị trí mượt mà
    _vTargetPos.set(player.x, Math.max(0, player.y), player.z);
    const distSq = groupRef.current.position.distanceToSquared(_vTargetPos);
    groupRef.current.position.lerp(_vTargetPos, Math.min(1.0, delta * 12.0));

    // 2. Nội suy góc xoay mặt
    if (meshGroupRef.current) {
      let diff = targetRotationY.current - meshGroupRef.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      meshGroupRef.current.rotation.y += diff * Math.min(1.0, delta * 14.0);
    }

    const leftLeg = avatarRef.current?.leftLeg || leftLegRef.current;
    const rightLeg = avatarRef.current?.rightLeg || rightLegRef.current;
    const leftArm = avatarRef.current?.leftArm || leftArmRef.current;
    const rightArm = avatarRef.current?.rightArm || rightArmRef.current;

    // 3. Hoạt ảnh bước chân khi di chuyển
    const isMoving = distSq > 0.002;
    if (isMoving) {
      walkCycleRef.current += delta * 13;
      const legSwing = Math.sin(walkCycleRef.current) * 0.52;
      const armSwing = Math.cos(walkCycleRef.current) * 0.45;
      if (leftLeg) leftLeg.rotation.x = legSwing;
      if (rightLeg) rightLeg.rotation.x = -legSwing;
      if (leftArm) leftArm.rotation.x = -armSwing;
      if (rightArm) rightArm.rotation.x = armSwing;
    } else {
      if (leftLeg) leftLeg.rotation.x *= 0.8;
      if (rightLeg) rightLeg.rotation.x *= 0.8;

      if (player.currentEmote === 'dance') {
        const danceCycle = state.clock.elapsedTime * 6;
        if (meshGroupRef.current) {
          meshGroupRef.current.position.y = Math.abs(Math.sin(danceCycle)) * 0.2;
        }
        if (leftArm) leftArm.rotation.z = Math.sin(danceCycle) * 0.8;
        if (rightArm) rightArm.rotation.z = -Math.sin(danceCycle) * 0.8;
      } else if (player.currentEmote === 'wave') {
        if (rightArm) {
          rightArm.rotation.x = -2.2 + Math.sin(state.clock.elapsedTime * 9) * 0.4;
          rightArm.rotation.z = 0.3;
        }
      } else {
        if (leftArm) leftArm.rotation.x *= 0.8;
        if (rightArm) rightArm.rotation.x *= 0.8;
        if (leftArm) leftArm.rotation.z *= 0.8;
        if (rightArm) rightArm.rotation.z *= 0.8;
        if (meshGroupRef.current) meshGroupRef.current.position.y = 0;
      }
    }
  });

  const accentColor = player.avatarColor || '#10b981';

  return (
    <group ref={groupRef} position={[player.x, Math.max(0, player.y), player.z]}>
      {/* 1. Bong bóng chat 3D hoặc Nhãn tên người chơi nổi trên đầu */}
      <Html position={[0, 2.25, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isChatActive && (
            <div
              style={{
                maxWidth: '220px',
                padding: '6px 12px',
                borderRadius: '14px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: `1.5px solid ${accentColor}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              💬 &ldquo;{player.currentChat}&rdquo;
            </div>
          )}

          {player.currentEmote === 'heart' && (
            <div style={{ fontSize: '20px' }}>❤️</div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: `1.5px solid ${accentColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'inline-block',
              }}
            />
            <span>{player.username}</span>
          </div>
        </div>
      </Html>

      {/* 2. Mô hình Fashion Avatar 3D của Người chơi khác */}
      <group ref={meshGroupRef}>
        <FashionAvatar
          ref={avatarRef}
          outfitColor={accentColor}
          hatColor="#f59e0b"
          scale={1.35}
        />

        {/* Ván trượt Skateboard nếu người chơi đó đang lướt ván */}
        {player.isSkateboarding && (
          <group position={[0, 0.06, 0]}>
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.48, 0.05, 1.15]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
