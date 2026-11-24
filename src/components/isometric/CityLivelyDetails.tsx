'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Bốt điện thoại Đỏ cổ điển London (Iconic Red Telephone Box)
 * Đặt tại các góc ngã tư Thành phố Tiếng Anh để tăng chất thực tế & không khí Anh Quốc
 */
function LondonPhoneBox({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Đế đá granit */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[1.05, 0.12, 1.05]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Thân bốt sơn đỏ bóng */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[0.88, 2.2, 0.88]} />
        <meshStandardMaterial color="#dc2626" roughness={0.28} metalness={0.15} />
      </mesh>
      {/* Ô cửa kính 4 mặt có đố trắng */}
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.9, 1.45, 0.7]} />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#fef08a"
          emissiveIntensity={0.22}
          transparent
          opacity={0.72}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.7, 1.45, 0.9]} />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#fef08a"
          emissiveIntensity={0.22}
          transparent
          opacity={0.72}
          roughness={0.1}
        />
      </mesh>
      {/* Mái vòm cong đặc trưng + vương miện vàng */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.24, 12]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.58, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Ghế băng gỗ công viên kèm tay vịn gang đúc (Park Bench)
 */
function ParkBench({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 2 Chân gang đúc */}
      {[-0.65, 0.65].map((x, idx) => (
        <mesh key={idx} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.52]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* Mặt ghế gỗ nan */}
      <mesh position={[0, 0.44, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.07, 0.5]} />
        <meshStandardMaterial color="#b45309" roughness={0.65} />
      </mesh>
      {/* Tựa lưng nghiêng */}
      <mesh position={[0, 0.74, -0.2]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.55, 0.42, 0.07]} />
        <meshStandardMaterial color="#92400e" roughness={0.65} />
      </mesh>
    </group>
  );
}

/**
 * Xe đẩy bán Kem / Cà phê đường phố có mái bạt kẻ sọc (Street Coffee & Ice Cream Cart)
 */
function StreetVendorCart({
  position,
  rotationY = 0,
  awningColor = '#ef4444',
}: {
  position: [number, number, number];
  rotationY?: number;
  awningColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Bánh xe đẩy */}
      {[-0.65, 0.65].map((x, idx) => (
        <mesh key={idx} position={[x, 0.22, 0.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      ))}
      {/* Thân xe gỗ trắng cổ điển */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.85, 0.85]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      {/* Mặt quầy gỗ */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[1.65, 0.07, 0.95]} />
        <meshStandardMaterial color="#b45309" roughness={0.45} />
      </mesh>
      {/* Máy pha / Bình nước thủy tinh trên quầy */}
      <mesh position={[-0.35, 1.28, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.34, 12]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.78} />
      </mesh>
      <mesh position={[0.35, 1.24, 0]}>
        <boxGeometry args={[0.32, 0.28, 0.28]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} />
      </mesh>
      {/* 2 Trụ chống mái bạt */}
      {[-0.72, 0.72].map((x, idx) => (
        <mesh key={`pole-${idx}`} position={[x, 1.65, -0.35]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      ))}
      {/* Mái bạt che nắng sọc rực rỡ */}
      <mesh position={[0, 2.22, 0.05]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.85, 0.12, 1.25]} />
        <meshStandardMaterial color={awningColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Thùng thư Đỏ Hoàng Gia & Trụ cứu hỏa đô thị
 */
function RoyalPostBox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.26, 1.1, 14]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.14, 0]}>
        <sphereGeometry args={[0.25, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.85, 0.24]}>
        <boxGeometry args={[0.24, 0.06, 0.04]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function FireHydrant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.56, 10]} />
        <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshStandardMaterial color="#dc2626" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.36, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Đàn vịt trắng bơi lội & hoa sen trên Hồ Câu Cá
 */
