'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from './SafeHtml';
import { KeyPromptBadge } from './KeyPromptBadge';
import PlayerPhysics from './PlayerPhysics';
import {
  HouseFurnitureItem3D,
  useWarmWoodParquetTexture,
  useBathroomTileTexture,
  type HouseFurnitureRenderItem,
} from './PlayTogetherPlaza';
import {
  CITY_SHOPS_DATA,
  FURNITURE_CATALOG,
  type ShopVenueId,
  type WorkCustomerScenario,
  type AvatarTopStyle,
  type AvatarHatStyle,
  type AvatarAccessoryStyle,
} from '@/data/worldGameplayData';
import confetti from 'canvas-confetti';
import { FashionAvatar } from './FashionAvatar';
import { getLocalPlayerPosition } from '@/stores/useMultiplayerStore';
import { Classroom3DScene, type ClassroomQuizState } from './ClassroomQuizSystem';
import { Cinema3DScene } from './CinemaTheaterSystem';

export type ActiveInteriorSpace =
  | {
      kind: 'HOUSE';
      plotCode: string;
      ownerName: string;
      houseTitle: string;
      plotLabel: string;
      isMyHouse: boolean;
      wallColor: string;
      roofColor: string;
      returnPosition: [number, number, number];
    }
  | {
      kind: 'SHOP';
      shopId: ShopVenueId;
      returnPosition: [number, number, number];
    }
  | {
      kind: 'SCHOOL';
      returnPosition: [number, number, number];
    }
  | {
      kind: 'CINEMA';
      returnPosition: [number, number, number];
    };

// Vị trí bàn ghế khách ngồi thưởng thức tại từng quán
const SHOP_SEATING_TABLES: Record<ShopVenueId, Array<{ x: number; z: number }>> = {
  CAFE: [
    { x: -10.5, z: 1.5 },
    { x: -5.0, z: 1.5 },
    { x: 0.5, z: 1.5 },
    { x: -10.5, z: 6.2 },
    { x: -5.0, z: 6.2 },
    { x: 8.5, z: 5.0 },
  ],
  DINER: [
    { x: -10.0, z: 2.0 },
    { x: -4.2, z: 2.0 },
    { x: -10.0, z: 6.8 },
    { x: 8.5, z: 5.2 },
  ],
  CLOTHING: [
    { x: -10.2, z: 6.5 },
    { x: -3.5, z: 6.5 },
    { x: 3.5, z: 6.5 },
    { x: 8.5, z: 4.5 },
  ],
  CAR_SHOWROOM: [
    { x: -7.0, z: 6.5 },
    { x: 0, z: 6.5 },
    { x: 7.0, z: 6.5 },
  ],
};

interface SeatedPatron {
  id: string;
  name: string;
  shirtColor: string;
  tablePos: { x: number; z: number };
  startX: number;
  startZ: number;
  walkProgress: number;
  state: 'WALKING_TO_TABLE' | 'SEATED' | 'LEAVING';
  seatedUntil: number;
  leaveProgress: number;
}

interface InteriorSpaceSceneProps {
  interior: ActiveInteriorSpace;
  houseFurnitureList: HouseFurnitureRenderItem[];
  selectedFurnitureIndex: number | null;
  onSelectFurnitureIndex: (idx: number | null) => void;
  onMoveSelectedFurnitureToGrid: (gridX: number, gridZ: number) => void;
  onOpenHouseShopModal: () => void;
  onOpenShopBuyModal: () => void;
  onOpenShopWorkModal: () => void;
  isWorkingAsStaff: boolean;
  onToggleWorkingAsStaff: (working: boolean) => void;
  activeWorkScenario: WorkCustomerScenario | null;
  onExitInterior: () => void;
  onInteriorZoneChange: (zone: 'BUY' | 'WORK' | null) => void;
  outfitColor: string;
  hatColor: string;
  pantsColor?: string;
  shoeColor?: string;
  hairColor?: string;
  avatarStyle?: AvatarTopStyle;
  hatStyle?: AvatarHatStyle;
  accessory?: AvatarAccessoryStyle;
  currentEmote: string | null;
  teleportTarget: { x: number; z: number; id: number } | null;
  cameraOrbitAngle?: number;
  onAwardQuizReward?: (coins: number, exp: number, rankTitle: string) => void;
  classroomQuizState?: ClassroomQuizState;
  isCinemaLightsDimmed?: boolean;
  hasCinemaTicket?: boolean;
  onOpenCinemaTicketBox?: () => void;
}

function playQuizChime(isTop1: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = isTop1 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.32);
    });
  } catch {}
}

