'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from './SafeHtml';
import PlayerPhysics from './PlayerPhysics';
import {
  HouseFurnitureItem3D,
  type HouseFurnitureRenderItem,
} from './PlayTogetherPlaza';
import {
  CITY_SHOPS_DATA,
  FURNITURE_CATALOG,
  type ShopVenueId,
  type WorkCustomerScenario,
} from '@/data/worldGameplayData';
import { FashionAvatar } from './FashionAvatar';
import { getLocalPlayerPosition } from '@/stores/useMultiplayerStore';

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
  currentEmote: string | null;
  teleportTarget: { x: number; z: number; id: number } | null;
  cameraOrbitAngle?: number;
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
  currentEmote,
  cameraOrbitAngle = Math.PI / 4,
}: InteriorSpaceSceneProps) {
  const isHouse = interior.kind === 'HOUSE';
  const shopData = interior.kind === 'SHOP' ? CITY_SHOPS_DATA[interior.shopId] : null;

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

  // Màu sàn & tường tùy theo không gian Nhà hoặc Quán
  const floorColor = useMemo(() => {
    if (interior.kind === 'HOUSE') return '#fdf8f0';
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
      <color attach="background" args={['#0b132b']} />
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[20, 35, 18]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 8, 0]} intensity={1.8} distance={45} color="#fef08a" />
      <pointLight position={[-8, 7, -5]} intensity={1.2} distance={30} color="#fed7aa" />
      <pointLight position={[8, 7, -5]} intensity={1.2} distance={30} color="#e0e7ff" />

      {/* Mặt sàn chính của căn phòng */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.15, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[32.0, 0.3, 26.0]} />
          <meshStandardMaterial color={floorColor} roughness={0.3} metalness={0.08} />
        </mesh>
      </RigidBody>

      {/* Thảm Cửa Thoát ra ngoài Thành Phố */}
      <mesh position={[0, 0.04, 11.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 2.2]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.65} />
      </mesh>
      <Html position={[0, 0.6, 11.4]} center zIndexRange={[12, 0]}>
        <button
          type="button"
          onClick={onExitInterior}
          style={{
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid #34d399',
            color: '#a7f3d0',
            fontWeight: 800,
            fontSize: '11px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          🚪 Bước Ra Thành Phố [Chạm thảm]
        </button>
      </Html>

      {/* 4 Bức tường: Tường Bắc & Tây full cao 6m tạo nền phòng; tường Nam & Đông cutaway thấp 1.2m để camera isometric không bị che */}
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
      <RigidBody type="fixed" colliders="cuboid" position={[15.85, 0.6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 1.2, 26.0]} />
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
      {/* 2A. TRONG NHÀ CẤP 4: BÀY TRÍ NỘI THẤT VÀ ICON MUA NỘI THẤT        */}
      {/* ================================================================= */}
      {isHouse && (
        <group>
          {interior.isMyHouse && (
            <group position={[-13.2, 0, -9.8]}>
              <mesh
                position={[0, 1.0, 0]}
                castShadow
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHouseShopModal();
                }}
              >
                <boxGeometry args={[1.4, 1.8, 1.1]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
              </mesh>
              {distHouseShop <= 3.2 && (
                <Html position={[0, 2.3, 0]} center zIndexRange={[16, 0]}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenHouseShopModal();
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '11px',
                      border: '1.5px solid #fef08a',
                      boxShadow: '0 6px 18px rgba(234, 88, 12, 0.55)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🎨 [E] Mua & Trang trí Nội Thất
                  </button>
                </Html>
              )}
            </group>
          )}

          {/* Danh sách nội thất đặt trong nhà */}
          {houseFurnitureList.map((item, idx) => (
            <HouseFurnitureItem3D
              key={idx}
              item={item}
              roomSpanX={11.5}
              roomSpanZ={8.5}
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
              <Html position={[0, 1.8, 1.8]} center zIndexRange={[14, 0]}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShopBuyModal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '11px',
                    border: '1.5px solid #ffffff',
                    boxShadow: '0 6px 18px rgba(2, 132, 199, 0.55)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: '#fbbf24',
                      color: '#0f172a',
                      fontSize: '10px',
                    }}
                  >
                    E
                  </span>
                  <span>Mua hàng tại Quầy</span>
                </button>
              </Html>
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
              <Html position={[0, 2.0, 0]} center zIndexRange={[14, 0]}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isWorkingAsStaff) {
                      onToggleWorkingAsStaff(true);
                    } else if (counterCustomer?.step === 'AT_COUNTER') {
                      onOpenShopWorkModal();
                    } else {
                      onToggleWorkingAsStaff(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: isWorkingAsStaff ? '#059669' : '#0f172a',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '11px',
                    border: `1.5px solid ${isWorkingAsStaff ? '#a7f3d0' : '#fbbf24'}`,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: '#fbbf24',
                      color: '#0f172a',
                      fontSize: '10px',
                    }}
                  >
                    E
                  </span>
                  <span>
                    {!isWorkingAsStaff
                      ? `Làm việc (${shopData.jobTitle})`
                      : counterCustomer?.step === 'AT_COUNTER'
                        ? `Phục vụ ${counterCustomer.scenario.customerName}`
                        : 'Nghỉ làm (Đang chờ khách...)'}
                  </span>
                </button>
              </Html>
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
                <Html position={[0, 2.3, 0]} center zIndexRange={[16, 0]}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShopWorkModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '11px',
                      border: '1.5px solid #a7f3d0',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{counterCustomer.scenario.customerAvatar}</span>
                    <span>[E] Trả lời {counterCustomer.scenario.customerName}</span>
                  </button>
                </Html>
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
                    <Html position={[0, 2.5, 0]} center zIndexRange={[14, 0]}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShopBuyModal();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          backgroundColor: '#701a75',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '11px',
                          border: '1.5px solid #fbcfe8',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>[E] Thử {m.label}</span>
                      </button>
                    </Html>
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
                    <Html position={[0, 1.8, 0]} center zIndexRange={[14, 0]}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShopBuyModal();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '11px',
                          border: '1.5px solid #ffffff',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>[E] Xem {car.label}</span>
                      </button>
                    </Html>
                  )}
                </group>
              ))}
            </group>
          )}
        </group>
      )}

      {/* ================================================================= */}
      {/* 3. NHÂN VẬT NGƯỜI CHƠI DI CHUYỂN & XOAY GÓC NHÌN 360 ĐỘ          */}
      {/* ================================================================= */}
      <PlayerPhysics
        initialPosition={[0, 0.25, 7.5]}
        isInteriorMode={true}
        isFishing={false}
        isSkateboarding={false}
        activeVehicle="none"
        outfitColor={outfitColor}
        hatColor={hatColor}
        currentEmote={currentEmote}
        teleportTarget={null}
        cameraOrbitAngle={cameraOrbitAngle}
        onStepInteriorExitDoor={onExitInterior}
        onInteriorZoneChange={onInteriorZoneChange}
      />
    </>
  );
}
