'use client';

import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from './SafeHtml';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  LinearProgress,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import AttractionsRoundedIcon from '@mui/icons-material/AttractionsRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import {
  pickNonRepeatingMultiSourceQuestion,
  ENGLISH_DATABASE_SOURCES,
} from '@/data/englishQuestionDatabase';

export type AmusementRideId =
  | 'FERRIS_WHEEL'
  | 'CAROUSEL'
  | 'SKY_DROP'
  | 'ROCKET_SPINNER'
  | 'BUMPER_CARS'
  | 'CASTLE_SLIDE';

export interface AmusementRideConfig {
  id: AmusementRideId;
  name: string;
  englishName: string;
  icon: string;
  ticketCost: number;
  durationSec: number;
  expReward: number;
  thrillLevel: 'Nhẹ nhàng' | 'Sôi động' | 'Cảm giác mạnh';
  badgeColor: string;
  description: string;
  parkZone: 'WONDERLAND' | 'SMILE_PARK';
  exitPosition: [number, number, number];
}

export const AMUSEMENT_RIDES: AmusementRideConfig[] = [
  {
    id: 'FERRIS_WHEEL',
    name: 'Vòng Quay Mặt Trời (London Eye 3D)',
    englishName: 'Giant Sunlight Ferris Wheel',
    icon: '🎡',
    ticketCost: 40,
    durationSec: 18,
    expReward: 75,
    thrillLevel: 'Nhẹ nhàng',
    badgeColor: '#ec4899',
    description:
      'Ngồi trong cabin kính toàn cảnh, từ từ nâng lên độ cao 18m ngắm trọn vẹn đại đô thị 3D lung linh.',
    parkZone: 'WONDERLAND',
    exitPosition: [-57, 1.2, -25],
  },
  {
    id: 'SKY_DROP',
    name: 'Tháp Rơi Tự Do (Sky Drop 22m)',
    englishName: 'Extreme Sky Drop Tower',
    icon: '🗼',
    ticketCost: 45,
    durationSec: 16,
    expReward: 90,
    thrillLevel: 'Cảm giác mạnh',
    badgeColor: '#ef4444',
    description:
      'Thử thách lòng dũng cảm! Ghế an toàn đưa bạn lên đỉnh tháp thép 22m trước khi rơi tự do cực phấn khích.',
    parkZone: 'WONDERLAND',
    exitPosition: [-57, 1.2, -11],
  },
  {
    id: 'ROCKET_SPINNER',
    name: 'Phi Thuyền Vũ Trụ (Astro Orbiter)',
    englishName: 'Supersonic Space Rocket Spinner',
    icon: '🚀',
    ticketCost: 35,
    durationSec: 15,
    expReward: 65,
    thrillLevel: 'Sôi động',
    badgeColor: '#38bdf8',
    description:
      'Lái tàu con thoi phản lực xoay vòng trên không trung với hiệu ứng lửa động cơ Plasma rực sáng.',
    parkZone: 'WONDERLAND',
    exitPosition: [-57, 1.2, 3],
  },
  {
    id: 'CAROUSEL',
    name: 'Đu Quay Ngựa Gỗ Hoàng Gia',
    englishName: 'Grand Victorian Royal Carousel',
    icon: '🎠',
    ticketCost: 25,
    durationSec: 15,
    expReward: 50,
    thrillLevel: 'Nhẹ nhàng',
    badgeColor: '#f59e0b',
    description:
      'Cưỡi chiến mã hoàng gia chạm khắc tinh xảo dưới mái vòm đèn vàng cổ điển châu Âu.',
    parkZone: 'SMILE_PARK',
    exitPosition: [-40, 1.2, -2],
  },
  {
    id: 'BUMPER_CARS',
    name: 'Đấu Trường Xe Điện Đụng Neon',
    englishName: 'Cyber Neon Bumper Cars Arena',
    icon: '🏎️',
    ticketCost: 30,
    durationSec: 16,
    expReward: 60,
    thrillLevel: 'Sôi động',
    badgeColor: '#a855f7',
    description:
      'Điều khiển xe điện đụng phát sáng Neon lướt vòng quanh sàn đấu kim loại đầy kịch tính.',
    parkZone: 'SMILE_PARK',
    exitPosition: [-30, 1.2, -2],
  },
  {
    id: 'CASTLE_SLIDE',
    name: 'Lâu Đài Phép Thuật & Tàu Lượn Mini',
    englishName: 'Magic Castle Coaster & Slide',
    icon: '🏰',
    ticketCost: 20,
    durationSec: 14,
    expReward: 45,
    thrillLevel: 'Nhẹ nhàng',
    badgeColor: '#10b981',
    description:
      'Khám phá tòa tháp lâu đài cổ tích và trượt xoắn ốc tốc độ cao quanh khuôn viên công viên.',
    parkZone: 'SMILE_PARK',
    exitPosition: [-35, 1.2, -2],
  },
];

/**
 * Tính toán tọa độ 3D thời gian thực của Người Chơi khi đang ngồi trên từng trò chơi
 * Giúp nhân vật của bạn thực sự bay lên Vòng quay Mặt trời, cưỡi Ngựa gỗ, lên Tháp rơi tự do!
 */
