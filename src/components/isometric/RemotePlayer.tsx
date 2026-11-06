'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import { RemotePlayerData } from '@/stores/useMultiplayerStore';

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

    // 3. Hoạt ảnh bước chân khi di chuyển
    const isMoving = distSq > 0.002;
    if (isMoving) {
      walkCycleRef.current += delta * 14;
      const legSwing = Math.sin(walkCycleRef.current) * 0.45;
      const armSwing = Math.cos(walkCycleRef.current) * 0.45;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;

      if (player.currentEmote === 'dance') {
        const danceCycle = state.clock.elapsedTime * 6;
        if (meshGroupRef.current) {
          meshGroupRef.current.position.y = Math.abs(Math.sin(danceCycle)) * 0.2;
        }
        if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(danceCycle) * 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.sin(danceCycle) * 0.8;
      } else if (player.currentEmote === 'wave') {
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z =
            Math.PI - 0.4 + Math.sin(state.clock.elapsedTime * 10) * 0.3;
        }
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
        if (leftArmRef.current) leftArmRef.current.rotation.z *= 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.z *= 0.8;
        if (meshGroupRef.current) meshGroupRef.current.position.y = 0;
      }
    }
  });

  const accentColor = player.avatarColor || '#10b981';

  return (
    <group ref={groupRef} position={[player.x, Math.max(0, player.y), player.z]}>
      {/* 1. Bong bóng chat 3D hoặc Nhãn tên người chơi nổi trên đầu */}
      <Html position={[0, 1.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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

      {/* 2. Mô hình Nhân vật Chibi Play Together của Người chơi khác */}
      <group ref={meshGroupRef}>
        {/* Bóng đổ tròn dưới chân */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 16]} />
          <meshBasicMaterial color="#000000" opacity={0.3} transparent />
        </mesh>

        {/* Thân nhân vật */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.36, 8, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.3} />
        </mesh>

        {/* Đầu Chibi tròn */}
        <mesh position={[0, 1.14, 0]} castShadow>
          <sphereGeometry args={[0.36, 20, 20]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.5} />
        </mesh>

        {/* Mắt Anime */}
        <mesh position={[-0.12, 1.18, 0.32]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.12, 1.18, 0.32]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Mũ đội đầu */}
        <group position={[0, 1.34, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>
        </group>

        {/* Hai tay */}
        <mesh ref={leftArmRef} position={[-0.32, 0.58, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.28, 6, 12]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.5} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.32, 0.58, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.28, 6, 12]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.5} />
        </mesh>

        {/* Hai chân */}
        <group ref={leftLegRef} position={[-0.14, 0.26, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.09, 0.2, 6, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.16, 0.06]} castShadow>
            <boxGeometry args={[0.18, 0.12, 0.26]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.14, 0.26, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.09, 0.2, 6, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.16, 0.06]} castShadow>
            <boxGeometry args={[0.18, 0.12, 0.26]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>

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
