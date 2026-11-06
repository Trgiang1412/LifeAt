'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import useDayNightCycle from '@/stores/useDayNightCycle';

export type VehicleType = 'sedan' | 'taxi' | 'bus' | 'police' | 'icecream' | 'truck';

interface VehicleRoute {
  id: string;
  type: VehicleType;
  color: string;
  speed: number;
  waypoints: [number, number][];
  initialProgress?: number;
  label?: string;
}

/**
 * Một chiếc xe 3D tự hành di chuyển mượt mà theo danh sách các điểm Waypoints trên đường phố
 */
function AutonomousVehicle({ route }: { route: VehicleRoute }) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFLRef = useRef<THREE.Mesh>(null);
  const wheelFRRef = useRef<THREE.Mesh>(null);
  const wheelBLRef = useRef<THREE.Mesh>(null);
  const wheelBRRef = useRef<THREE.Mesh>(null);
  const sirenRedRef = useRef<THREE.MeshStandardMaterial>(null);
  const sirenBlueRef = useRef<THREE.MeshStandardMaterial>(null);

  // Tính toán độ dài từng đoạn đường để di chuyển đều theo vận tốc m/s
  const segments = useMemo(() => {
    const pts = route.waypoints;
    const segs: {
      start: [number, number];
      end: [number, number];
      length: number;
      angle: number;
    }[] = [];
    let totalLength = 0;

    for (let i = 0; i < pts.length; i++) {
      const start = pts[i];
      const end = pts[(i + 1) % pts.length];
      const dx = end[0] - start[0];
      const dz = end[1] - start[1];
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      segs.push({ start, end, length: len, angle });
      totalLength += len;
    }
    return { segs, totalLength };
  }, [route.waypoints]);

  const distanceTraveledRef = useRef<number>(
    (route.initialProgress || 0) * segments.totalLength
  );
  const currentAngleRef = useRef<number>(segments.segs[0]?.angle || 0);

  useFrame((state, delta) => {
    if (!groupRef.current || segments.totalLength === 0) return;

    // 1. Cập nhật quãng đường đã đi
    distanceTraveledRef.current =
      (distanceTraveledRef.current + route.speed * delta) % segments.totalLength;

    // 2. Tìm đoạn đường hiện tại
    let rem = distanceTraveledRef.current;
    let activeSeg = segments.segs[0];
    for (let i = 0; i < segments.segs.length; i++) {
      if (rem <= segments.segs[i].length) {
        activeSeg = segments.segs[i];
        break;
      }
      rem -= segments.segs[i].length;
    }

    const t = activeSeg.length > 0 ? rem / activeSeg.length : 0;
    const posX = activeSeg.start[0] + (activeSeg.end[0] - activeSeg.start[0]) * t;
    const posZ = activeSeg.start[1] + (activeSeg.end[1] - activeSeg.start[1]) * t;

    // Độ rung nhẹ của động cơ xe
    const engineBounce = Math.sin(state.clock.elapsedTime * 18) * 0.015;
    groupRef.current.position.set(posX, engineBounce, posZ);

    // 3. Nội suy góc xoay xe mượt mà khi vào cua
    let angleDiff = activeSeg.angle - currentAngleRef.current;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentAngleRef.current += angleDiff * Math.min(1.0, delta * 10);
    groupRef.current.rotation.y = currentAngleRef.current;

    // 4. Xoay 4 bánh xe
    const wheelSpin = delta * route.speed * 2.5;
    if (wheelFLRef.current) wheelFLRef.current.rotation.x += wheelSpin;
    if (wheelFRRef.current) wheelFRRef.current.rotation.x += wheelSpin;
    if (wheelBLRef.current) wheelBLRef.current.rotation.x += wheelSpin;
    if (wheelBRRef.current) wheelBRRef.current.rotation.x += wheelSpin;

    // 5. Hiệu ứng đèn còi xe cảnh sát nhấp nháy
    if (route.type === 'police') {
      const flash = Math.sin(state.clock.elapsedTime * 14) > 0;
      if (sirenRedRef.current) sirenRedRef.current.emissiveIntensity = flash ? 2.5 : 0.1;
      if (sirenBlueRef.current) sirenBlueRef.current.emissiveIntensity = flash ? 0.1 : 2.5;
    }
  });

  const isBus = route.type === 'bus';
  const isTruck = route.type === 'icecream' || route.type === 'truck';

  return (
    <group ref={groupRef}>
      {/* Bóng đổ dưới gầm xe */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[isBus ? 2.2 : 1.7, isBus ? 5.2 : 3.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* ========================================================= */}
      {/* 1. LOẠI XE BUÝT 2 TẦNG / SCHOOL BUS                        */}
      {/* ========================================================= */}
      {isBus && (
        <group position={[0, 0.35, 0]}>
          {/* Thân xe buýt dài */}
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 1.8, 4.8]} />
            <meshStandardMaterial color={route.color} roughness={0.3} />
          </mesh>
          {/* Sọc trắng trang trí ngang thân xe */}
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[2.04, 0.2, 4.82]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Kính chắn gió trước & sau */}
          <mesh position={[0, 1.2, 2.41]}>
            <boxGeometry args={[1.75, 0.75, 0.05]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.5} />
          </mesh>
          {/* Dải cửa sổ hai bên hông xe buýt */}
          {[-1.5, -0.5, 0.5, 1.5].map((zPos, idx) => (
            <mesh key={idx} position={[0, 1.25, zPos]}>
              <boxGeometry args={[2.05, 0.65, 0.7]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.1} />
            </mesh>
          ))}
          {/* Mui thông gió trên nóc xe */}
          <mesh position={[0, 1.85, 0]}>
            <boxGeometry args={[1.4, 0.15, 3.6]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 2. LOẠI XE KEM / XE TẢI NHỎ DỄ THƯƠNG (ICE CREAM VAN)     */}
      {/* ========================================================= */}
      {isTruck && (
        <group position={[0, 0.35, 0]}>
          {/* Đầu cabin xe */}
          <mesh position={[0, 0.65, 1.1]} castShadow>
            <boxGeometry args={[1.65, 1.2, 1.4]} />
            <meshStandardMaterial color="#fff1f2" roughness={0.3} />
          </mesh>
          {/* Kính chắn gió cabin */}
          <mesh position={[0, 0.85, 1.81]}>
            <boxGeometry args={[1.45, 0.55, 0.05]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} />
          </mesh>
          {/* Thùng hàng phía sau */}
          <mesh position={[0, 0.95, -0.55]} castShadow>
            <boxGeometry args={[1.75, 1.75, 2.2]} />
            <meshStandardMaterial color={route.color} roughness={0.35} />
          </mesh>
          {/* Mái hiên sọc hồng trắng bên hông xe kem */}
          <mesh position={[0.92, 1.35, -0.55]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[0.1, 0.5, 1.8]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
          {/* Cây kem ốc quế khổng lồ gắn trên nóc xe */}
          {route.type === 'icecream' && (
            <group position={[0, 2.2, -0.4]} rotation={[Math.PI / 8, 0, 0]}>
              <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.32, 0.7, 12]} />
                <meshStandardMaterial color="#d97706" />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.35, 14, 14]} />
                <meshStandardMaterial color="#fbcfe8" />
              </mesh>
              <mesh position={[0, 0.55, 0]}>
                <sphereGeometry args={[0.24, 12, 12]} />
                <meshStandardMaterial color="#fef08a" />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================= */}
      {/* 3. LOẠI XE SEDAN / TAXI / CẢNH SÁT                        */}
      {/* ========================================================= */}
      {!isBus && !isTruck && (
        <group position={[0, 0.32, 0]}>
          {/* Thân dưới của xe */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.6, 3.2]} />
            <meshStandardMaterial color={route.color} roughness={0.25} metalness={0.2} />
          </mesh>

          {/* Cabin mui xe phía trên */}
          <mesh position={[0, 0.85, -0.15]} castShadow>
            <boxGeometry args={[1.38, 0.55, 1.7]} />
            <meshStandardMaterial
              color={route.type === 'police' ? '#ffffff' : route.color}
              roughness={0.25}
            />
          </mesh>

          {/* Kính chắn gió trước */}
          <mesh position={[0, 0.84, 0.71]}>
            <boxGeometry args={[1.25, 0.42, 0.05]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.6} />
          </mesh>

          {/* Kính sau */}
          <mesh position={[0, 0.84, -1.01]}>
            <boxGeometry args={[1.25, 0.42, 0.05]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.6} />
          </mesh>

          {/* Kính cửa sổ 2 bên */}
          <mesh position={[0, 0.84, -0.15]}>
            <boxGeometry args={[1.41, 0.4, 1.3]} />
            <meshStandardMaterial color="#7dd3fc" roughness={0.1} />
          </mesh>

          {/* Biển mào TAXI trên nóc */}
          {route.type === 'taxi' && (
            <mesh position={[0, 1.22, -0.1]}>
              <boxGeometry args={[0.6, 0.2, 0.28]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={0.8}
              />
            </mesh>
          )}

          {/* Đèn còi Cảnh Sát xanh đỏ trên nóc */}
          {route.type === 'police' && (
            <group position={[0, 1.2, -0.1]}>
              <mesh position={[-0.25, 0, 0]}>
                <boxGeometry args={[0.35, 0.16, 0.22]} />
                <meshStandardMaterial
                  ref={sirenRedRef}
                  color="#ef4444"
                  emissive="#ef4444"
                  emissiveIntensity={2.0}
                />
              </mesh>
              <mesh position={[0.25, 0, 0]}>
                <boxGeometry args={[0.35, 0.16, 0.22]} />
                <meshStandardMaterial
                  ref={sirenBlueRef}
                  color="#3b82f6"
                  emissive="#3b82f6"
                  emissiveIntensity={2.0}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================= */}
      {/* ĐÈN PHA TRƯỚC & ĐÈN HẬU SAU XE                            */}
      {/* ========================================================= */}
      <group position={[0, 0.65, isBus ? 2.42 : 1.61]}>
        <mesh position={[-0.55, 0, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
        </mesh>
      </group>
      <group position={[0, 0.65, isBus ? -2.42 : -1.61]}>
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[0.28, 0.15, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[0.28, 0.15, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 4 BÁNH XE XOAY VẬT LÝ                                     */}
      {/* ========================================================= */}
      <mesh
        ref={wheelFLRef}
        position={[-0.82, 0.32, isBus ? 1.5 : 0.95]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.32, 0.24, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh
        ref={wheelFRRef}
        position={[0.82, 0.32, isBus ? 1.5 : 0.95]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.32, 0.24, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh
        ref={wheelBLRef}
        position={[-0.82, 0.32, isBus ? -1.5 : -0.95]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.32, 0.24, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh
        ref={wheelBRRef}
        position={[0.82, 0.32, isBus ? -1.5 : -0.95]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.32, 0.24, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Nhãn tên phương tiện nhỏ gọn nếu có */}
      {route.label && (
        <Html position={[0, isBus ? 2.8 : 2.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              color: '#f8fafc',
              fontSize: '9px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.2)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {route.label}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Hệ thống giao thông đô thị Play Together:
 * Bao gồm các tuyến xe buýt, taxi, xe kem, xe cảnh sát và ô tô con chạy liên tục trên đại lộ
 */
const CITY_ROUTES: VehicleRoute[] = [
  // --- VÒNG ĐAI TRONG (INNER PLAZA RING ROAD: X = ±21, Z = ±21) ---
  // Làn trong cùng (Chiều kim đồng hồ: R = 19.5)
  {
    id: 'taxi-inner-1',
    type: 'taxi',
    color: '#facc15',
    speed: 6.5,
    initialProgress: 0.0,
    label: '🚕 City Taxi',
    waypoints: [
      [-19.5, -19.5],
      [19.5, -19.5],
      [19.5, 19.5],
      [-19.5, 19.5],
    ],
  },
  {
    id: 'icecream-inner-1',
    type: 'icecream',
    color: '#f472b6',
    speed: 5.2,
    initialProgress: 0.5,
    label: '🍦 Ice Cream Van',
    waypoints: [
      [-19.5, -19.5],
      [19.5, -19.5],
      [19.5, 19.5],
      [-19.5, 19.5],
    ],
  },

  // Làn ngoài vòng trong (Ngược chiều kim đồng hồ: R = 22.5)
  {
    id: 'bus-inner-1',
    type: 'bus',
    color: '#ef4444',
    speed: 5.8,
    initialProgress: 0.25,
    label: '🚌 London Bus #01',
    waypoints: [
      [-22.5, 22.5],
      [22.5, 22.5],
      [22.5, -22.5],
      [-22.5, -22.5],
    ],
  },
  {
    id: 'sedan-inner-mint',
    type: 'sedan',
    color: '#34d399',
    speed: 7.2,
    initialProgress: 0.75,
    waypoints: [
      [-22.5, 22.5],
      [22.5, 22.5],
      [22.5, -22.5],
      [-22.5, -22.5],
    ],
  },

  // --- VÒNG ĐAI ĐẠI LỘ NGOÀI (OUTER BOULEVARD: X = ±52, Z = ±52) ---
  // Làn trong (R = 50.5)
  {
    id: 'police-outer-1',
    type: 'police',
    color: '#1e293b',
    speed: 9.0,
    initialProgress: 0.1,
    label: '🚓 Police Patrol',
    waypoints: [
      [-50.5, -50.5],
      [50.5, -50.5],
      [50.5, 50.5],
      [-50.5, 50.5],
    ],
  },
  {
    id: 'schoolbus-outer-1',
    type: 'bus',
    color: '#f59e0b',
    speed: 6.8,
    initialProgress: 0.45,
    label: '🚌 School Bus',
    waypoints: [
      [-50.5, -50.5],
      [50.5, -50.5],
      [50.5, 50.5],
      [-50.5, 50.5],
    ],
  },
  {
    id: 'sedan-outer-blue',
    type: 'sedan',
    color: '#38bdf8',
    speed: 8.2,
    initialProgress: 0.8,
    waypoints: [
      [-50.5, -50.5],
      [50.5, -50.5],
      [50.5, 50.5],
      [-50.5, 50.5],
    ],
  },

  // Làn ngoài (R = 53.5)
  {
    id: 'taxi-outer-2',
    type: 'taxi',
    color: '#facc15',
    speed: 8.0,
    initialProgress: 0.3,
    label: '🚕 Express Taxi',
    waypoints: [
      [-53.5, 53.5],
      [53.5, 53.5],
      [53.5, -53.5],
      [-53.5, -53.5],
    ],
  },
  {
    id: 'sedan-outer-purple',
    type: 'sedan',
    color: '#a855f7',
    speed: 8.5,
    initialProgress: 0.65,
    waypoints: [
      [-53.5, 53.5],
      [53.5, 53.5],
      [53.5, -53.5],
      [-53.5, -53.5],
    ],
  },
  {
    id: 'truck-outer-delivery',
    type: 'truck',
    color: '#fb923c',
    speed: 7.0,
    initialProgress: 0.9,
    label: '🚚 Super Mart Delivery',
    waypoints: [
      [-53.5, 53.5],
      [53.5, 53.5],
      [53.5, -53.5],
      [-53.5, -53.5],
    ],
  },
];

export default function CityTraffic() {
  return (
    <group>
      {CITY_ROUTES.map((route) => (
        <AutonomousVehicle key={route.id} route={route} />
      ))}
    </group>
  );
}