export function computeAmusementRidePlayerTransform(
  rideId: AmusementRideId,
  elapsedTime: number
): {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  camOrbitRadius: number;
  camHeight: number;
} {
  switch (rideId) {
    case 'FERRIS_WHEEL': {
      // Tâm vòng quay tại [-64, 10.6, -25], bán kính 7.2m, quay trong mặt phẳng X-Y hoặc Y-Z
      const wheelAngle = elapsedTime * 0.45;
      const radius = 7.2;
      const cx = -64 + Math.cos(wheelAngle) * radius;
      const cy = 10.6 + Math.sin(wheelAngle) * radius;
      const cz = -25;
      return {
        x: cx,
        y: cy - 0.35,
        z: cz,
        rotationY: 0,
        camOrbitRadius: 31,
        camHeight: 19,
      };
    }

    case 'SKY_DROP': {
      // Tháp rơi tự do tại [-64, 0, -10.5]
      const cycle = elapsedTime % 8.0;
      let dropY = 1.2;
      if (cycle < 4.2) {
        // Kéo lên đỉnh tháp 19m
        dropY = 1.2 + (cycle / 4.2) * 17.5;
      } else if (cycle < 5.3) {
        // Dừng hồi hộp trên đỉnh tháp
        dropY = 18.7 + Math.sin(elapsedTime * 18) * 0.08;
      } else if (cycle < 6.1) {
        // Rơi tự do tốc độ cao!
        const t = (cycle - 5.3) / 0.8;
        dropY = 18.7 - t * t * 17.2;
      } else {
        // Nhún phanh đệm khí nén
        const bounceT = cycle - 6.1;
        dropY = 1.5 + Math.abs(Math.sin(bounceT * 5.5)) * Math.exp(-bounceT * 1.4) * 3.2;
      }
      return {
        x: -64,
        y: dropY,
        z: -9.1,
        rotationY: 0,
        camOrbitRadius: 28,
        camHeight: 16,
      };
    }

    case 'ROCKET_SPINNER': {
      // Phi thuyền vũ trụ tại [-64, 0, 3.5]
      const angle = elapsedTime * 1.65;
      const radius = 4.2;
      const rx = -64 + Math.cos(angle) * radius;
      const rz = 3.5 + Math.sin(angle) * radius;
      const ry = 3.95;
      return {
        x: rx,
        y: ry,
        z: rz,
        rotationY: -angle,
        camOrbitRadius: 24,
        camHeight: 15,
      };
    }

    case 'CAROUSEL': {
      // Đu quay ngựa gỗ tại [-40.2, 0, -9]
      const angle = elapsedTime * 1.15;
      const radius = 2.45;
      const hx = -40.2 + Math.cos(angle) * radius;
      const hz = -9.0 - Math.sin(angle) * radius;
      const hy = 1.35 + Math.sin(elapsedTime * 4.2) * 0.26;
      return {
        x: hx,
        y: hy,
        z: hz,
        rotationY: angle + Math.PI,
        camOrbitRadius: 21,
        camHeight: 13.5,
      };
    }

    case 'BUMPER_CARS': {
      // Sân xe điện đụng tại [-29.5, 0, -9]
      const t = elapsedTime * 1.8;
      const bx = -29.5 + Math.sin(t) * 2.5 + Math.cos(t * 0.7) * 0.8;
      const bz = -9.0 + Math.cos(t * 1.3) * 2.1;
      const vx = Math.cos(t) * 2.5;
      const vz = -Math.sin(t * 1.3) * 2.1;
      return {
        x: bx,
        y: 0.68,
        z: bz,
        rotationY: Math.atan2(vx, vz),
        camOrbitRadius: 20,
        camHeight: 13.5,
      };
    }

    case 'CASTLE_SLIDE':
    default: {
      // Đường trượt xoắn ốc quanh Lâu đài tại [-35, 0, -11.5]
      const t = elapsedTime * 1.5;
      const sx = -35.0 + Math.cos(t) * 2.1;
      const sz = -11.5 + Math.sin(t) * 1.8;
      const sy = 2.1 + Math.sin(t * 0.8) * 1.1;
      return {
        x: sx,
        y: sy,
        z: sz,
        rotationY: -t,
        camOrbitRadius: 21,
        camHeight: 14,
      };
    }
  }
}

/**
 * Con ngựa gỗ 3D điêu khắc chi tiết cho Đu Quay Hoàng Gia
 */
function DetailedCarouselHorse({
  angle,
  radius,
  index,
  color,
  saddleColor,
}: {
  angle: number;
  radius: number;
  index: number;
  color: string;
  saddleColor: string;
}) {
  const horseGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (horseGroupRef.current) {
      horseGroupRef.current.position.y =
        1.05 + Math.sin(state.clock.elapsedTime * 4.2 + index * 1.05) * 0.26;
    }
  });

  const hx = Math.cos(angle) * radius;
  const hz = Math.sin(angle) * radius;

  return (
    <group position={[hx, 0, hz]} rotation={[0, -angle + Math.PI, 0]}>
      {/* Trục đồng xoắn nâng ngựa */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 3.6, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.18} />
      </mesh>

      {/* Thân ngựa gỗ điêu khắc */}
      <group ref={horseGroupRef} position={[0, 1.05, 0]}>
        {/* Thân chính */}
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.42, 0.96]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Yên ngựa hoàng gia */}
        <mesh position={[0, 0.23, -0.04]} castShadow>
          <boxGeometry args={[0.42, 0.08, 0.42]} />
          <meshStandardMaterial color={saddleColor} roughness={0.4} />
        </mesh>
        {/* Cổ ngựa vươn cao */}
        <mesh position={[0, 0.34, 0.36]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.52, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Đầu ngựa & Bờm vàng */}
        <mesh position={[0, 0.56, 0.52]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 0.24, 0.38]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.42, 0.24]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.08, 0.48, 0.12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.5} />
        </mesh>
        {/* Đuôi ngựa tung bay */}
        <mesh position={[0, 0.05, -0.56]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.12, 0.42, 0.14]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.4} />
        </mesh>
        {/* 4 Chân ngựa phi nước đại */}
        <mesh position={[-0.12, -0.3, 0.35]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.09, 0.42, 0.09]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.12, -0.3, 0.35]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.09, 0.42, 0.09]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.12, -0.3, -0.35]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.09, 0.42, 0.09]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.12, -0.3, -0.35]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.09, 0.42, 0.09]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Quầy Bán Vé Tự Động & Cổng Soát Vé Công Viên (Ticket Kiosk)
 */