function LakeDucksAndLilies({ center }: { center: [number, number, number] }) {
  const duck1Ref = useRef<THREE.Group>(null);
  const duck2Ref = useRef<THREE.Group>(null);
  const duck3Ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (duck1Ref.current) {
      const a1 = t * 0.35;
      duck1Ref.current.position.set(Math.cos(a1) * 3.2, 0.12 + Math.sin(t * 3) * 0.02, Math.sin(a1) * 2.4);
      duck1Ref.current.rotation.y = -a1;
    }
    if (duck2Ref.current) {
      const a2 = t * 0.28 + 2.1;
      duck2Ref.current.position.set(Math.cos(a2) * 4.5, 0.12 + Math.cos(t * 3.2) * 0.02, Math.sin(a2) * 3.2);
      duck2Ref.current.rotation.y = -a2;
    }
    if (duck3Ref.current) {
      const a3 = -t * 0.3 + 4.0;
      duck3Ref.current.position.set(Math.cos(a3) * 2.4, 0.12 + Math.sin(t * 2.8) * 0.02, Math.sin(a3) * 1.9);
      duck3Ref.current.rotation.y = -a3 + Math.PI;
    }
  });

  const renderDuck = (ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref}>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.28, 0.15]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.26, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.12, 6]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );

  return (
    <group position={center}>
      {renderDuck(duck1Ref)}
      {renderDuck(duck2Ref)}
      {renderDuck(duck3Ref)}

      {/* Lá sen & hoa súng hồng nổi trên mặt nước */}
      {[
        [-4.2, -2.5],
        [-3.5, -2.9],
        [4.2, 2.2],
        [3.6, 2.8],
        [-2.8, 3.6],
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 0.09, z]}>
          <mesh rotation={[-Math.PI / 2, 0, idx * 1.1]}>
            <circleGeometry args={[0.42, 12]} />
            <meshStandardMaterial color="#16a34a" roughness={0.75} />
          </mesh>
          {idx % 2 === 0 && (
            <mesh position={[0, 0.06, 0]}>
              <dodecahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#f472b6" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * Đàn chim bồ câu bay lượn nhịp nhàng trên Quảng trường & Bầu trời
 */
function AnimatedSkyBirds() {
  const groupRef = useRef<THREE.Group>(null);
  const birdRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.16;
    }
    birdRefs.current.forEach((b, idx) => {
      if (!b) return;
      b.position.y = Math.sin(t * 2.5 + idx * 1.3) * 0.45;
      // Vỗ cánh nhẹ
      const leftWing = b.children[1];
      const rightWing = b.children[2];
      const flap = Math.sin(t * 11 + idx * 2) * 0.45;
      if (leftWing) leftWing.rotation.z = flap;
      if (rightWing) rightWing.rotation.z = -flap;
    });
  });

  const birdOffsets: [number, number, number][] = [
    [11, 8.5, 0],
    [12.5, 9.0, 2.2],
    [9.8, 8.2, -1.8],
    [-12, 9.5, 3.5],
    [-10.5, 8.8, 5.2],
  ];

  return (
    <group ref={groupRef}>
      {birdOffsets.map((pos, idx) => (
        <group
          key={idx}
          ref={(el) => {
            birdRefs.current[idx] = el;
          }}
          position={pos}
        >
          {/* Thân chim */}
          <mesh>
            <boxGeometry args={[0.12, 0.1, 0.34]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Cánh trái */}
          <mesh position={[-0.18, 0.02, 0]}>
            <boxGeometry args={[0.28, 0.03, 0.14]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          {/* Cánh phải */}
          <mesh position={[0.18, 0.02, 0]}>
            <boxGeometry args={[0.28, 0.03, 0.14]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Khinh khí cầu rực rỡ & Những đám mây trắng 3D trôi lững lờ trên bầu trời
 */
function SkyBalloonAndClouds() {
  const balloonRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (balloonRef.current) {
      const angle = t * 0.045;
      balloonRef.current.position.set(
        Math.cos(angle) * 44,
        26 + Math.sin(t * 0.8) * 1.1,
        Math.sin(angle) * 44
      );
      balloonRef.current.rotation.y = -angle;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.012;
    }
  });

  const cloudPositions: [number, number, number, number][] = [
    [-45, 40, -35, 1.4],
    [38, 43, -28, 1.6],
    [-32, 39, 42, 1.3],
    [45, 42, 36, 1.5],
    [0, 45, -55, 1.8],
  ];

  return (
    <group>
      {/* Khinh khí cầu du lịch */}
      <group ref={balloonRef} position={[44, 26, 0]}>
        {/* Quả cầu nhiều múi màu */}
        <mesh position={[0, 3.2, 0]}>
          <sphereGeometry args={[2.8, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[2.85, 2.85, 1.2, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[1.1, 0.5, 1.2, 12]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.6} />
        </mesh>
        {/* Ngọn lửa đốt nóng */}
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={1.6} />
        </mesh>
        {/* Giỏ mây chở khách */}
        <mesh position={[0, -1.2, 0]}>
          <boxGeometry args={[1.1, 0.9, 1.1]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
      </group>

      {/* Cụm mây 3D bồng bềnh */}
      <group ref={cloudsRef}>
        {cloudPositions.map(([x, y, z, s], idx) => (
          <group key={idx} position={[x, y, z]} scale={s}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[2.6, 10, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.95} />
            </mesh>
            <mesh position={[2.2, -0.4, 0.4]}>
              <sphereGeometry args={[2.0, 10, 10]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.95} />
            </mesh>
            <mesh position={[-2.1, -0.5, -0.3]}>
              <sphereGeometry args={[1.9, 10, 10]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Tổng hợp các chi tiết sống động cho toàn bản đồ Thành phố Tiếng Anh 3D
 */
export default function CityLivelyDetails() {
  return (
    <group>
      {/* 1. Bốt điện thoại Đỏ London tại 4 góc ngã tư chính */}
      <LondonPhoneBox position={[-16.2, 0, 16.2]} rotationY={Math.PI / 4} />
      <LondonPhoneBox position={[16.2, 0, 16.2]} rotationY={-Math.PI / 4} />
      <LondonPhoneBox position={[26.2, 0, 26.2]} rotationY={(-3 * Math.PI) / 4} />
      <LondonPhoneBox position={[-26.2, 0, 26.2]} rotationY={(3 * Math.PI) / 4} />

      {/* 2. Ghế công viên quanh Quảng trường & ven Hồ câu cá */}
      <ParkBench position={[8.6, 0, 8.6]} rotationY={(-3 * Math.PI) / 4} />
      <ParkBench position={[-8.6, 0, 8.6]} rotationY={(3 * Math.PI) / 4} />
      <ParkBench position={[8.6, 0, -8.6]} rotationY={-Math.PI / 4} />
      <ParkBench position={[-8.6, 0, -8.6]} rotationY={Math.PI / 4} />
      <ParkBench position={[-26.5, 0, -24.5]} rotationY={-Math.PI / 2} />
      <ParkBench position={[-26.5, 0, -33.5]} rotationY={-Math.PI / 2} />

      {/* 3. Xe đẩy bán Kem & Cà phê dạo rực rỡ tại Quảng trường */}
      <StreetVendorCart position={[-12.2, 0, 11.2]} rotationY={Math.PI / 3} awningColor="#ef4444" />
      <StreetVendorCart position={[12.2, 0, -11.2]} rotationY={(-2 * Math.PI) / 3} awningColor="#0ea5e9" />

      {/* 4. Thùng thư Đỏ & Trụ cứu hỏa */}
      <RoyalPostBox position={[16.4, 0, -16.4]} />
      <RoyalPostBox position={[-16.4, 0, -16.4]} />
      <FireHydrant position={[24.6, 0, 14.5]} />
      <FireHydrant position={[-24.6, 0, 14.5]} />
      <FireHydrant position={[24.6, 0, -14.5]} />
      <FireHydrant position={[-24.6, 0, -14.5]} />

      {/* 5. Đàn vịt bơi & hoa sen trên Hồ câu cá [-36, 0, -29] */}
      <LakeDucksAndLilies center={[-36, 0, -29]} />

      {/* 6. Đàn chim bay lượn quanh Quảng trường */}
      <AnimatedSkyBirds />

      {/* 7. Khinh khí cầu & Mây trắng 3D trên bầu trời */}
      <SkyBalloonAndClouds />
    </group>
  );
}
