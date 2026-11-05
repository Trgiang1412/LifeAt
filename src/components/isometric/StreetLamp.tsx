'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useDayNightCycle from '@/stores/useDayNightCycle';

interface StreetLampProps {
  position: [number, number, number];
  rotationY?: number;
}

export default function StreetLamp({ position, rotationY = 0 }: StreetLampProps) {
  const bulbRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const nightMix = useDayNightCycle.getState().nightMix;

    // Bóng đèn emissive tự tăng cường độ ban đêm
    if (bulbRef.current) {
      bulbRef.current.emissiveIntensity = nightMix * 3.5;
    }

    // Bật pointLight tỏa ánh sáng vàng ấm xuống mặt đường
    if (lightRef.current) {
      lightRef.current.intensity = nightMix * 4.5;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Đế đèn */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.3, 8]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.8} />
      </mesh>

      {/* Cột đèn kim loại */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 3.2, 8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.9} />
      </mesh>

      {/* Nhánh vươn ngang */}
      <mesh position={[0.3, 3.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.9} />
      </mesh>

      {/* Chao đèn trên */}
      <mesh position={[0.55, 3.5, 0]}>
        <coneGeometry args={[0.28, 0.25, 8]} />
        <meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Bóng đèn phát sáng HDR kích hoạt Bloom */}
      <mesh position={[0.55, 3.38, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          ref={bulbRef}
          color="#fff5e6"
          emissive={new THREE.Color('#ffaa33')}
          emissiveIntensity={0.0}
          toneMapped={false} // Cho phép Bloom nhận diện HDR
        />
      </mesh>

      {/* PointLight chiếu xuống lòng đường ban đêm */}
      <pointLight
        ref={lightRef}
        position={[0.55, 3.1, 0]}
        color="#ffaa33"
        intensity={0.0}
        distance={7.5}
        decay={2.0}
      />
    </group>
  );
}