function ParkTicketKiosk({
  position,
  title,
  onClickOpenMenu,
}: {
  position: [number, number, number];
  title: string;
  onClickOpenMenu?: () => void;
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClickOpenMenu?.();
      }}
    >
      {/* Chân đế đá hoa cương */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 0.24, 2.2]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Thân quầy gỗ sơn đỏ hoàng gia & viền vàng */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[2.4, 2.2, 1.8]} />
        <meshStandardMaterial color="#be123c" roughness={0.4} />
      </mesh>
      {/* Ô kính giao dịch bán vé */}
      <mesh position={[0, 1.55, 0.92]}>
        <boxGeometry args={[1.7, 1.05, 0.08]} />
        <meshStandardMaterial color="#bae6fd" metalness={0.3} roughness={0.15} />
      </mesh>
      {/* Bàn quầy đá cẩm thạch phía trước */}
      <mesh position={[0, 0.98, 1.02]} castShadow>
        <boxGeometry args={[2.55, 0.14, 0.35]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Mái vòm sọc lễ hội + Đèn bảng hiệu TICKETS */}
      <mesh position={[0, 2.85, 0]} castShadow>
        <coneGeometry args={[2.0, 1.1, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.55, 1.0]} castShadow>
        <boxGeometry args={[2.3, 0.42, 0.18]} />
        <meshStandardMaterial color="#1e1b4b" />
      </mesh>
    </group>
  );
}

/**
 * KHU VUI CHƠI SMILE PARK (Bên trái Quảng Trường Trung Tâm [-35, 0, -9])
 * Thiết kế kiến trúc công viên châu Âu chân thực:
 * - Đu Quay Ngựa Gỗ Hoàng Gia (Royal Carousel)
 * - Đấu Trường Xe Điện Đụng Neon (Bumper Cars Stadium)
 * - Lâu Đài Phép Thuật & Đường Trượt Xoắn Ốc (Magic Castle Coaster)
 * - Quầy Bán Vé & Cổng Vòm Đèn Vàng
 */
