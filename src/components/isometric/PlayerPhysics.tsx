'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import useMultiplayerStore from '@/stores/useMultiplayerStore';

// ============================================================================
// KHỞI TẠO BIẾN DÙNG CHUNG BÊN NGOÀI ĐỂ TRIỆT TIÊU GC SPIKE Ở 60-120 FPS
// ============================================================================
const _vInput = new THREE.Vector3();
const _vMove = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _targetCamPos = new THREE.Vector3();

// Góc xoay -45 độ quanh trục Y để căn chỉnh chuẩn xác WASD theo phương Isometric
const ISOMETRIC_ROTATION_ANGLE = -Math.PI / 4;

// Tốc độ di chuyển của người chơi (m/s)
const MOVE_SPEED = 6.0;

// Độ lệch camera chuẩn góc Isometric [20, 20, 20]
const CAMERA_OFFSET = new THREE.Vector3(20, 20, 20);

interface PlayerPhysicsProps {
  initialPosition?: [number, number, number];
}

export default function PlayerPhysics({ initialPosition = [0, 1.2, 0] }: PlayerPhysicsProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const currentRotationY = useRef<number>(0);

  // Đọc phím điều khiển từ KeyboardControls của @react-three/drei
  const [, getKeys] = useKeyboardControls();

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const { forward, backward, left, right } = getKeys();

    // 1. Đọc phím WASD / Phím mũi tên
    let inputZ = 0;
    let inputX = 0;

    if (forward) inputZ -= 1;
    if (backward) inputZ += 1;
    if (left) inputX -= 1;
    if (right) inputX += 1;

    // Gán vào vector tạm dùng chung
    _vInput.set(inputX, 0, inputZ);

    if (_vInput.lengthSq() > 0) {
      _vInput.normalize();

      // 2. Xoay vector di chuyển một góc 45 độ quanh trục Y để khớp phương hướng Isometric
      _vMove.copy(_vInput).applyAxisAngle(_upAxis, ISOMETRIC_ROTATION_ANGLE);

      const targetX = _vMove.x * MOVE_SPEED;
      const targetZ = _vMove.z * MOVE_SPEED;

      // 3. Giữ nguyên gia tốc rơi tự do currentVel.y
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        {
          x: targetX,
          y: currentVel.y,
          z: targetZ,
        },
        true
      );

      // 4. Nội suy góc quay mặt nhân vật mượt mà bằng MathUtils.lerp
      const targetAngle = Math.atan2(_vMove.x, _vMove.z);
      // Xử lý góc quay ngắn nhất tránh xoay vòng khi vượt ngưỡng -PI / PI
      let angleDiff = targetAngle - currentRotationY.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      currentRotationY.current += angleDiff * Math.min(1.0, delta * 15);

      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = currentRotationY.current;
      }
    } else {
      // Dừng di chuyển tức thời trên trục ngang nhưng giữ nguyên rơi tự do (không bị trơn trượt)
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        {
          x: 0,
          y: currentVel.y,
          z: 0,
        },
        true
      );
    }

    // 5. Smooth Camera Follow bám sát người chơi theo góc Isometric
    const playerPos = rigidBodyRef.current.translation();
    _targetCamPos.set(
      playerPos.x + CAMERA_OFFSET.x,
      playerPos.y + CAMERA_OFFSET.y,
      playerPos.z + CAMERA_OFFSET.z
    );

    // Smooth lerp vị trí camera
    state.camera.position.lerp(_targetCamPos, Math.min(1.0, delta * 5.0));
    state.camera.lookAt(playerPos.x, playerPos.y + 0.6, playerPos.z);

    // 6. Phát sóng tọa độ lên Multiplayer Server (Throttled 20Hz)
    useMultiplayerStore.getState().sendPosition(
      playerPos.x,
      playerPos.y,
      playerPos.z,
      currentRotationY.current
    );
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      lockRotations
      position={initialPosition}
      userData={{ type: 'player' }}
      friction={0} // Không bị kẹt khi cọ vào góc tường
      restitution={0} // Không nảy khi tiếp đất
    >
      {/* 
        CapsuleCollider args={[halfHeight, radius]} = [0.3, 0.35]
        Tổng chiều cao capsule: 2 * 0.3 + 2 * 0.35 = 1.3m (chuẩn dáng nhân vật 2.5D)
      */}
      <CapsuleCollider
        args={[0.3, 0.35]}
        position={[0, 0.65, 0]}
        friction={0}
        restitution={0}
      />

      {/* Visual Avatar Mesh của Player */}
      <group ref={meshGroupRef}>
        {/* Bóng đổ tròn dưới chân */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 16]} />
          <meshBasicMaterial color="#000000" opacity={0.35} transparent />
        </mesh>

        {/* Thân nhân vật */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.45, 8, 16]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Đầu nhân vật */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>

        {/* Kính bảo hộ / Mũ phong cách Techwear phát sáng nhẹ */}
        <mesh position={[0, 1.18, 0.16]}>
          <boxGeometry args={[0.32, 0.1, 0.12]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive={new THREE.Color('#38bdf8')}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* Balo phiêu lưu phía sau */}
        <mesh position={[0, 0.68, -0.22]} castShadow>
          <boxGeometry args={[0.32, 0.38, 0.18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>
    </RigidBody>
  );
}

