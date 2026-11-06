'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import {
  getLocalPlayerPosition,
  getNearbyStreetNpcId,
  setNearbyStreetNpcId,
} from '@/stores/useMultiplayerStore';

export interface CitizenConfig {
  id: string;
  name: string;
  role: string;
  shirtColor: string;
  hatColor: string;
  badgeColor: string;
  speed: number;
  waypoints: [number, number][];
  phrases: string[];
  initialProgress?: number;
}

/**
 * Một NPC cư dân Chibi tự động đi dạo trên vỉa hè, vẫy tay và trò chuyện tiếng Anh
 */
function WanderingCitizen({
  citizen,
  onInteract,
}: {
  citizen: CitizenConfig;
  onInteract?: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const isPlayerNearRef = useRef(false);

  // Luân phiên hiển thị câu thoại tiếng Anh tự nhiên khi đi dạo
  useEffect(() => {
    const interval = setInterval(() => {
      setShowBubble((prev) => !prev);
      setPhraseIdx((prev) => (prev + 1) % citizen.phrases.length);
    }, 4500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [citizen.phrases.length]);

  // Lắng nghe phím [E] khi người chơi đứng gần NPC trên đường
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyE' && isPlayerNearRef.current) {
        const activeNpcId = getNearbyStreetNpcId();
        if (!activeNpcId || activeNpcId === citizen.id) {
          e.preventDefault();
          e.stopPropagation();
          onInteract?.(citizen.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (getNearbyStreetNpcId() === citizen.id) {
        setNearbyStreetNpcId(null);
      }
    };
  }, [citizen.id, onInteract]);

  // Tính toán độ dài quãng đường giữa các điểm Waypoint
  const segments = useMemo(() => {
    const pts = citizen.waypoints;
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
  }, [citizen.waypoints]);

  const distanceRef = useRef<number>((citizen.initialProgress || 0) * segments.totalLength);
  const currentAngleRef = useRef<number>(segments.segs[0]?.angle || 0);
  const walkCycleRef = useRef<number>(Math.random() * 10);

  useFrame((state, delta) => {
    if (!groupRef.current || segments.totalLength === 0) return;

    // Tính vị trí hiện tại trên quãng đường
    let rem = distanceRef.current;
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

    // Kiểm tra khoảng cách với người chơi trên đường
    const playerPos = getLocalPlayerPosition();
    const distToPlayer = Math.hypot(playerPos.x - posX, playerPos.z - posZ);
    const nearNow = distToPlayer <= 3.8;

    if (nearNow !== isPlayerNearRef.current) {
      isPlayerNearRef.current = nearNow;
      setIsPlayerNear(nearNow);
      if (nearNow) {
        setNearbyStreetNpcId(citizen.id);
      } else if (getNearbyStreetNpcId() === citizen.id) {
        setNearbyStreetNpcId(null);
      }
    } else if (nearNow && !getNearbyStreetNpcId()) {
      setNearbyStreetNpcId(citizen.id);
    }

    if (nearNow) {
      // Dừng bước đi để người chơi dễ bấm [E], quay mặt về phía người chơi và vẫy tay chào
      groupRef.current.position.set(posX, 0, posZ);
      const facePlayerAngle = Math.atan2(playerPos.x - posX, playerPos.z - posZ);
      let angleDiff = facePlayerAngle - currentAngleRef.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      currentAngleRef.current += angleDiff * Math.min(1.0, delta * 10);
      groupRef.current.rotation.y = currentAngleRef.current;

      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.2 + Math.sin(state.clock.elapsedTime * 8) * 0.35;
      }
      return;
    }

    // 1. Tiến về phía trước theo lộ trình khi người chơi không đứng sát
    distanceRef.current = (distanceRef.current + citizen.speed * delta) % segments.totalLength;

    // Nhịp nhún nhảy nhẹ khi bước đi
    walkCycleRef.current += delta * citizen.speed * 4.2;
    const bounceY = Math.abs(Math.sin(walkCycleRef.current)) * 0.06;

    groupRef.current.position.set(posX, bounceY, posZ);

    // 2. Xoay hướng mặt mượt mà theo lộ trình
    let angleDiff = activeSeg.angle - currentAngleRef.current;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentAngleRef.current += angleDiff * Math.min(1.0, delta * 10);
    groupRef.current.rotation.y = currentAngleRef.current;

    // 3. Hoạt ảnh đánh tay và bước chân Chibi
    const swing = Math.sin(walkCycleRef.current) * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onInteract?.(citizen.id);
      }}
    >
      {/* Bong bóng thoại tiếng Anh & Nhãn tên nổi trên đầu */}
      <Html position={[0, 1.95, 0]} center zIndexRange={[15, 0]}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: isPlayerNear ? 'auto' : 'none',
          }}
        >
          {isPlayerNear ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInteract?.(citizen.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: '1.5px solid #93c5fd',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.55)',
                fontWeight: 900,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '5px',
                  backgroundColor: '#fbbf24',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '10px',
                }}
              >
                E
              </span>
              <span>Trò chuyện cùng {citizen.name}</span>
            </button>
          ) : (
            showBubble && (
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  color: '#0f172a',
                  fontSize: '10px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  border: `1.5px solid ${citizen.badgeColor}`,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                "{citizen.phrases[phraseIdx]}"
              </div>
            )
          )}

          <div
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: `1.5px solid ${isPlayerNear ? '#38bdf8' : citizen.badgeColor}`,
              color: '#f8fafc',
              fontSize: '10px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚶 {citizen.name}{' '}
            <span style={{ color: citizen.badgeColor, fontSize: '9px' }}>({citizen.role})</span>
          </div>
        </div>
      </Html>

      {/* Bóng đổ tròn dưới chân */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>

      {/* Thân áo Chibi */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.23, 0.34, 8, 14]} />
        <meshStandardMaterial color={citizen.shirtColor} roughness={0.35} />
      </mesh>

      {/* Ba lô nhỏ đeo sau lưng */}
      <mesh position={[0, 0.58, -0.22]} castShadow>
        <boxGeometry args={[0.28, 0.32, 0.14]} />
        <meshStandardMaterial color={citizen.hatColor} roughness={0.4} />
      </mesh>

      {/* Đầu tròn Chibi */}
      <group position={[0, 1.12, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.4} />
        </mesh>
        {/* Mắt */}
        <mesh position={[-0.1, 0.03, 0.28]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.1, 0.03, 0.28]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Má hồng */}
        <mesh position={[-0.18, -0.04, 0.26]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>
        <mesh position={[0.18, -0.04, 0.26]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>
        {/* Nón / Tóc */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.34, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={citizen.hatColor} roughness={0.3} />
        </mesh>
      </group>

      {/* Hai tay chuyển động */}
      <mesh ref={leftArmRef} position={[-0.3, 0.56, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.24, 6, 10]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>
      <mesh ref={rightArmRef} position={[0.3, 0.56, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.24, 6, 10]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Hai chân chuyển động */}
      <mesh ref={leftLegRef} position={[-0.12, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

/**
 * Danh sách các NPC đi bộ nhộn nhịp khắp các khu phố, công viên, trường học, đại lộ
 */
const CITY_CITIZENS: CitizenConfig[] = [
  // 1. Đi dạo quanh Đài phun nước Quảng trường Trung tâm
  {
    id: 'CITIZEN_SOPHIA',
    name: 'Sophia',
    role: 'Tourist • A1',
    shirtColor: '#f472b6',
    hatColor: '#facc15',
    badgeColor: '#f472b6',
    speed: 2.3,
    initialProgress: 0.1,
    waypoints: [
      [-9, -9],
      [9, -9],
      [9, 9],
      [-9, 9],
    ],
    phrases: [
      'What a beautiful fountain! ⛲',
      'Excuse me, where is the Plaza Cafe?',
      'I love practicing English here!',
      'Have a wonderful day, everyone! ☀️',
    ],
  },
  // 2. Đi bộ quanh vòng ngoài Quảng trường
  {
    id: 'CITIZEN_LIAM',
    name: 'Liam',
    role: 'Student • A2',
    shirtColor: '#38bdf8',
    hatColor: '#ef4444',
    badgeColor: '#38bdf8',
    speed: 2.6,
    initialProgress: 0.6,
    waypoints: [
      [14, 14],
      [-14, 14],
      [-14, -14],
      [14, -14],
    ],
    phrases: [
      "I'm heading to Play School for class! 🎒",
      'Did you pass the CEFR B1 exam yet?',
      'Hold [Shift] to ride your skateboard! 🛹',
      "Let's grab a cappuccino after school!",
    ],
  },
  // 3. Đi bộ dọc Vỉa hè Khu Thương Mại & Cafe (Đông Bắc)
  {
    id: 'CITIZEN_OLIVIA',
    name: 'Olivia',
    role: 'Food Blogger • B1',
    shirtColor: '#a855f7',
    hatColor: '#fbcfe8',
    badgeColor: '#a855f7',
    speed: 2.2,
    initialProgress: 0.2,
    waypoints: [
      [26, 26],
      [46, 26],
      [46, 46],
      [26, 46],
    ],
    phrases: [
      'The pizza at Burger & Pizza Diner is amazing! 🍕',
      'Would you like to join me for coffee? ☕',
      'Shopping at the Boutique is so much fun!',
    ],
  },
  // 4. Đi bộ quanh Khu Trường Học & Thư Viện (Tây Bắc)
  {
    id: 'CITIZEN_NOAH',
    name: 'Noah',
    role: 'Bookworm • B2',
    shirtColor: '#10b981',
    hatColor: '#1e293b',
    badgeColor: '#10b981',
    speed: 2.4,
    initialProgress: 0.4,
    waypoints: [
      [-26, 26],
      [-46, 26],
      [-46, 46],
      [-26, 46],
    ],
    phrases: [
      'The City Library has thousands of English books! 📚',
      'Reading every day improves your vocabulary.',
      'Who wants to play basketball at the court? 🏀',
    ],
  },
  // 5. Đi bộ quanh Khu Siêu Thị & Rạp Chiếu Phim (Đông Nam)
  {
    id: 'CITIZEN_CHLOE',
    name: 'Chloe',
    role: 'Movie Fan • A2',
    shirtColor: '#fb923c',
    hatColor: '#38bdf8',
    badgeColor: '#fb923c',
    speed: 2.5,
    initialProgress: 0.3,
    waypoints: [
      [26, -26],
      [46, -26],
      [46, -46],
      [26, -46],
    ],
    phrases: [
      'A new English movie is showing at the Cinema! 🎬',
      'I need to buy groceries at Super Mart 🛒',
      'Watching movies without subtitles really helps!',
    ],
  },
  // 6. Đi dạo quanh Bến Câu Cá & Khu Cắm Trại (Tây Nam)
  {
    id: 'CITIZEN_LUCAS',
    name: 'Lucas',
    role: 'Camper • A1',
    shirtColor: '#facc15',
    hatColor: '#15803d',
    badgeColor: '#facc15',
    speed: 2.1,
    initialProgress: 0.7,
    waypoints: [
      [-26, -15],
      [-45, -15],
      [-45, -45],
      [-26, -45],
    ],
    phrases: [
      'I just caught a Baby Shark at the pier! 🦈',
      'Press [F] near the lake to go fishing! 🎣',
      'Camping by the campfire is so relaxing 🔥',
    ],
  },
  // 7. Nhân viên văn phòng đi dạo khu Downtown Cao Ốc (Phía Nam)
  {
    id: 'CITIZEN_DAVID',
    name: 'David',
    role: 'Banker • C1',
    shirtColor: '#3b82f6',
    hatColor: '#0f172a',
    badgeColor: '#60a5fa',
    speed: 2.8,
    initialProgress: 0.15,
    waypoints: [
      [-40, -58],
      [40, -58],
      [40, -62],
      [-40, -62],
    ],
    phrases: [
      'Welcome to Downtown Financial District! 🏙️',
      'Business English is essential for global careers.',
      'Look at all the taxis and buses on the boulevard!',
    ],
  },
  // 8. Cư dân đi dạo Khu Nhà Ở Ngoại Ô (Phía Bắc)
  {
    id: 'CITIZEN_HANNAH',
    name: 'Hannah',
    role: 'Neighbor • A2',
    shirtColor: '#ec4899',
    hatColor: '#fde047',
    badgeColor: '#ec4899',
    speed: 2.3,
    initialProgress: 0.5,
    waypoints: [
      [-40, 58],
      [40, 58],
      [40, 62],
      [-40, 62],
    ],
    phrases: [
      'Welcome to our cozy residential neighborhood! 🏡',
      'Every house here has a lovely flower garden 🌷',
      'Feel free to visit your neighbors anytime!',
    ],
  },
];

export default function WalkingNPCs({ onInteractNPC }: { onInteractNPC?: (npcId: string) => void }) {
  return (
    <group>
      {CITY_CITIZENS.map((citizen) => (
        <WanderingCitizen key={citizen.id} citizen={citizen} onInteract={onInteractNPC} />
      ))}
    </group>
  );
}

