'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RemotePlayerData } from '@/stores/useMultiplayerStore';

// ============================================================================
// KHỞI TẠO BIẾN DÙNG CHUNG BÊN NGOÀI ĐỂ TRIỆT TIÊU GC SPIKE Ở 60-120 FPS
// ============================================================================
const _vTargetPos = new THREE.Vector3();

interface RemotePlayerProps {
  player: RemotePlayerData;
}

export default function RemotePlayer({ player }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotationY = useRef<number>(player.rotationY || 0);

  // Cập nhật tọa độ đích đến từ mạng (50ms ~ 20Hz)
  useEffect(() => {
    targetRotationY.current = player.rotationY || 0;
  }, [player.rotationY]);

  // Kiểm tra thời gian tồn tại của bong bóng chat (tự động biến mất sau 5 giây)
  const isChatActive = Boolean(
    player.currentChat &&
    player.chatTime &&
    Date.now() - player.chatTime < 5000
  );

  // Nội suy mượt mà vị trí và góc quay tại 60-120 FPS của máy client
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 1. Nội suy vị trí bằng position.lerp
    _vTargetPos.set(player.x, player.y, player.z);
    groupRef.current.position.lerp(_vTargetPos, Math.min(1.0, delta * 14.0));

    // 2. Nội suy góc quay mặt mượt mà tránh giật khựng
    let diff = targetRotationY.current - groupRef.current.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1.0, delta * 15.0);
  });

  const accentColor = player.avatarColor || '#38bdf8';

  return (
    <group ref={groupRef} position={[player.x, player.y, player.z]}>
      {/* 
        1. Bong bóng chat 3D dạng thẻ <Html position={[0, 1.8, 0]} center>
        Tự động biến mất sau 5 giây
      */}
      {isChatActive && (
        <Html position={[0, 1.8, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Nội dung tin nhắn chat */}
            <div
              style={{
                maxWidth: '220px',
                padding: '8px 14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                border: `1.5px solid ${accentColor}`,
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px ${accentColor}40`,
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.4,
                textAlign: 'center',
                wordBreak: 'break-word',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <div style={{ fontSize: '10px', color: accentColor, fontWeight: 700, marginBottom: '2px' }}>
                {player.username}
              </div>
              "{player.currentChat}"
            </div>

            {/* Mũi nhọn bong bóng thoại */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${accentColor}`,
              }}
            />
          </div>
        </Html>
      )}

      {/* Tên người chơi nổi trên đầu */}
      {!isChatActive && (
        <Html position={[0, 1.55, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {player.username}
          </div>
        </Html>
      )}

      {/* 2. Visual Mesh 3D của Remote Player */}
      {/* Bóng đổ tròn dưới chân */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 16]} />
        <meshBasicMaterial color="#000000" opacity={0.35} transparent />
      </mesh>

      {/* Thân nhân vật */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.45, 8, 16]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Đầu nhân vật */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.6} />
      </mesh>

      {/* Kính bảo hộ / Mũ phát sáng nhẹ */}
      <mesh position={[0, 1.18, 0.16]}>
        <boxGeometry args={[0.32, 0.1, 0.12]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={new THREE.Color(accentColor)}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Balo phiêu lưu */}
      <mesh position={[0, 0.68, -0.22]} castShadow>
        <boxGeometry args={[0.32, 0.38, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
    </group>
  );
}