export default function InteriorSpaceScene({
  interior,
  houseFurnitureList,
  selectedFurnitureIndex,
  onSelectFurnitureIndex,
  onMoveSelectedFurnitureToGrid,
  onOpenHouseShopModal,
  onOpenShopBuyModal,
  onOpenShopWorkModal,
  isWorkingAsStaff,
  onToggleWorkingAsStaff,
  activeWorkScenario,
  onExitInterior,
  onInteriorZoneChange,
  outfitColor,
  hatColor,
  pantsColor,
  shoeColor,
  hairColor,
  avatarStyle,
  hatStyle,
  accessory,
  currentEmote,
  cameraOrbitAngle = Math.PI / 4,
  onAwardQuizReward,
  classroomQuizState,
  isCinemaLightsDimmed = false,
  hasCinemaTicket = false,
  onOpenCinemaTicketBox,
}: InteriorSpaceSceneProps) {
  const isHouse = interior.kind === 'HOUSE';
  const isSchool = interior.kind === 'SCHOOL';
  const isCinema = interior.kind === 'CINEMA';
  const shopData = interior.kind === 'SHOP' ? CITY_SHOPS_DATA[interior.shopId] : null;
  const woodFloorTex = useWarmWoodParquetTexture(10, 8);
  const bathroomTileTex = useBathroomTileTexture(6, 6);

  // Tự động chuẩn hóa bố cục mặc định cũ sang thiết kế 3 phòng hợp lý (Khách - Ngủ - Vệ Sinh)
  const organizedHouseFurniture = useMemo(() => {
    const hasLegacyBed = houseFurnitureList.some(
      (i) => i.maVatPham === 'GIUONG_GO_DON' && ((i.toaDoLuoiX === 2 && i.toaDoLuoiZ === 2) || (i.toaDoLuoiX === 8 && i.toaDoLuoiZ === 7))
    );
    const hasLegacyTv = houseFurnitureList.some(
      (i) => i.maVatPham === 'KE_TIVI_CO_DIEN' && ((i.toaDoLuoiX === 7 && i.toaDoLuoiZ === 6) || (i.toaDoLuoiX === 2 && i.toaDoLuoiZ === 8))
    );
    if (!hasLegacyBed && !hasLegacyTv) return houseFurnitureList;

    const mappedDefaults: Record<string, { x: number; z: number; rot: number }> = {
      GIUONG_GO_DON: { x: 8, z: 0, rot: 180 },
      BAN_HOC_DEN_LED: { x: 2, z: 0, rot: 0 },
      KE_SACH_OXFORD: { x: 3, z: 0, rot: 0 },
      SOFA_GO_PHONG_KHACH: { x: 1, z: 6, rot: 0 },
      KE_TIVI_CO_DIEN: { x: 3, z: 6, rot: 270 },
      THAM_DET_THO_CAM: { x: 2, z: 6, rot: 0 },
    };

    return houseFurnitureList.map((item) => {
      const target = mappedDefaults[item.maVatPham];
      if (!target) return item;
      return {
        ...item,
        toaDoLuoiX: target.x,
        toaDoLuoiZ: target.z,
        gocXoayDo: target.rot,
      };
    });
  }, [houseFurnitureList]);

  // Khoảng cách tương tác thời gian thực với các trạm trong phòng
  const [distBuyCounter, setDistBuyCounter] = useState(999);
  const [distStaffCounter, setDistStaffCounter] = useState(999);
  const [distHouseShop, setDistHouseShop] = useState(999);
  const [nearestMannequinIdx, setNearestMannequinIdx] = useState<number | null>(null);
  const [nearestCarIdx, setNearestCarIdx] = useState<number | null>(null);

  // Khách hàng hiện tại đang đi vào hoặc đang ở quầy để order
  const [counterCustomer, setCounterCustomer] = useState<{
    scenario: WorkCustomerScenario;
    step: 'WALKING_IN' | 'AT_COUNTER';
    progress: number;
  } | null>(null);

  // Danh sách các vị khách đã mua xong và đang ngồi lại quán thưởng thức đồ uống/món ăn
  const [seatedPatrons, setSeatedPatrons] = useState<SeatedPatron[]>([]);

  // Timer ngẫu nhiên đón khách tiếp theo khi người chơi đang làm việc
  const nextCustomerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isWaitingNextRef = useRef<boolean>(false);
  const lastScenarioIdRef = useRef<string>('');

  // Màu sàn & tường tùy theo không gian Nhà, Trường học, Rạp phim hoặc Quán
  const floorColor = useMemo(() => {
    if (interior.kind === 'HOUSE') return '#fdf8f0';
    if (interior.kind === 'SCHOOL') return '#c28b58';
    if (interior.kind === 'CINEMA') return '#090d16';
    switch (interior.shopId) {
      case 'CAFE':
        return '#d6b892';
      case 'DINER':
        return '#f1f5f9';
      case 'CLOTHING':
        return '#fdf2f8';
      case 'CAR_SHOWROOM':
        return '#1e293b';
    }
  }, [interior]);

  const wallColor = useMemo(() => {
    if (interior.kind === 'HOUSE') return interior.wallColor || '#f5ebd6';
    if (interior.kind === 'SCHOOL') return '#fef3c7';
    if (interior.kind === 'CINEMA') return '#1e1b4b';
    switch (interior.shopId) {
      case 'CAFE':
        return '#78350f';
      case 'DINER':
        return '#991b1b';
      case 'CLOTHING':
        return '#701a75';
      case 'CAR_SHOWROOM':
        return '#0f172a';
    }
  }, [interior]);

  // Điều phối khách hàng NPC tự động khi người chơi nhận ca làm nhân viên
  useEffect(() => {
    if (!isWorkingAsStaff || !activeWorkScenario || interior.kind !== 'SHOP') {
      setCounterCustomer(null);
      isWaitingNextRef.current = false;
      if (nextCustomerTimerRef.current) clearTimeout(nextCustomerTimerRef.current);
      return;
    }

    // Khi có ca làm mới hoặc sau khi phục vụ khách trước
    if (lastScenarioIdRef.current !== activeWorkScenario.id) {
      // Nếu khách trước đó vừa được phục vụ xong -> Đưa khách ra bàn ngồi uống cafe / ăn uống
      if (lastScenarioIdRef.current && counterCustomer) {
        const availableTables = SHOP_SEATING_TABLES[interior.shopId];
        const occupied = new Set(seatedPatrons.map((p) => `${p.tablePos.x},${p.tablePos.z}`));
        const freeTable =
          availableTables.find((t) => !occupied.has(`${t.x},${t.z}`)) ||
          availableTables[Math.floor(Math.random() * availableTables.length)];

        const servedPatron: SeatedPatron = {
          id: `patron_${Date.now()}_${Math.random()}`,
          name: counterCustomer.scenario.customerName,
          shirtColor:
            counterCustomer.scenario.difficulty === 'hard'
              ? '#ec4899'
              : counterCustomer.scenario.difficulty === 'medium'
                ? '#f59e0b'
                : '#10b981',
          tablePos: freeTable,
          startX: 6.0,
          startZ: -3.8,
          walkProgress: 0,
          state: 'WALKING_TO_TABLE',
          seatedUntil: Date.now() + (22000 + Math.random() * 12000), // Ngồi thưởng thức 22 - 34 giây
          leaveProgress: 0,
        };

        setSeatedPatrons((prev) => [...prev.slice(-5), servedPatron]);
      }

      lastScenarioIdRef.current = activeWorkScenario.id;
      setCounterCustomer(null);
      isWaitingNextRef.current = true;

      // Random thời gian khách tiếp theo bước vào (4s đến 8.5s)
      const randomWait = 4000 + Math.random() * 4500;
      if (nextCustomerTimerRef.current) clearTimeout(nextCustomerTimerRef.current);
      nextCustomerTimerRef.current = setTimeout(() => {
        isWaitingNextRef.current = false;
        setCounterCustomer({
          scenario: activeWorkScenario,
          step: 'WALKING_IN',
          progress: 0,
        });
      }, randomWait);
    }

    return () => {
      if (nextCustomerTimerRef.current) clearTimeout(nextCustomerTimerRef.current);
    };
  }, [isWorkingAsStaff, activeWorkScenario, interior.kind]);

  // Cập nhật vị trí di chuyển và khoảng cách kiểm tra mỗi frame
  useFrame((_, delta) => {
    const p = getLocalPlayerPosition();

    // 1. Khoảng cách tới các trạm chính
    const dBuy = Math.hypot(p.x - -7.5, p.z - -3.2);
    setDistBuyCounter(dBuy);

    const dStaff = Math.hypot(p.x - 8.0, p.z - -3.5);
    setDistStaffCounter(dStaff);

    if (interior.kind === 'HOUSE') {
      const dH = Math.hypot(p.x - -13.2, p.z - -9.8);
      setDistHouseShop(dH);
    }

    // 2. Khoảng cách tới Mannequin thời trang trong Quán Quần Áo
    if (interior.kind === 'SHOP' && interior.shopId === 'CLOTHING') {
      const mannequins = [
        { x: -10.2, z: 3.2 },
        { x: -3.5, z: 3.2 },
        { x: 3.5, z: 3.2 },
        { x: 10.2, z: 3.2 },
      ];
      let nearestIdx: number | null = null;
      let minD = 2.6;
      mannequins.forEach((m, idx) => {
        const d = Math.hypot(p.x - m.x, p.z - m.z);
        if (d < minD) {
          minD = d;
          nearestIdx = idx;
        }
      });
      setNearestMannequinIdx(nearestIdx);
    }

    // 3. Khoảng cách tới Siêu Xe trong Showroom
    if (interior.kind === 'SHOP' && interior.shopId === 'CAR_SHOWROOM') {
      const cars = [
        { x: -10.5, z: 3.5 },
        { x: -3.6, z: 3.5 },
        { x: 3.6, z: 3.5 },
        { x: 10.5, z: 3.5 },
      ];
      let nearestCar: number | null = null;
      let minD = 3.0;
      cars.forEach((c, idx) => {
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d < minD) {
          minD = d;
          nearestCar = idx;
        }
      });
      setNearestCarIdx(nearestCar);
    }

    // 4. Di chuyển khách hàng NPC từ cửa vào quầy (WALKING_IN)
    if (counterCustomer && counterCustomer.step === 'WALKING_IN') {
      const nextProgress = Math.min(1.0, counterCustomer.progress + delta * 0.35);
      if (nextProgress >= 1.0) {
        setCounterCustomer({
          ...counterCustomer,
          step: 'AT_COUNTER',
          progress: 1.0,
        });
      } else {
        setCounterCustomer({
          ...counterCustomer,
          progress: nextProgress,
        });
      }
    }

    // 5. Cập nhật trạng thái các vị khách đang ngồi tại bàn (Seated Patrons)
    if (seatedPatrons.length > 0) {
      const now = Date.now();
      setSeatedPatrons((prev: SeatedPatron[]): SeatedPatron[] =>
        prev
          .map((patron): SeatedPatron => {
            if (patron.state === 'WALKING_TO_TABLE') {
              const nextP = Math.min(1.0, patron.walkProgress + delta * 0.4);
              const nextState: 'WALKING_TO_TABLE' | 'SEATED' =
                nextP >= 1.0 ? 'SEATED' : 'WALKING_TO_TABLE';
              return {
                ...patron,
                walkProgress: nextP,
                state: nextState,
              };
            }
            if (patron.state === 'SEATED') {
              if (now >= patron.seatedUntil) {
                return { ...patron, state: 'LEAVING', leaveProgress: 0 };
              }
              return patron;
            }
            if (patron.state === 'LEAVING') {
              const nextLeave = patron.leaveProgress + delta * 0.35;
              return {
                ...patron,
                leaveProgress: nextLeave,
              };
            }
            return patron;
          })
          .filter((p) => p.leaveProgress < 1.0)
      );
    }
  });

  return (
    <>
      {/* ================================================================= */}
      {/* 1. MẶT SÀN, TƯỜNG & KHÔNG GIAN ĐẠI SẢNH (32m x 26m)                */}
      {/* ================================================================= */}
      <color attach="background" args={[isCinema ? '#020617' : '#0b132b']} />
      <ambientLight intensity={isCinema && isCinemaLightsDimmed ? 0.55 : 1.6} />
      <directionalLight
        position={[20, 35, 18]}
        intensity={isCinema && isCinemaLightsDimmed ? 0.65 : 2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight
        position={[0, 8, 0]}
        intensity={isCinema && isCinemaLightsDimmed ? 0.45 : 1.8}
        distance={45}
        color="#fef08a"
      />
      <pointLight
        position={[-8, 7, -5]}
        intensity={isCinema && isCinemaLightsDimmed ? 0.35 : 1.2}
        distance={30}
        color="#fed7aa"
      />
      <pointLight
        position={[8, 7, -5]}
        intensity={isCinema && isCinemaLightsDimmed ? 0.35 : 1.2}
        distance={30}
        color="#e0e7ff"
      />

      {/* Mặt sàn chính của căn phòng */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.15, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[32.0, 0.3, 26.0]} />
          <meshStandardMaterial
            map={isHouse ? woodFloorTex || undefined : undefined}
            color={isHouse ? '#ffffff' : floorColor}
            roughness={isHouse ? 0.42 : 0.3}
            metalness={isHouse ? 0.04 : 0.08}
          />
        </mesh>
      </RigidBody>

      {/* Thảm Cửa Thoát ra ngoài Thành Phố */}
      <mesh position={[0, 0.04, 11.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 2.2]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.65} />
      </mesh>
      {!isSchool && !isCinema && (
        <KeyPromptBadge
          keyLabel="E"
          position={[0, 0.6, 11.4]}
          color="#34d399"
          onClick={onExitInterior}
        />
      )}

      {/* 4 Bức tường: Trong Lớp Học / Rạp Phim tường Đông & Tây đối xứng cao 6.2m */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.1, -12.85]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[32.0, 6.2, 0.5]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-15.85, 3.1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 6.2, 26.0]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[15.85, isSchool || isCinema ? 3.1 : 0.6, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, isSchool || isCinema ? 6.2 : 1.2, 26.0]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-10.5, 0.6, 12.85]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[11.0, 1.2, 0.5]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[10.5, 0.6, 12.85]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[11.0, 1.2, 0.5]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* ================================================================= */}
      {/* 2A. TRONG NHÀ CẤP 4: CĂN HỘ 3 PHÒNG (KHÁCH - NGỦ - VỆ SINH)       */}
      {/* ================================================================= */}
      {isHouse && (
        <group>
          {/* Phào chỉ chân tường (Baseboards) viền quanh tường */}
          <mesh position={[0, 0.14, -12.56]}>
            <boxGeometry args={[31.4, 0.28, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh position={[-15.56, 0.14, 0]}>
            <boxGeometry args={[0.08, 0.28, 25.4]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* --------------------------------------------------------------- */}
          {/* VÁCH NGĂN CHIA 3 PHÒNG CÓ COLLIDER VẬT LÝ & CỬA THÔNG THOÁNG    */}
          {/* --------------------------------------------------------------- */}
          {/* 1. Vách dọc ngăn Phòng Khách <-> Phòng Ngủ (X = 3.6, chừa cửa Z = -6.5..-2.0) */}
          <RigidBody type="fixed" colliders="cuboid" position={[3.6, 2.2, -9.55]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.32, 4.4, 6.1]} />
              <meshStandardMaterial color={wallColor} roughness={0.5} />
            </mesh>
          </RigidBody>
          <RigidBody type="fixed" colliders="cuboid" position={[3.6, 2.2, -0.75]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.32, 4.4, 2.5]} />
              <meshStandardMaterial color={wallColor} roughness={0.5} />
            </mesh>
          </RigidBody>
          {/* Thanh đà gỗ phía trên cửa Phòng Ngủ */}
          <mesh position={[3.6, 4.05, -4.25]} castShadow>
            <boxGeometry args={[0.36, 0.7, 4.5]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>

          {/* 2. Vách ngang ngăn Phòng Ngủ <-> Phòng Vệ Sinh (Z = 0.5, X = 3.6..15.6) */}
          <RigidBody type="fixed" colliders="cuboid" position={[9.6, 1.4, 0.5]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[12.0, 2.8, 0.32]} />
              <meshStandardMaterial color={wallColor} roughness={0.5} />
            </mesh>
          </RigidBody>

          {/* 3. Vách dọc ngăn Phòng Khách <-> Phòng Vệ Sinh (X = 3.6, chừa cửa Z = 4.2..8.2) */}
          <RigidBody type="fixed" colliders="cuboid" position={[3.6, 1.4, 2.35]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.32, 2.8, 3.7]} />
              <meshStandardMaterial color={wallColor} roughness={0.5} />
            </mesh>
          </RigidBody>
          <RigidBody type="fixed" colliders="cuboid" position={[3.6, 1.4, 10.4]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.32, 2.8, 4.4]} />
              <meshStandardMaterial color={wallColor} roughness={0.5} />
            </mesh>
          </RigidBody>
          {/* Khung cửa gỗ vào Phòng Vệ Sinh */}
          <mesh position={[3.6, 2.65, 6.2]}>
            <boxGeometry args={[0.36, 0.3, 4.0]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>
          {/* Thảm chùi chân trước cửa Phòng Vệ Sinh */}
          <mesh position={[3.0, 0.02, 6.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.1, 2.2]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.85} />
          </mesh>

          {/* --------------------------------------------------------------- */}
          {/* KHU VỰC 1: PHÒNG KHÁCH & GÓC HỌC TẬP (TRÁI)                    */}
          {/* --------------------------------------------------------------- */}
          {/* Cửa sổ Panorama lớn có khung đen & rèm voan bên tường trái */}
          <group position={[-15.55, 3.3, -1.5]}>
            <mesh>
              <boxGeometry args={[0.14, 4.0, 9.6]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.04, 3.7, 9.2]} />
              <meshStandardMaterial
                color="#bae6fd"
                emissive="#7dd3fc"
                emissiveIntensity={0.45}
                roughness={0.1}
              />
            </mesh>
            {[-3.0, 0, 3.0].map((zOff, idx) => (
              <mesh key={idx} position={[0.08, 0, zOff]}>
                <boxGeometry args={[0.08, 3.7, 0.1]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            ))}
            <mesh position={[0.18, -0.1, -4.4]}>
              <boxGeometry args={[0.25, 4.3, 1.1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
            <mesh position={[0.18, -0.1, 4.4]}>
              <boxGeometry args={[0.25, 4.3, 1.1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
          </group>

          {/* Bộ 3 Tranh Nghệ Thuật Canvas Bắc Âu treo tường sau Phòng Khách */}
          {[
            { x: -8.5, bg: '#fef3c7', art: '#d97706' },
            { x: -5.8, bg: '#e0f2fe', art: '#0284c7' },
            { x: -3.1, bg: '#fce7f3', art: '#db2777' },
          ].map((pic, idx) => (
            <group key={idx} position={[pic.x, 3.4, -12.54]}>
              <mesh castShadow>
                <boxGeometry args={[2.1, 2.7, 0.08]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <planeGeometry args={[1.85, 2.45]} />
                <meshStandardMaterial color={pic.bg} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.1, 0.06]}>
                <circleGeometry args={[0.55, 24]} />
                <meshStandardMaterial color={pic.art} roughness={0.7} />
              </mesh>
            </group>
          ))}

          {/* --------------------------------------------------------------- */}
          {/* KHU VỰC 2: PHÒNG NGỦ MASTER (GÓC PHẢI TRÊN: X=3.6..15.6, Z=-12.6..0.5) */}
          {/* --------------------------------------------------------------- */}
          {/* Vách lam gỗ trang trí đầu giường Phòng Ngủ */}
          <group position={[9.6, 3.0, -12.54]}>
            <mesh>
              <boxGeometry args={[9.2, 5.4, 0.08]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {Array.from({ length: 18 }).map((_, sIdx) => (
              <mesh key={sIdx} position={[-4.25 + sIdx * 0.5, 0, 0.05]}>
                <boxGeometry args={[0.16, 5.3, 0.06]} />
                <meshStandardMaterial color="#b45309" roughness={0.5} />
              </mesh>
            ))}
          </group>
          {/* Thảm Phòng Ngủ êm ái dưới khu vực giường */}
          <mesh position={[8.6, 0.015, -6.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[7.5, 6.2]} />
            <meshStandardMaterial color="#e7e5e4" roughness={0.92} />
          </mesh>
          {/* Tủ quần áo gỗ sồi cánh kính đặt gọn sát tường phải Phòng Ngủ */}
          <group position={[14.3, 0, -2.5]}>
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.6, 3.0, 3.4]} />
              <meshStandardMaterial color="#5c2d0c" roughness={0.45} />
            </mesh>
            <mesh position={[-0.82, 1.5, -0.8]}>
              <boxGeometry args={[0.04, 2.7, 1.5]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.55} emissive="#fbbf24" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.82, 1.5, 0.8]}>
              <boxGeometry args={[0.04, 2.7, 1.5]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.55} emissive="#fbbf24" emissiveIntensity={0.2} />
            </mesh>
          </group>

          {/* --------------------------------------------------------------- */}
          {/* KHU VỰC 3: PHÒNG VỆ SINH / PHÒNG TẮM (GÓC PHẢI DƯỚI: X=3.6..15.6, Z=0.5..12.6) */}
          {/* --------------------------------------------------------------- */}
          {/* Sàn gạch men Ceramic phòng tắm */}
          <mesh position={[9.65, 0.02, 6.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[11.9, 11.9]} />
            <meshStandardMaterial
              map={bathroomTileTex || undefined}
              color="#ffffff"
              roughness={0.25}
              metalness={0.05}
            />
          </mesh>

          {/* 3.1. Bồn Tắm Nằm Oval Sang Trọng (góc phải dưới) */}
          <group position={[12.2, 0, 9.2]}>
            {/* Thân bồn tắm sứ trắng */}
            <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.8, 0.96, 2.1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.05} />
            </mesh>
            {/* Lòng bồn tắm chứa nước xanh ngọc trong veo */}
            <mesh position={[0, 0.94, 0]}>
              <boxGeometry args={[3.35, 0.08, 1.68]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={0.25}
                transparent
                opacity={0.78}
                roughness={0.08}
              />
            </mesh>
            {/* Vòi sen cây đứng mạ Chrome */}
            <mesh position={[1.7, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 2.2, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[1.45, 2.15, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {/* Thảm lau chân cạnh bồn tắm */}
            <mesh position={[0, 0.035, -1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[2.6, 1.0]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.95} />
            </mesh>
          </group>

          {/* 3.2. Cabin Tắm Đứng Vách Kính Cường Lực */}
          <group position={[5.8, 0, 10.4]}>
            {/* Đế khay tắm chống trượt */}
            <mesh position={[0, 0.08, 0]} receiveShadow>
              <boxGeometry args={[2.8, 0.14, 2.8]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
            {/* Vách kính cường lực trong suốt khung đen */}
            <mesh position={[1.38, 1.35, 0]}>
              <boxGeometry args={[0.06, 2.5, 2.8]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.32} roughness={0.08} />
            </mesh>
            <mesh position={[0, 1.35, -1.38]}>
              <boxGeometry args={[2.8, 2.5, 0.06]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.32} roughness={0.08} />
            </mesh>
            {/* Sen cây Rain Shower gắn tường */}
            <mesh position={[-1.1, 1.3, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh position={[-0.75, 2.45, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>

          {/* 3.3. Bồn Cầu Thông Minh Smart Toilet (sát tường trên nhà tắm) */}
          <group position={[13.4, 0, 1.9]}>
            {/* Két nước âm */}
            <mesh position={[0, 0.68, -0.55]} castShadow>
              <boxGeometry args={[0.92, 1.32, 0.36]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.18} />
            </mesh>
            {/* Thân bồn cầu sứ trắng */}
            <mesh position={[0, 0.36, 0.05]} castShadow>
              <cylinderGeometry args={[0.38, 0.32, 0.72, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.15} />
            </mesh>
            {/* Nắp bồn cầu */}
            <mesh position={[0, 0.74, 0.08]} castShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.06, 16]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.15} />
            </mesh>
            {/* Giá giấy vệ sinh bên cạnh */}
            <mesh position={[-0.75, 0.75, -0.4]}>
              <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>

          {/* 3.4. Tủ Lavabo Rửa Mặt & Gương Tròn Đèn LED */}
          <group position={[9.2, 0, 1.75]}>
            {/* Tủ gỗ chống ẩm */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.95, 1.15]} />
              <meshStandardMaterial color="#78350f" roughness={0.45} />
            </mesh>
            {/* Mặt đá Marble trắng */}
            <mesh position={[0, 1.05, 0]} castShadow>
              <boxGeometry args={[2.5, 0.08, 1.2]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.15} />
            </mesh>
            {/* Chậu rửa sứ & vòi nước Chrome */}
            <mesh position={[0, 1.15, 0.05]} castShadow>
              <cylinderGeometry args={[0.42, 0.34, 0.2, 18]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.32, -0.35]}>
              <cylinderGeometry args={[0.04, 0.04, 0.32, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {/* Gương tròn phát sáng viền LED gắn tường */}
            <mesh position={[0, 2.05, -0.58]}>
              <cylinderGeometry args={[0.68, 0.68, 0.05, 24]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fef08a" emissiveIntensity={0.65} />
            </mesh>
            <mesh position={[0, 2.05, -0.54]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.04, 24]} />
              <meshStandardMaterial color="#e0f2fe" metalness={0.9} roughness={0.05} />
            </mesh>
          </group>

          {/* 3.5. Máy Giặt Cửa Ngang Hiện Đại */}
          <group position={[5.3, 0, 1.8]}>
            <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.25, 1.36, 1.15]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.25} />
            </mesh>
            {/* Lồng giặt cửa kính tròn */}
            <mesh position={[0, 0.65, 0.59]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.06, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.15} />
            </mesh>
            {/* Bảng điều khiển LED */}
            <mesh position={[0.25, 1.2, 0.59]}>
              <boxGeometry args={[0.45, 0.14, 0.03]} />
              <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.8} />
            </mesh>
          </group>

          {/* Quầy Thiết Kế & Quản Lý Nội Thất Smart Home (góc trái trên Phòng Khách) */}
          {interior.isMyHouse && (
            <group
              position={[-13.2, 0, -9.8]}
              onClick={(e) => {
                e.stopPropagation();
                onOpenHouseShopModal();
              }}
            >
              {[
                [-0.65, -0.4],
                [0.65, -0.4],
                [-0.65, 0.4],
                [0.65, 0.4],
              ].map(([x, z], idx) => (
                <mesh key={idx} position={[x, 0.52, z]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 1.04, 8]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              ))}
              <mesh position={[0, 1.06, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.1, 1.0]} />
                <meshStandardMaterial color="#b45309" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.65, -0.32]} castShadow>
                <boxGeometry args={[1.4, 0.72, 0.25]} />
                <meshStandardMaterial color="#78350f" roughness={0.5} />
              </mesh>
              <mesh position={[-0.2, 1.25, 0.08]} rotation={[-0.45, 0, 0]} castShadow>
                <boxGeometry args={[0.58, 0.42, 0.04]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} />
              </mesh>
              <mesh position={[-0.2, 1.26, 0.1]} rotation={[-0.45, 0, 0]}>
                <planeGeometry args={[0.52, 0.36]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.85} />
              </mesh>
              <mesh position={[0.48, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.11, 0.18, 12]} />
                <meshStandardMaterial color="#f8fafc" />
              </mesh>
              <mesh position={[0.48, 1.38, 0]}>
                <dodecahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial color="#16a34a" roughness={0.7} />
              </mesh>
              {distHouseShop <= 3.2 && (
                <KeyPromptBadge
                  keyLabel="E"
                  position={[0, 2.2, 0]}
                  color="#f59e0b"
                  onClick={onOpenHouseShopModal}
                />
              )}
            </group>
          )}

          {/* Danh sách nội thất đặt trong nhà (Tỉ lệ 1.9x chuẩn người thật, tự chuẩn hóa 3 phòng) */}
          {organizedHouseFurniture.map((item, idx) => (
            <HouseFurnitureItem3D
              key={idx}
              item={item}
              roomSpanX={10.5}
              roomSpanZ={7.5}
              itemScale={1.9}
              isSelected={selectedFurnitureIndex === idx}
              onSelect={() => onSelectFurnitureIndex(idx)}
            />
          ))}
        </group>
      )}

      {/* ================================================================= */}
      {/* 2B. TRONG CÁC QUÁN: QUẦY MUA HÀNG, QUẦY NHÂN VIÊN & KHÁCH HÀNG   */}
      {/* ================================================================= */}
      {interior.kind === 'SHOP' && shopData && (
        <group>
          {/* QUẦY 1 (BÊN TRÁI): QUẦY THU NGÂN MUA HÀNG */}
          <group position={[-7.5, 0, -5.5]}>
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.65, 0]}>
              <mesh
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShopBuyModal();
                }}
              >
                <boxGeometry args={[6.2, 1.3, 1.6]} />
                <meshStandardMaterial color={shopData.accentColor} roughness={0.35} />
              </mesh>
            </RigidBody>
            <mesh position={[0, 1.35, 0]} castShadow>
              <boxGeometry args={[6.5, 0.12, 1.8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
            </mesh>

            {/* Thảm đứng mua hàng */}
            <mesh
              position={[0, 0.03, 2.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onOpenShopBuyModal();
              }}
            >
              <planeGeometry args={[5.4, 2.0]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} />
            </mesh>

            {/* Nút thao tác [E] CHỈ hiện khi người chơi đi tới gần Quầy Thu Ngân */}
            {distBuyCounter <= 3.2 && (
              <KeyPromptBadge
                keyLabel="E"
                position={[0, 1.8, 1.8]}
                color="#0284c7"
                onClick={onOpenShopBuyModal}
              />
            )}

            {/* Nhân viên thu ngân đứng quầy phong cách Fashion Avatar */}
            <group position={[0, 0, -1.5]}>
              <FashionAvatar
                outfitColor={shopData.accentColor}
                hatColor="#fbbf24"
                scale={1.3}
                isNpc={true}
              />
            </group>
          </group>

          {/* QUẦY 2 (BÊN PHẢI): QUẦY NHÂN VIÊN & CA LÀM VIỆC */}
          <group position={[8.0, 0, -5.5]}>
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.65, 0]}>
              <mesh
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isWorkingAsStaff) {
                    onToggleWorkingAsStaff(true);
                  } else if (counterCustomer?.step === 'AT_COUNTER') {
                    onOpenShopWorkModal();
                  }
                }}
              >
                <boxGeometry args={[5.6, 1.3, 1.6]} />
                <meshStandardMaterial
                  color={isWorkingAsStaff ? '#10b981' : '#f59e0b'}
                  roughness={0.35}
                />
              </mesh>
            </RigidBody>
            <mesh position={[0, 1.35, 0]} castShadow>
              <boxGeometry args={[5.9, 0.12, 1.8]} />
              <meshStandardMaterial color="#fef08a" roughness={0.25} />
            </mesh>

            {/* Nút thao tác [E] CHỈ hiện khi người chơi đi tới gần Quầy Nhân Viên */}
            {distStaffCounter <= 3.2 && (
              <KeyPromptBadge
                keyLabel="E"
                position={[0, 2.0, 0]}
                color={isWorkingAsStaff ? '#10b981' : '#f59e0b'}
                onClick={() => {
                  if (!isWorkingAsStaff) {
                    onToggleWorkingAsStaff(true);
                  } else if (counterCustomer?.step === 'AT_COUNTER') {
                    onOpenShopWorkModal();
                  } else {
                    onToggleWorkingAsStaff(false);
                  }
                }}
              />
            )}
          </group>

          {/* KHÁCH HÀNG TẠI QUẦY (ĐANG ĐI VÀO HOẶC ĐANG ĐỨNG ORDER) */}
          {isWorkingAsStaff && counterCustomer && (
            <group
              position={[
                counterCustomer.step === 'WALKING_IN'
                  ? 0 + (6.0 - 0) * counterCustomer.progress
                  : 6.0,
                0,
                counterCustomer.step === 'WALKING_IN'
                  ? 10.2 + (-3.8 - 10.2) * counterCustomer.progress
                  : -3.8,
              ]}
              rotation={[0, counterCustomer.step === 'WALKING_IN' ? Math.PI * 0.8 : Math.PI, 0]}
              onClick={(e) => {
                e.stopPropagation();
                if (counterCustomer.step === 'AT_COUNTER') {
                  onOpenShopWorkModal();
                }
              }}
            >
              <FashionAvatar
                outfitColor={
                  counterCustomer.scenario.difficulty === 'hard'
                    ? '#ec4899'
                    : counterCustomer.scenario.difficulty === 'medium'
                      ? '#f59e0b'
                      : '#10b981'
                }
                hatColor="#38bdf8"
                scale={1.3}
                isNpc={true}
              />

              {/* Nhãn thao tác gọn gàng chỉ hiện khi khách đã tới trước quầy */}
              {counterCustomer.step === 'AT_COUNTER' && (
                <KeyPromptBadge
                  keyLabel="E"
                  position={[0, 2.3, 0]}
                  color="#10b981"
                  onClick={onOpenShopWorkModal}
                />
              )}
            </group>
          )}

          {/* KHÁCH HÀNG ĐÃ MUA XONG & ĐANG Ở LẠI QUÁN (NGỒI BÀN UỐNG CAFE / ĂN UỐNG) */}
          {seatedPatrons.map((patron) => {
            const posX =
              patron.state === 'WALKING_TO_TABLE'
                ? patron.startX + (patron.tablePos.x - patron.startX) * patron.walkProgress
                : patron.state === 'LEAVING'
                  ? patron.tablePos.x + (0 - patron.tablePos.x) * patron.leaveProgress
                  : patron.tablePos.x;

            const posZ =
              patron.state === 'WALKING_TO_TABLE'
                ? patron.startZ + (patron.tablePos.z - patron.startZ) * patron.walkProgress
                : patron.state === 'LEAVING'
                  ? patron.tablePos.z + (11.0 - patron.tablePos.z) * patron.leaveProgress
                  : patron.tablePos.z + 0.95;

            return (
              <group key={patron.id} position={[posX, 0, posZ]}>
                <FashionAvatar
                  outfitColor={patron.shirtColor}
                  scale={patron.state === 'SEATED' ? 1.15 : 1.3}
                  isNpc={true}
                />

                {/* Đồ uống / Món ăn trên bàn của khách */}
                {patron.state === 'SEATED' && (
                  <mesh position={[0, 0.96, -0.65]} castShadow>
                    <cylinderGeometry args={[0.07, 0.05, 0.12, 12]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.2} />
                  </mesh>
                )}
              </group>
            );
          })}

          {/* CÁC BÀN GHẾ TRONG QUÁN CAFE */}
          {interior.shopId === 'CAFE' && (
            <group>
              {SHOP_SEATING_TABLES.CAFE.map((t, idx) => (
                <group key={idx} position={[t.x, 0, t.z]}>
                  {/* Chân bàn */}
                  <mesh position={[0, 0.45, 0]} castShadow>
                    <cylinderGeometry args={[0.12, 0.16, 0.9, 10]} />
                    <meshStandardMaterial color="#451a03" />
                  </mesh>
                  {/* Mặt bàn gỗ tròn */}
                  <mesh position={[0, 0.92, 0]} castShadow>
                    <cylinderGeometry args={[1.15, 1.15, 0.09, 24]} />
                    <meshStandardMaterial color="#92400e" roughness={0.35} />
                  </mesh>
                  {/* 2 Ghế ngồi gỗ 2 bên */}
                  <mesh position={[0, 0.45, -0.95]} castShadow>
                    <cylinderGeometry args={[0.35, 0.35, 0.48, 14]} />
                    <meshStandardMaterial color="#78350f" />
                  </mesh>
                  <mesh position={[0, 0.45, 0.95]} castShadow>
                    <cylinderGeometry args={[0.35, 0.35, 0.48, 14]} />
                    <meshStandardMaterial color="#78350f" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* CÁC BỘ BÀN GHẾ RETRO DINER SOFA */}
          {interior.shopId === 'DINER' && (
            <group>
              {SHOP_SEATING_TABLES.DINER.map((b, idx) => (
                <group key={idx} position={[b.x, 0, b.z]}>
                  <mesh position={[0, 0.48, -1.0]} castShadow>
                    <boxGeometry args={[2.8, 0.9, 0.75]} />
                    <meshStandardMaterial color="#dc2626" />
                  </mesh>
                  <mesh position={[0, 0.48, 1.0]} castShadow>
                    <boxGeometry args={[2.8, 0.9, 0.75]} />
                    <meshStandardMaterial color="#dc2626" />
                  </mesh>
                  <mesh position={[0, 0.8, 0]} castShadow>
                    <boxGeometry args={[2.6, 0.1, 1.05]} />
                    <meshStandardMaterial color="#f8fafc" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* QUÁN QUẦN ÁO: 4 MANNEQUIN THỜI TRANG */}
          {interior.shopId === 'CLOTHING' && (
            <group>
              {[
                { id: 0, x: -10.2, z: 3.2, color: '#38bdf8', label: 'Áo Hoodie Xanh (140 Xu)' },
                { id: 1, x: -3.5, z: 3.2, color: '#1e3a8a', label: 'Vest Hoàng Gia (260 Xu)' },
                { id: 2, x: 3.5, z: 3.2, color: '#ec4899', label: 'Streetwear Neon (340 Xu)' },
                { id: 3, x: 10.2, z: 3.2, color: '#991b1b', label: 'Blazer Oxford (480 Xu)' },
              ].map((m) => (
                <group
                  key={m.id}
                  position={[m.x, 0, m.z]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShopBuyModal();
                  }}
                >
                  {/* Bục bọc nhung thời trang */}
                  <mesh position={[0, 0.18, 0]} castShadow>
                    <cylinderGeometry args={[1.25, 1.4, 0.35, 24]} />
                    <meshStandardMaterial color="#fbcfe8" roughness={0.3} />
                  </mesh>
                  {/* Mannequin người mẫu diện thời trang cao cấp */}
                  <group position={[0, 0.35, 0]}>
                    <FashionAvatar outfitColor={m.color} scale={1.25} isNpc={true} />
                  </group>

                  {/* Nút thao tác CHỈ hiện khi người chơi đi tới sát Mannequin */}
                  {nearestMannequinIdx === m.id && (
                    <KeyPromptBadge
                      keyLabel="E"
                      position={[0, 2.5, 0]}
                      color="#c026d3"
                      onClick={onOpenShopBuyModal}
                    />
                  )}
                </group>
              ))}
            </group>
          )}

          {/* SHOWROOM XE: 4 BỤC TRƯNG BÀY SIÊU XE */}
          {interior.shopId === 'CAR_SHOWROOM' && (
            <group>
              {[
                { id: 0, x: -10.5, z: 3.5, color: '#38bdf8', label: 'Ván Trượt Pro (220 Xu)', w: 1.1, h: 0.18, l: 1.8 },
                { id: 1, x: -3.6, z: 3.5, color: '#fde047', label: 'Xe Vespa Ý (650 Xu)', w: 1.0, h: 0.85, l: 2.1 },
                { id: 2, x: 3.6, z: 3.5, color: '#dc2626', label: 'Mô Tô Ducati (1200 Xu)', w: 1.1, h: 0.9, l: 2.3 },
                { id: 3, x: 10.5, z: 3.5, color: '#f97316', label: 'Siêu Xe Lamborghini (2500 Xu)', w: 1.95, h: 0.75, l: 3.4 },
              ].map((car) => (
                <group
                  key={car.id}
                  position={[car.x, 0, car.z]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShopBuyModal();
                  }}
                >
                  {/* Bục xoay siêu xe có đèn LED phát sáng */}
                  <mesh position={[0, 0.15, 0]} receiveShadow>
                    <cylinderGeometry args={[2.1, 2.3, 0.3, 28]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.9, 2.08, 28]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
                  </mesh>
                  <mesh position={[0, 0.31 + car.h / 2, 0]} castShadow>
                    <boxGeometry args={[car.w, car.h, car.l]} />
                    <meshStandardMaterial color={car.color} metalness={0.7} roughness={0.15} />
                  </mesh>

                  {/* Nút thao tác CHỈ hiện khi người chơi đi tới sát Xe */}
                  {nearestCarIdx === car.id && (
                    <KeyPromptBadge
                      keyLabel="E"
                      position={[0, 1.8, 0]}
                      color="#0284c7"
                      onClick={onOpenShopBuyModal}
                    />
                  )}
                </group>
              ))}
            </group>
          )}
        </group>
      )}

      {/* ================================================================= */}
      {/* 2C. TRONG TRƯỜNG HỌC: LỚP HỌC TRỰC TUYẾN • CÔ LAN                 */}
      {/* ================================================================= */}
      {isSchool && classroomQuizState && (
        <Classroom3DScene quizState={classroomQuizState} onExit={onExitInterior} />
      )}

      {/* ================================================================= */}
      {/* 2D. TRONG RẠP CHIẾU PHIM: MÀN CHIẾU ĐẠI RẠP IMAX YOUTUBE          */}
      {/* ================================================================= */}
      {isCinema && (
        <Cinema3DScene
          isLightsDimmed={isCinemaLightsDimmed}
          hasTicket={hasCinemaTicket}
          onOpenTicketBox={onOpenCinemaTicketBox || (() => {})}
        />
      )}

      {/* ================================================================= */}
      {/* 3. NHÂN VẬT NGƯỜI CHƠI DI CHUYỂN & XOAY GÓC NHÌN 360 ĐỘ          */}
      {/* ================================================================= */}
      <PlayerPhysics
        initialPosition={isSchool ? [0, 0.42, 2.05] : isCinema ? [0, 0.25, 2.5] : [0, 0.25, 7.5]}
        isInteriorMode={true}
        isSchoolMode={isSchool || isCinema}
        isFishing={false}
        isSkateboarding={false}
        activeVehicle="none"
        outfitColor={outfitColor}
        hatColor={hatColor}
        pantsColor={pantsColor}
        shoeColor={shoeColor}
        hairColor={hairColor}
        avatarStyle={avatarStyle}
        hatStyle={hatStyle}
        accessory={accessory}
        currentEmote={currentEmote}
        teleportTarget={null}
        cameraOrbitAngle={isSchool || isCinema ? 0 : cameraOrbitAngle}
        onStepInteriorExitDoor={onExitInterior}
        onInteriorZoneChange={onInteriorZoneChange}
      />
    </>
  );
}