export function DetailedSmilePlaygroundPark({
  position = [-35, 0, -9],
  onSelectRide,
  onOpenParkMenu,
}: {
  position?: [number, number, number];
  onSelectRide?: (rideId: AmusementRideId) => void;
  onOpenParkMenu?: () => void;
}) {
  const carouselSpinRef = useRef<THREE.Group>(null);
  const bumperCarsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (carouselSpinRef.current) {
      carouselSpinRef.current.rotation.y = state.clock.elapsedTime * 1.15;
    }
    if (bumperCarsRef.current) {
      const t = state.clock.elapsedTime * 1.8;
      bumperCarsRef.current.children.forEach((child, idx) => {
        const phase = t + idx * 1.57;
        const cx = Math.sin(phase) * 2.3 + Math.cos(phase * 0.7) * 0.6;
        const cz = Math.cos(phase * 1.3) * 1.9;
        const vx = Math.cos(phase) * 2.3;
        const vz = -Math.sin(phase * 1.3) * 1.9;
        child.position.set(cx, 0.28, cz);
        child.rotation.y = Math.atan2(vx, vz);
      });
    }
  });

  return (
    <group position={position}>
      {/* 1. NỀN ĐÁ GRANITE QUẢNG TRƯỜNG VUI CHƠI CÓ BÓ VỈA BÊ TÔNG ĐÁ XÁM */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[21.5, 0.08, 15.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.085, 0]} receiveShadow>
        <boxGeometry args={[20.6, 0.04, 14.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
      </mesh>
      {/* Đường dạo lát gạch đỏ trang trí giữa công viên */}
      <mesh position={[0, 0.11, 2.8]} receiveShadow>
        <boxGeometry args={[18.8, 0.02, 2.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* Hàng rào sắt nghệ thuật & Trụ đèn cổ điển xung quanh công viên */}
      {[-9.5, -6.5, -3.5, 3.5, 6.5, 9.5].map((fx, idx) => (
        <group key={`fence-front-${idx}`} position={[fx, 0, 7.2]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[2.6, 0.85, 0.12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[-1.3, 0.7, 0]} castShadow>
            <boxGeometry args={[0.28, 1.15, 0.28]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[-1.3, 1.38, 0]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}

      {/* CỔNG VÒM CHÍNH THỨC (GRAND ARCHWAY) */}
      <group position={[0, 0, 7.2]}>
        {[-1.85, 1.85].map((px, i) => (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, 2.1, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.34, 4.2, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.35, 0.38, 0.6, 16]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 4.25, 0]} castShadow>
          <boxGeometry args={[4.6, 0.85, 0.45]} />
          <meshStandardMaterial color="#0f172a" metalness={0.5} />
        </mesh>
        <mesh position={[0, 4.25, 0.24]}>
          <boxGeometry args={[4.3, 0.65, 0.06]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* QUẦY BÁN VÉ TỰ ĐỘNG NGAY CỔNG */}
      <ParkTicketKiosk
        position={[0, 0.08, 4.4]}
        title="QUẦY VÉ SMILE PARK"
        onClickOpenMenu={onOpenParkMenu}
      />

      {/* ================================================================= */}
      {/* TRÒ CHƠI 1: ĐU QUAY NGỰA GỖ HOÀNG GIA (GRAND ROYAL CAROUSEL)      */}
      {/* Tâm tại [-5.2, 0, 0] -> World [-40.2, 0, -9]                      */}
      {/* ================================================================= */}
      <group
        position={[-5.2, 0.08, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('CAROUSEL');
        }}
      >
        {/* Bục gỗ tròn 2 bậc viền vàng hoàng gia */}
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.6, 3.85, 0.32, 32]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.36, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.3, 3.4, 0.14, 32]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Trục tháp chạm khắc trung tâm */}
        <mesh position={[0, 2.3, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.68, 3.8, 16]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 1.8, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.75} roughness={0.2} />
        </mesh>

        {/* 6 Chiến mã Hoàng gia xoay tròn & nhấp nhô */}
        <group ref={carouselSpinRef}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI * 2) / 6;
            const horseColors = ['#ffffff', '#fde68a', '#f8fafc', '#fbcfe8', '#ffffff', '#bae6fd'];
            const saddleColors = ['#be123c', '#1d4ed8', '#047857', '#7e22ce', '#b45309', '#be123c'];
            return (
              <DetailedCarouselHorse
                key={i}
                angle={angle}
                radius={2.45}
                index={i}
                color={horseColors[i]}
                saddleColor={saddleColors[i]}
              />
            );
          })}
        </group>

        {/* Mái vòm rạp xiếc Hoàng gia viền đèn vàng ấm */}
        <mesh position={[0, 4.15, 0]} castShadow>
          <cylinderGeometry args={[3.55, 3.55, 0.42, 32]} />
          <meshStandardMaterial color="#be123c" roughness={0.4} />
        </mesh>
        <mesh position={[0, 5.05, 0]} castShadow>
          <coneGeometry args={[3.65, 1.5, 24]} />
          <meshStandardMaterial color="#9f1239" roughness={0.45} />
        </mesh>
        {/* Vòng 12 bóng đèn tròn phát sáng quanh diềm mái */}
        {Array.from({ length: 12 }).map((_, idx) => {
          const a = (idx * Math.PI * 2) / 12;
          return (
            <mesh
              key={idx}
              position={[Math.cos(a) * 3.52, 4.12, Math.sin(a) * 3.52]}
            >
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={1.4}
              />
            </mesh>
          );
        })}
        {/* Đỉnh vương miện vàng */}
        <mesh position={[0, 6.0, 0]}>
          <sphereGeometry args={[0.32, 14, 14]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* TRÒ CHƠI 2: ĐẤU TRƯỜNG XE ĐIỆN ĐỤNG NEON (BUMPER CARS ARENA)      */}
      {/* Tâm tại [5.5, 0, 0] -> World [-29.5, 0, -9]                       */}
      {/* ================================================================= */}
      <group
        position={[5.5, 0.08, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('BUMPER_CARS');
        }}
      >
        {/* Sàn kim loại dẫn điện & Thành đệm cao su chống va đập */}
        <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
          <boxGeometry args={[7.4, 0.28, 6.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[6.6, 0.06, 5.6]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.22} />
        </mesh>
        {/* Vạch kẻ Neon trên mặt sàn đấu */}
        <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.0, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
        </mesh>

        {/* 4 Trụ thép nâng mái nhà vòm */}
        {[
          [-3.3, -2.8],
          [3.3, -2.8],
          [-3.3, 2.8],
          [3.3, 2.8],
        ].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, 2.1, pz]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 3.9, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* Mái che đấu trường Neon */}
        <mesh position={[0, 4.15, 0]} castShadow>
          <boxGeometry args={[7.8, 0.45, 6.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 4.16, 3.42]}>
          <boxGeometry args={[7.4, 0.22, 0.08]} />
          <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={1.2} />
        </mesh>

        {/* 4 Xe điện đụng tự động lướt và va chạm trên sàn */}
        <group ref={bumperCarsRef}>
          {[
            { body: '#ef4444', neon: '#f87171' },
            { body: '#3b82f6', neon: '#60a5fa' },
            { body: '#10b981', neon: '#34d399' },
            { body: '#f59e0b', neon: '#fbbf24' },
          ].map((car, idx) => (
            <group key={idx} position={[idx * 1.2 - 1.8, 0.28, 0]}>
              {/* Đệm cao su đen bo tròn quanh gầm xe */}
              <mesh position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.68, 0.72, 0.22, 20]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
              {/* Thân xe sơn bóng */}
              <mesh position={[0, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.52, 0.62, 0.26, 20]} />
                <meshStandardMaterial color={car.body} metalness={0.4} roughness={0.25} />
              </mesh>
              {/* Vô lăng & Ghế ngồi */}
              <mesh position={[0, 0.42, -0.12]}>
                <boxGeometry args={[0.42, 0.28, 0.22]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              {/* Cần thu điện chạm lưới trần */}
              <mesh position={[0, 1.9, -0.45]}>
                <cylinderGeometry args={[0.02, 0.02, 3.4, 6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ================================================================= */}
      {/* TRÒ CHƠI 3: LÂU ĐÀI PHÉP THUẬT & ĐƯỜNG TRƯỢT XOẮN ỐC              */}
      {/* Tâm tại [0, 0, -2.5] -> World [-35, 0, -11.5]                     */}
      {/* ================================================================= */}
      <group
        position={[0, 0.08, -2.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('CASTLE_SLIDE');
        }}
      >
        {/* Khối tháp đá lâu đài trung tâm */}
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 3.2, 2.6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* 4 Tháp canh góc lâu đài */}
        {[
          [-1.3, -1.3],
          [1.3, -1.3],
          [-1.3, 1.3],
          [1.3, 1.3],
        ].map(([tx, tz], idx) => (
          <group key={idx} position={[tx, 0, tz]}>
            <mesh position={[0, 2.0, 0]} castShadow>
              <cylinderGeometry args={[0.45, 0.5, 4.0, 14]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
            </mesh>
            <mesh position={[0, 4.55, 0]} castShadow>
              <coneGeometry args={[0.58, 1.2, 14]} />
              <meshStandardMaterial color="#2563eb" roughness={0.35} />
            </mesh>
          </group>
        ))}
        {/* Mái chóp nhọn trung tâm */}
        <mesh position={[0, 4.1, 0]} castShadow>
          <coneGeometry args={[1.95, 1.9, 8]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.35} />
        </mesh>
        {/* Làn trượt máng đôi cao tốc */}
        <mesh position={[-1.9, 1.15, 0.6]} rotation={[0.25, 0, -Math.PI / 3.6]} castShadow>
          <boxGeometry args={[0.22, 3.2, 0.95]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} />
        </mesh>
        <mesh position={[1.9, 1.15, 0.6]} rotation={[0.25, 0, Math.PI / 3.6]} castShadow>
          <boxGeometry args={[0.22, 3.2, 0.95]} />
          <meshStandardMaterial color="#10b981" roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * ĐẠI CÔNG VIÊN GIẢI TRÍ WONDERLAND (Ở góc trái bản đồ [-64, 0, -14])
 * Thiết kế kiến trúc Theme Park chuẩn quốc tế:
 * 1. 🎡 Vòng Quay Mặt Trời London Eye (Cabin luôn giữ cân bằng thẳng đứng khi quay!)
 * 2. 🗼 Tháp Rơi Tự Do Sky Drop 22m (Ghế hành khách leo lên đỉnh tháp & rơi tự do!)
 * 3. 🚀 Phi Thuyền Vũ Trụ Astro Orbiter (Tàu con thoi phản lực có cánh & lửa động cơ!)
 * 4. 🎪 Quảng Trường Đá Hoa Cương, Cổng Bán Vé & Quầy Carnival
 */
export function DetailedWonderlandAmusementPark({
  position = [-64, 0, -14],
  onSelectRide,
  onOpenParkMenu,
}: {
  position?: [number, number, number];
  onSelectRide?: (rideId: AmusementRideId) => void;
  onOpenParkMenu?: () => void;
}) {
  const wheelRef = useRef<THREE.Group>(null);
  const cabinRefs = useRef<Array<THREE.Group | null>>([]);
  const dropCarriageRef = useRef<THREE.Group>(null);
  const rocketHubRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Vòng quay Mặt trời: Vành quay tròn, nhưng 8 Cabin luôn giữ thẳng đứng theo trọng lực!
    const wheelAngle = t * 0.45;
    if (wheelRef.current) {
      wheelRef.current.rotation.z = wheelAngle;
    }
    cabinRefs.current.forEach((cabin) => {
      if (cabin) {
        cabin.rotation.z = -wheelAngle;
      }
    });

    // 2. Tháp rơi tự do Sky Drop: Kéo lên đỉnh 18.7m -> Dừng -> Rơi tự do!
    if (dropCarriageRef.current) {
      const cycle = t % 8.0;
      let dropY = 1.2;
      if (cycle < 4.2) {
        dropY = 1.2 + (cycle / 4.2) * 17.5;
      } else if (cycle < 5.3) {
        dropY = 18.7 + Math.sin(t * 18) * 0.08;
      } else if (cycle < 6.1) {
        const dt = (cycle - 5.3) / 0.8;
        dropY = 18.7 - dt * dt * 17.2;
      } else {
        const bounceT = cycle - 6.1;
        dropY = 1.5 + Math.abs(Math.sin(bounceT * 5.5)) * Math.exp(-bounceT * 1.4) * 3.2;
      }
      dropCarriageRef.current.position.y = dropY;
    }

    // 3. Phi thuyền Vũ trụ Astro Orbiter
    if (rocketHubRef.current) {
      rocketHubRef.current.rotation.y = -t * 1.65;
    }
  });

  const cabinCount = 8;

  return (
    <group position={position}>
      {/* NỀN ĐÁ HOA CƯƠNG ĐẠI CÔNG VIÊN (20m x 44m) KÈM BÓ VỈA ĐÁ XÁM */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[20.4, 0.08, 44.4]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.085, 0]} receiveShadow>
        <boxGeometry args={[19.4, 0.04, 43.4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      {/* Thảm đại lộ trung tâm dẫn vào các trò chơi */}
      <mesh position={[4.8, 0.11, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.02, 41.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.55} />
      </mesh>

      {/* QUẦY BÁN VÉ TRUNG TÂM WONDERLAND (Hướng ra đại lộ X = -52) */}
      <group position={[7.2, 0.08, -3.5]} rotation={[0, Math.PI / 2, 0]}>
        <ParkTicketKiosk
          position={[0, 0, 0]}
          title="VÉ WONDERLAND PARK"
          onClickOpenMenu={onOpenParkMenu}
        />
      </group>

      {/* ================================================================= */}
      {/* KỲ QUAN 1: VÒNG QUAY MẶT TRỜI LONDON EYE 3D (Tâm Z = -11 -> -25)  */}
      {/* ================================================================= */}
      <group
        position={[0, 0.08, -11]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('FERRIS_WHEEL');
        }}
      >
        {/* Sàn gỗ & Bậc thềm lên Cabin */}
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[9.6, 0.5, 5.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.54, 0]} receiveShadow>
          <boxGeometry args={[8.8, 0.08, 5.0]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* Hệ khung trụ thép chữ A kép chịu lực */}
        {[-1.55, 1.55].map((zOff, idx) => (
          <group key={idx} position={[0, 0, zOff]}>
            <mesh position={[-2.6, 5.4, 0]} rotation={[0, 0, -0.34]} castShadow>
              <cylinderGeometry args={[0.24, 0.34, 11.4, 14]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[2.6, 5.4, 0]} rotation={[0, 0, 0.34]} castShadow>
              <cylinderGeometry args={[0.24, 0.34, 11.4, 14]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Thanh giằng ngang gia cố */}
            <mesh position={[0, 4.8, 0]}>
              <boxGeometry args={[3.4, 0.22, 0.22]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Trục Turbine trung tâm ở độ cao 10.5m */}
        <mesh position={[0, 10.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.72, 4.2, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.2} />
        </mesh>

        {/* Vành bánh xe kép + 24 bóng đèn LED + 8 Cabin Kính luôn giữ phương thẳng đứng */}
        <group position={[0, 10.5, 0]} ref={wheelRef}>
          {[-0.65, 0.65].map((zRim, rIdx) => (
            <group key={rIdx} position={[0, 0, zRim]}>
              <mesh>
                <torusGeometry args={[7.2, 0.18, 14, 48]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh>
                <torusGeometry args={[4.8, 0.11, 12, 36]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={0.85}
                />
              </mesh>
            </group>
          ))}

          {/* 16 Đèn Neon đính dọc vành ngoài */}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 16;
            return (
              <mesh
                key={`bulb-${i}`}
                position={[Math.cos(a) * 7.2, Math.sin(a) * 7.2, 0.72]}
              >
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#f43f5e' : '#facc15'}
                  emissive={i % 2 === 0 ? '#e11d48' : '#eab308'}
                  emissiveIntensity={1.4}
                />
              </mesh>
            );
          })}

          {/* 8 Nan hoa kép & 8 Cabin Kính Panorama giữ thăng bằng trọng lực */}
          {Array.from({ length: cabinCount }).map((_, i) => {
            const angle = (i * Math.PI * 2) / cabinCount;
            const cx = Math.cos(angle) * 7.2;
            const cy = Math.sin(angle) * 7.2;
            const cabinColors = [
              '#ef4444',
              '#3b82f6',
              '#f59e0b',
              '#10b981',
              '#8b5cf6',
              '#ec4899',
              '#06b6d4',
              '#eab308',
            ];
            return (
              <group key={i}>
                {/* Nan hoa thép */}
                <mesh
                  position={[cx / 2, cy / 2, -0.6]}
                  rotation={[0, 0, angle + Math.PI / 2]}
                >
                  <cylinderGeometry args={[0.055, 0.055, 7.2, 8]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
                </mesh>
                <mesh
                  position={[cx / 2, cy / 2, 0.6]}
                  rotation={[0, 0, angle + Math.PI / 2]}
                >
                  <cylinderGeometry args={[0.055, 0.055, 7.2, 8]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
                </mesh>

                {/* Cabin hành khách (Counter-rotate để luôn thẳng đứng!) */}
                <group
                  position={[cx, cy, 0]}
                  ref={(el) => {
                    cabinRefs.current[i] = el;
                  }}
                >
                  {/* Trục treo cabin */}
                  <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                  </mesh>
                  {/* Mái vòm cabin */}
                  <mesh position={[0, -0.02, 0]} castShadow>
                    <cylinderGeometry args={[0.85, 0.95, 0.25, 16]} />
                    <meshStandardMaterial color={cabinColors[i]} roughness={0.3} />
                  </mesh>
                  {/* Khoang kính trong suốt Panorama */}
                  <mesh position={[0, -0.55, 0]}>
                    <cylinderGeometry args={[0.88, 0.82, 0.85, 16]} />
                    <meshStandardMaterial
                      color="#bae6fd"
                      transparent
                      opacity={0.72}
                      metalness={0.3}
                      roughness={0.1}
                    />
                  </mesh>
                  {/* Đáy cabin & Ghế ngồi */}
                  <mesh position={[0, -1.08, 0]} castShadow>
                    <cylinderGeometry args={[0.82, 0.72, 0.35, 16]} />
                    <meshStandardMaterial color={cabinColors[i]} roughness={0.35} />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      </group>

      {/* ================================================================= */}
      {/* KỲ QUAN 2: THÁP RƠI TỰ DO SKY DROP 22M (Tâm Z = 3.5 -> -10.5)     */}
      {/* ================================================================= */}
      <group
        position={[0, 0.08, 3.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('SKY_DROP');
        }}
      >
        {/* Bệ phóng bê tông cốt thép hình bát giác */}
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.6, 4.0, 0.6, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* 4 Cột thép giàn không gian cao 20m */}
        {[
          [-0.85, -0.85],
          [0.85, -0.85],
          [-0.85, 0.85],
          [0.85, 0.85],
        ].map(([tx, tz], idx) => (
          <mesh key={idx} position={[tx, 10.3, tz]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 20.0, 12]} />
            <meshStandardMaterial color="#dc2626" metalness={0.65} roughness={0.25} />
          </mesh>
        ))}

        {/* Các vòng đai thép giằng ngang mỗi 2.5m dọc thân tháp */}
        {[2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5].map((hy, idx) => (
          <mesh key={idx} position={[0, hy, 0]}>
            <boxGeometry args={[1.95, 0.22, 1.95]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* Đỉnh Tháp Vương Miện Phát Sáng ở độ cao 20.8m */}
        <mesh position={[0, 20.6, 0]} castShadow>
          <cylinderGeometry args={[2.2, 1.4, 1.4, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 21.8, 0]}>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.5} />
        </mesh>

        {/* Cụm Ghế Hành Khách Rơi Tự Do (Carriage) trượt dọc thân tháp */}
        <group ref={dropCarriageRef} position={[0, 1.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.85, 0.75, 2.85]} />
            <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Hàng ghế bảo hiểm màu đỏ phía trước */}
          {[-0.9, -0.3, 0.3, 0.9].map((sx, idx) => (
            <group key={idx} position={[sx, 0.1, 1.45]}>
              <mesh castShadow>
                <boxGeometry args={[0.46, 0.68, 0.42]} />
                <meshStandardMaterial color="#991b1b" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.15, 0.18]}>
                <torusGeometry args={[0.2, 0.04, 8, 12]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ================================================================= */}
      {/* KỲ QUAN 3: PHI THUYỀN VŨ TRỤ ASTRO ORBITER (Tâm Z = 17.5 -> +3.5) */}
      {/* ================================================================= */}
      <group
        position={[0, 0.08, 17.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRide?.('ROCKET_SPINNER');
        }}
      >
        {/* Sàn phóng Tàu Vũ Trụ */}
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.8, 5.2, 0.5, 32]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.8, 4.4, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.95} />
        </mesh>

        {/* Tháp điều khiển trung tâm & Quả cầu Thiên hà */}
        <mesh position={[0, 3.4, 0]} castShadow>
          <cylinderGeometry args={[0.65, 1.1, 6.2, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 7.0, 0]}>
          <sphereGeometry args={[1.05, 20, 20]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0369a1" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, 7.0, 0]} rotation={[0.5, 0.3, 0]}>
          <torusGeometry args={[1.65, 0.08, 10, 32]} />
          <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.9} />
        </mesh>

        {/* 4 Cần trục thủy lực & 4 Tàu Con Thoi Phản Lực (Space Shuttles) */}
        <group position={[0, 3.8, 0]} ref={rocketHubRef}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2;
            const radius = 4.2;
            const rx = Math.cos(angle) * radius;
            const rz = Math.sin(angle) * radius;
            const shuttleColors = ['#f43f5e', '#38bdf8', '#facc15', '#10b981'];
            return (
              <group key={i}>
                {/* Tay đòn thủy lực */}
                <mesh
                  position={[rx / 2, -0.2, rz / 2]}
                  rotation={[0, -angle, Math.PI / 2.15]}
                >
                  <cylinderGeometry args={[0.08, 0.1, 4.2, 10]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
                </mesh>

                {/* Thân Tàu Con Thoi Vũ Trụ */}
                <group position={[rx, 0, rz]} rotation={[0, -angle, 0]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.38, 0.45, 1.65, 16]} />
                    <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.25} />
                  </mesh>
                  {/* Mũi tên lửa */}
                  <mesh position={[0, 0, -1.1]} rotation={[-Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.38, 0.65, 16]} />
                    <meshStandardMaterial color={shuttleColors[i]} roughness={0.3} />
                  </mesh>
                  {/* Cánh Delta 2 bên */}
                  <mesh position={[0, -0.08, 0.15]} castShadow>
                    <boxGeometry args={[1.65, 0.08, 0.65]} />
                    <meshStandardMaterial color={shuttleColors[i]} roughness={0.3} />
                  </mesh>
                  {/* Kính buồng lái */}
                  <mesh position={[0, 0.28, -0.25]}>
                    <sphereGeometry args={[0.28, 12, 12]} />
                    <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.1} />
                  </mesh>
                  {/* Lửa phản lực Plasma phía đuôi */}
                  <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.28, 0.65, 12]} />
                    <meshStandardMaterial
                      color="#fde047"
                      emissive="#f97316"
                      emissiveIntensity={1.8}
                    />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}

/**
 * GIAO DIỆN QUẦY VÉ & TRẢI NGHIỆM TRÒ CHƠI CÔNG VIÊN (AMUSEMENT PARK HUD & TICKET MODAL)
 */
export function AmusementParkHud({
  isNearPark,
  activeRideId,
  rideTimeLeft,
  playerCoins,
  isTicketModalOpen,
  onOpenTicketModal,
  onCloseTicketModal,
  onPurchaseAndStartRide,
  onStopRideEarly,
  onRewardCarnivalQuiz,
}: {
  isNearPark: boolean;
  activeRideId: AmusementRideId | null;
  rideTimeLeft: number;
  playerCoins: number;
  isTicketModalOpen: boolean;
  onOpenTicketModal: () => void;
  onCloseTicketModal: () => void;
  onPurchaseAndStartRide: (ride: AmusementRideConfig) => void;
  onStopRideEarly: () => void;
  onRewardCarnivalQuiz?: (netCoins: number, exp: number, message: string) => void;
}) {
  const [carnivalQuizOpen, setCarnivalQuizOpen] = useState(false);
  const [quizItem, setQuizItem] = useState(() => pickNonRepeatingMultiSourceQuestion());
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

  const activeRide = useMemo(
    () => AMUSEMENT_RIDES.find((r) => r.id === activeRideId) || null,
    [activeRideId]
  );

  const handleStartCarnivalGame = () => {
    if (playerCoins < 20) return;
    setQuizItem(pickNonRepeatingMultiSourceQuestion({ excludeId: quizItem.id }));
    setSelectedOpt(null);
    setQuizResult(null);
    setCarnivalQuizOpen(true);
  };

  const handleAnswerCarnival = (idx: number) => {
    if (quizResult) return;
    setSelectedOpt(idx);
    const chosenOpt = quizItem.options[idx];
    const isCorrect =
      chosenOpt?.trim().toLowerCase() === quizItem.correctAnswer.trim().toLowerCase();
    setQuizResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      // Vé 20 Xu, trúng thưởng 85 Xu -> Lãi ròng +65 Xu & +90 EXP
      onRewardCarnivalQuiz?.(
        65,
        90,
        '🎯 Bắn trúng Hồng Tâm Carnival! Trúng thưởng +85 Xu (Lãi +65 Xu) & +90 EXP!'
      );
    } else {
      onRewardCarnivalQuiz?.(
        -20,
        20,
        '🎪 Trượt mất rồi (-20 Xu vé Carnival), nhận +20 EXP khuyến khích!'
      );
    }
  };

  return (
    <>
      {/* 1. THANH ĐIỀU KHIỂN KHI ĐANG NGỒI TRÊN TRÒ CHƠI 3D */}
      {activeRide && (
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            top: 82,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            px: 3,
            py: 1.5,
            borderRadius: '20px',
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(14px)',
            border: `2px solid ${activeRide.badgeColor}`,
            boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            minWidth: { xs: 320, sm: 500 },
          }}
        >
          <Box sx={{ fontSize: '30px' }}>{activeRide.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem' }}>
                Đang chơi: {activeRide.name}
              </Typography>
              <Chip
                size="small"
                label={`⏱️ ${rideTimeLeft}s`}
                sx={{
                  bgcolor: activeRide.badgeColor,
                  color: '#fff',
                  fontWeight: 900,
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={(rideTimeLeft / activeRide.durationSec) * 100}
              sx={{
                height: 7,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.15)',
                '& .MuiLinearProgress-bar': { bgcolor: activeRide.badgeColor },
              }}
            />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5 }}>
              💡 Giữ chuột phải kéo để xoay Camera 360° ngắm cảnh từ trên trò chơi!
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={onStopRideEarly}
            sx={{ borderRadius: '999px', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Xuống Ngay
          </Button>
        </Paper>
      )}

      {/* 2. NÚT NỔI MỞ QUẦY VÉ KHI ĐỨNG GẦN KHU VUI CHƠI */}
      {isNearPark && !activeRide && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            bottom: 92,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            px: 2.5,
            py: 1.2,
            borderRadius: '999px',
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #f59e0b',
            boxShadow: '0 12px 32px rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Chip
            label={`💰 ${playerCoins} Xu`}
            sx={{ bgcolor: 'rgba(250, 204, 21, 0.18)', color: '#fde047', fontWeight: 900 }}
          />
          <Button
            variant="contained"
            startIcon={<ConfirmationNumberRoundedIcon />}
            onClick={onOpenTicketModal}
            sx={{
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              fontWeight: 900,
              textTransform: 'none',
              px: 2.5,
            }}
          >
            🎟️ Mua Vé Trò Chơi Công Viên (20–45 Xu)
          </Button>
          <Button
            variant="outlined"
            startIcon={<CelebrationRoundedIcon />}
            onClick={handleStartCarnivalGame}
            sx={{
              borderRadius: '999px',
              borderColor: '#fde047',
              color: '#fde047',
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            🎯 Săn Thưởng Carnival (20 Xu)
          </Button>
        </Paper>
      )}

      {/* 3. MODAL DANH SÁCH VÉ TRÒ CHƠI 3D */}
      <Dialog
        open={isTicketModalOpen}
        onClose={onCloseTicketModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '24px',
            border: '2px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AttractionsRoundedIcon sx={{ color: '#ec4899', fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#fff' }}>
                🎡 QUẦY VÉ ĐẠI CÔNG VIÊN WONDERLAND & SMILE PARK
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Mua vé bằng Xu để nhân vật 3D của bạn trực tiếp lên ngồi trải nghiệm các trò chơi!
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`💰 Ví của bạn: ${playerCoins} Xu`}
              sx={{
                bgcolor: 'rgba(250, 204, 21, 0.16)',
                color: '#fde047',
                fontWeight: 900,
                border: '1px solid rgba(250, 204, 21, 0.4)',
              }}
            />
            <IconButton onClick={onCloseTicketModal} sx={{ color: '#94a3b8' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {AMUSEMENT_RIDES.map((ride) => {
              const canAfford = playerCoins >= ride.ticketCost;
              return (
                <Paper
                  key={ride.id}
                  sx={{
                    p: 2.2,
                    borderRadius: '18px',
                    bgcolor: 'rgba(30, 41, 59, 0.78)',
                    border: `1.5px solid ${ride.badgeColor}55`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: ride.badgeColor,
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.8rem' }}>{ride.icon}</Typography>
                        <Box>
                          <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '0.96rem' }}>
                            {ride.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {ride.englishName}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        label={ride.thrillLevel}
                        sx={{
                          bgcolor: `${ride.badgeColor}22`,
                          color: ride.badgeColor,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    <Typography sx={{ fontSize: '0.82rem', color: '#cbd5e1', mb: 1.5 }}>
                      {ride.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={`🎟️ Giá vé: ${ride.ticketCost} Xu`}
                        sx={{
                          bgcolor: 'rgba(250, 204, 21, 0.16)',
                          color: '#fde047',
                          fontWeight: 900,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`✨ +${ride.expReward} EXP`}
                        sx={{
                          bgcolor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontWeight: 800,
                        }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      disabled={!canAfford}
                      onClick={() => onPurchaseAndStartRide(ride)}
                      sx={{
                        borderRadius: '999px',
                        bgcolor: ride.badgeColor,
                        fontWeight: 900,
                        textTransform: 'none',
                        '&:hover': { bgcolor: ride.badgeColor, filter: 'brightness(1.12)' },
                      }}
                    >
                      {canAfford ? 'Mua Vé & Chơi' : 'Không đủ Xu'}
                    </Button>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {/* Khu vực Minigame Săn Thưởng Carnival */}
          <Paper
            sx={{
              mt: 2.5,
              p: 2.2,
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(236,72,153,0.18))',
              border: '1.5px solid rgba(250, 204, 21, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#fde047', fontSize: '1rem' }}>
                🎯 Quầy Bắn Bóng Tiếng Anh Carnival (Vé: 20 Xu • Trúng thưởng: +85 Xu & +90 EXP)
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                Thử tài phản xạ Tiếng Anh tại lều xiếc lễ hội để nhân более 4 lần số Xu vé cược!
              </Typography>
            </Box>
            <Button
              variant="contained"
              disabled={playerCoins < 20}
              onClick={() => {
                onCloseTicketModal();
                handleStartCarnivalGame();
              }}
              sx={{
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                fontWeight: 900,
                textTransform: 'none',
              }}
            >
              🎪 Chơi Carnival (20 Xu)
            </Button>
          </Paper>
        </DialogContent>
      </Dialog>

      {/* 4. MODAL SĂN THƯỞNG CARNIVAL (20 XU) */}
      <Dialog
        open={carnivalQuizOpen}
        onClose={() => setCarnivalQuizOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            color: '#fff',
            borderRadius: '22px',
            border: '2px solid #f59e0b',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🎯 SĂN THƯỞNG CARNIVAL • VÉ 20 XU</span>
          <IconButton onClick={() => setCarnivalQuizOpen(false)} sx={{ color: '#94a3b8' }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Chip
            size="small"
            label={`${ENGLISH_DATABASE_SOURCES[quizItem.sourceId]?.shortBadge || '📘 English'} • CEFR ${quizItem.cefr}`}
            sx={{ mb: 1.5, bgcolor: 'rgba(245,158,11,0.2)', color: '#fde047', fontWeight: 800 }}
          />
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 2 }}>
            {quizItem.promptEn}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {quizItem.options.map((opt: string, idx: number) => {
              const isSelected = selectedOpt === idx;
              const isRight =
                opt.trim().toLowerCase() === quizItem.correctAnswer.trim().toLowerCase();
              let borderColor = 'rgba(148,163,184,0.3)';
              let bg = 'rgba(30,41,59,0.8)';
              if (quizResult) {
                if (isRight) {
                  borderColor = '#22c55e';
                  bg = 'rgba(34,197,94,0.2)';
                } else if (isSelected) {
                  borderColor = '#ef4444';
                  bg = 'rgba(239,68,68,0.2)';
                }
              }
              return (
                <Button
                  key={idx}
                  onClick={() => handleAnswerCarnival(idx)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    p: 1.5,
                    borderRadius: '12px',
                    border: `1.5px solid ${borderColor}`,
                    bgcolor: bg,
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </Button>
              );
            })}
          </Box>
          {quizResult && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography sx={{ fontWeight: 800, color: quizResult === 'correct' ? '#4ade80' : '#f87171' }}>
                {quizResult === 'correct'
                  ? '🎉 Chính xác! Bạn nhận thưởng +85 Xu (Lãi +65 Xu) & +90 EXP!'
                  : '💡 Chưa chính xác! Bạn đã mất 20 Xu tiền vé.'}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#cbd5e1', mt: 0.5 }}>
                Giải thích: {quizItem.explanationVi}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={playerCoins < 20}
                  onClick={handleStartCarnivalGame}
                  sx={{ borderRadius: '999px', bgcolor: '#f59e0b', fontWeight: 800 }}
                >
                  Chơi Tiếp (20 Xu)
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
