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
import { FashionAvatar, type FashionAvatarRef } from './FashionAvatar';
import KeyPromptBadge from './KeyPromptBadge';

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
  const avatarRef = useRef<FashionAvatarRef>(null);

  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const isPlayerNearRef = useRef(false);

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

      if (avatarRef.current?.leftLeg) avatarRef.current.leftLeg.rotation.x *= 0.8;
      if (avatarRef.current?.rightLeg) avatarRef.current.rightLeg.rotation.x *= 0.8;
      if (avatarRef.current?.leftArm) avatarRef.current.leftArm.rotation.x *= 0.8;
      if (avatarRef.current?.rightArm) {
        avatarRef.current.rightArm.rotation.x =
          -2.2 + Math.sin(state.clock.elapsedTime * 8) * 0.35;
      }
      return;
    }

    // 1. Tiến về phía trước theo lộ trình khi người chơi không đứng sát
    distanceRef.current = (distanceRef.current + citizen.speed * delta) % segments.totalLength;

    // Nhịp bước đi
    walkCycleRef.current += delta * citizen.speed * 4.2;
    const bounceY = Math.abs(Math.sin(walkCycleRef.current)) * 0.04;

    groupRef.current.position.set(posX, bounceY, posZ);

    // 2. Xoay hướng mặt mượt mà theo lộ trình
    let angleDiff = activeSeg.angle - currentAngleRef.current;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentAngleRef.current += angleDiff * Math.min(1.0, delta * 10);
    groupRef.current.rotation.y = currentAngleRef.current;

    // 3. Hoạt ảnh đánh tay và bước chân Fashion Avatar
    const swing = Math.sin(walkCycleRef.current) * 0.48;
    if (avatarRef.current?.leftLeg) avatarRef.current.leftLeg.rotation.x = swing;
    if (avatarRef.current?.rightLeg) avatarRef.current.rightLeg.rotation.x = -swing;
    if (avatarRef.current?.leftArm) avatarRef.current.leftArm.rotation.x = -swing * 0.75;
    if (avatarRef.current?.rightArm) avatarRef.current.rightArm.rotation.x = swing * 0.75;
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onInteract?.(citizen.id);
      }}
    >
      {/* Chỉ hiện phím [E] khi người chơi đến gần, triệt tiêu chữ rối mắt */}
      {isPlayerNear && (
        <Html position={[0, 2.15, 0]} center zIndexRange={[15, 0]}>
          <KeyPromptBadge
            keyLabel="E"
            onClick={() => onInteract?.(citizen.id)}
            color="#60a5fa"
          />
        </Html>
      )}

      <FashionAvatar
        ref={avatarRef}
        outfitColor={citizen.shirtColor}
        hatColor={citizen.hatColor}
        scale={1.3}
        isNpc={true}
      />
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

