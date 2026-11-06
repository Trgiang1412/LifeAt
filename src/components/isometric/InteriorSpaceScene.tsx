'use client';

import React, { useRef, useMemo } from 'react';
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

/**
 * Mô hình NPC Khách Hàng 3D (CHỈ xuất hiện khi người chơi đã chủ động chọn chế độ "Làm Nhân Viên")
 * Đi bộ từ cửa chính của quán [0, 0, 10.2] tới trước Quầy Nhân Viên [8.0, 0, -2.2] để hỏi và mua hàng
 */
function AnimatedShopCustomerNPC({
  scenario,
  onClickCustomer,
}: {
  scenario: WorkCustomerScenario;
  onClickCustomer: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef<number>(0);

  const prevScenarioIdRef = useRef<string>('');
  if (prevScenarioIdRef.current !== scenario.id) {
    prevScenarioIdRef.current = scenario.id;
    progressRef.current = 0;
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 0.55);
    const t = progressRef.current;

    const startX = 0;
    const startZ = 10.2;
    const targetX = 8.0;
    const targetZ = -2.2;

    const curX = startX + (targetX - startX) * t;
    const curZ = startZ + (targetZ - startZ) * t;
    const bounce = t < 1 ? Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.08 : 0;

    groupRef.current.position.set(curX, bounce, curZ);
    groupRef.current.rotation.y = t < 1 ? Math.atan2(targetX - startX, targetZ - startZ) : Math.PI;
  });

  const shirtColor =
    scenario.difficulty === 'hard'
      ? '#ec4899'
      : scenario.difficulty === 'medium'
        ? '#f59e0b'
        : '#10b981';

  return (
    <group
      ref={groupRef}
      position={[0, 0, 10.2]}
      onClick={(e) => {
        e.stopPropagation();
        onClickCustomer();
      }}
    >
      {/* Bong bóng câu hỏi Tiếng Anh theo ngữ cảnh quán nổi trên đầu khách NPC */}
      <Html position={[0, 2.35, 0]} center zIndexRange={[16, 0]} style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClickCustomer();
          }}
          style={{
            maxWidth: '280px',
            padding: '8px 12px',
            borderRadius: '14px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${shirtColor}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            color: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 900, fontSize: '11px', color: '#fef08a' }}>
              {scenario.customerAvatar} Khách: {scenario.customerName}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: shirtColor,
                color: '#0f172a',
              }}
            >
              +{scenario.rewardCoins} Xu
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.35, color: '#ffffff' }}>
            &ldquo;{scenario.customerOrderEn}&rdquo;
          </div>
          <div
            style={{
              marginTop: '5px',
              fontSize: '10px',
              fontWeight: 900,
              color: '#38bdf8',
              textAlign: 'center',
            }}
          >
            💬 Bấm vào khách hoặc phím [E] để trả lời!
          </div>
        </div>
      </Html>

      {/* Nhân vật Chibi Khách hàng */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.38, 8, 14]} />
        <meshStandardMaterial color={shirtColor} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.16, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.45} />
      </mesh>
      <mesh position={[-0.1, 1.2, 0.31]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.1, 1.2, 0.31]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

/**
 * Mô hình Nhân viên Thu ngân / Quản lý đứng tại Quầy Mua Hàng bên trái
 */
function ShopCashierNPC3D({
  name,
  role,
  color,
  onClickBuy,
}: {
  name: string;
  role: string;
  color: string;
  onClickBuy: () => void;
}) {
  return (
    <group
      position={[-7.5, 0, -7.2]}
      onClick={(e) => {
        e.stopPropagation();
        onClickBuy();
      }}
    >
      <Html position={[0, 2.2, 0]} center zIndexRange={[14, 0]} style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClickBuy();
          }}
          style={{
            padding: '6px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: `2px solid ${color}`,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🛒 {name} ({role}) • Bấm vào đây hoặc phím [E] để Mua Hàng
        </div>
      </Html>
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.4, 8, 14]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.45} />
      </mesh>
    </group>
  );
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
}

/**
 * Không Gian Nội Thất 3D Siêu Rộng Rãi (32m x 26m - Gấp 4 lần diện tích cũ!)
 * - Trong Nhà: Không gian phòng khách, phòng ngủ, góc học tập rộng thênh thang để đi lại và bày trí.
 * - Trong Quán: Mặc định người chơi vào với tư cách Khách Hàng đi dạo mua sắm;
 *   chỉ khi bấm "Đăng ký làm nhân viên" tại Quầy Nhân Viên thì mới bắt đầu ca làm việc tiếp khách NPC.
 */
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
}: InteriorSpaceSceneProps) {
  const isHouse = interior.kind === 'HOUSE';
  const shopData = interior.kind === 'SHOP' ? CITY_SHOPS_DATA[interior.shopId] : null;

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
        return '#f5ebe0';
      case 'DINER':
        return '#fee2e2';
      case 'CLOTHING':
        return '#fce7f3';
      case 'CAR_SHOWROOM':
        return '#0f172a';
    }
  }, [interior]);

  const trimColor = useMemo(() => {
    if (interior.kind === 'HOUSE') return interior.roofColor || '#92400e';
    return shopData?.accentColor || '#38bdf8';
  }, [interior, shopData]);

  // Xử lý click xuống sàn nhà rộng 32m x 26m để đặt/di chuyển món nội thất đang chọn (tọa độ lưới 0..9)
  const handleFloorClick = (e: any) => {
    if (interior.kind !== 'HOUSE' || !interior.isMyHouse || selectedFurnitureIndex === null) return;
    e.stopPropagation();
    const pt = e.point as THREE.Vector3;
    // Quy đổi ngược từ tọa độ thực (-11.5..11.5, -8.6..8.6) về lưới 0..9
    const rawX = Math.round((pt.x / 11.5) * 4.5 + 4.5);
    const rawZ = Math.round((pt.z / 8.6) * 4.5 + 4.5);
    const gridX = Math.max(0, Math.min(9, rawX));
    const gridZ = Math.max(0, Math.min(9, rawZ));
    onMoveSelectedFurnitureToGrid(gridX, gridZ);
  };

  return (
    <>
      {/* Ánh sáng ấm áp & Thảm cỏ sân vườn bao quanh bên ngoài căn phòng 3D */}
      <color attach="background" args={['#38bdf8']} />
      <hemisphereLight color="#fffbeb" groundColor="#4d8b55" intensity={0.95} />
      <ambientLight color="#ffffff" intensity={1.08} />
      <directionalLight
        position={[20, 32, 22]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 6.5, 0]} color="#fef08a" intensity={1.2} distance={40} />

      {/* Thảm cỏ & Sân lát đá rộng bao quanh bên ngoài phòng */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#589a60" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.15, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 36]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>

      {/* ================================================================= */}
      {/* 1. KẾT CẤU CĂN PHÒNG NỘI THẤT 3D ĐẠI SẢNH RỘNG LỚN (32m x 26m)    */}
      {/* ================================================================= */}
      <group>
        {/* Nền sàn phòng vật lý 32.4m x 26.4m */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]} friction={0}>
          <mesh receiveShadow onClick={handleFloorClick}>
            <boxGeometry args={[32.4, 0.5, 26.4]} />
            <meshStandardMaterial color={floorColor} roughness={0.35} />
          </mesh>
        </RigidBody>

        {/* Đường kẻ ô gạch sàn rộng thoáng (10x10 ô lớn, mỗi ô ~ 2.5m x 1.9m) */}
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 10 }).map((__, c) => {
            const gx = ((c - 4.5) / 4.5) * 11.5;
            const gz = ((r - 4.5) / 4.5) * 8.6;
            const isChecker = (r + c) % 2 === 0;
            return (
              <mesh
                key={`tile-${r}-${c}`}
                position={[gx, 0.01, gz]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                onClick={handleFloorClick}
              >
                <planeGeometry args={[2.45, 1.82]} />
                <meshStandardMaterial
                  color={
                    interior.kind === 'SHOP' && interior.shopId === 'DINER'
                      ? isChecker
                        ? '#f8fafc'
                        : '#1e293b'
                      : interior.kind === 'HOUSE' && selectedFurnitureIndex !== null
                        ? isChecker
                          ? '#e0f2fe'
                          : '#f0f9ff'
                        : floorColor
                  }
                  roughness={0.3}
                />
              </mesh>
            );
          })
        )}

        {/* Tường Hậu phía Bắc (Z = -12.8) */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 2.8, -12.8]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[32.4, 5.6, 0.45]} />
            <meshStandardMaterial color={wallColor} roughness={0.5} />
          </mesh>
        </RigidBody>
        {/* Phào chỉ chân tường & đỉnh tường Hậu */}
        <mesh position={[0, 0.4, -12.55]}>
          <boxGeometry args={[32.0, 0.8, 0.1]} />
          <meshStandardMaterial color={trimColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, 5.45, -12.55]}>
          <boxGeometry args={[32.4, 0.35, 0.18]} />
          <meshStandardMaterial color={trimColor} roughness={0.4} />
        </mesh>

        {/* Tường Hồi bên Trái (X = -16.0) */}
        <RigidBody type="fixed" colliders="cuboid" position={[-16.0, 2.8, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.45, 5.6, 26.4]} />
            <meshStandardMaterial color={wallColor} roughness={0.5} />
          </mesh>
        </RigidBody>
        <mesh position={[-15.75, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.8, 26.0]} />
          <meshStandardMaterial color={trimColor} roughness={0.5} />
        </mesh>

        {/* Tường cắt thấp bên Phải (X = 16.0) và phía Trước (Z = 12.8) để góc nhìn Isometric thoáng đãng */}
        <RigidBody type="fixed" colliders={false} position={[16.0, 2.8, 0]}>
          <CuboidCollider args={[0.3, 2.8, 13.2]} />
          <mesh position={[0, -2.4, 0]}>
            <boxGeometry args={[0.4, 0.8, 26.4]} />
            <meshStandardMaterial color={trimColor} roughness={0.5} />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders={false} position={[0, 2.8, 12.8]}>
          <CuboidCollider args={[16.2, 2.8, 0.3]} />
          <mesh position={[-9.5, -2.4, 0]}>
            <boxGeometry args={[13.2, 0.8, 0.4]} />
            <meshStandardMaterial color={trimColor} roughness={0.5} />
          </mesh>
          <mesh position={[9.5, -2.4, 0]}>
            <boxGeometry args={[13.2, 0.8, 0.4]} />
            <meshStandardMaterial color={trimColor} roughness={0.5} />
          </mesh>
        </RigidBody>

        {/* ================================================================= */}
        {/* CỬA CHÍNH BƯỚC RA NGOÀI THÀNH PHỐ (EXIT DOOR TẠI [0, 0, 11.4])    */}
        {/* ================================================================= */}
        <group position={[0, 0, 11.4]}>
          <mesh
            position={[0, 0.03, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onExitInterior();
            }}
          >
            <planeGeometry args={[5.2, 2.0]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#059669"
              emissiveIntensity={0.85}
            />
          </mesh>
          <mesh position={[-2.7, 1.3, 0.8]} castShadow>
            <boxGeometry args={[0.35, 2.6, 0.35]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[2.7, 1.3, 0.8]} castShadow>
            <boxGeometry args={[0.35, 2.6, 0.35]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>

          <Html position={[0, 1.4, 0.2]} center zIndexRange={[14, 0]} style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExitInterior();
              }}
              style={{
                padding: '6px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '12px',
                border: '2px solid #a7f3d0',
                boxShadow: '0 6px 20px rgba(5, 150, 105, 0.6)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              🚪 CỬA RA THÀNH PHỐ (Đi vào cửa để bước ra ngoài)
            </button>
          </Html>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 2A. NỘI THẤT BÊN TRONG NGÔI NHÀ CẤP 4 RỘNG LỚN (32m x 26m)        */}
      {/* ================================================================= */}
      {isHouse && (
        <group>
          {/* Cửa sổ lớn trên tường Hậu nhìn ra vườn */}
          {[-8.5, 0, 8.5].map((wx, idx) => (
            <group key={idx} position={[wx, 2.8, -12.5]}>
              <mesh>
                <boxGeometry args={[3.4, 2.2, 0.12]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <boxGeometry args={[3.0, 1.85, 0.06]} />
                <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.25} />
              </mesh>
            </group>
          ))}

          {/* Bảng tên Ngôi Nhà trên tường chính */}
          <Html position={[0, 4.9, -12.3]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                padding: '6px 18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                border: '2px solid #fbbf24',
                color: '#fef08a',
                fontWeight: 900,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
                boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
              }}
            >
              🏠 {interior.houseTitle} • {interior.plotLabel}
            </div>
          </Html>

          {/* ICON NHỎ TRONG NHÀ ĐỂ MUA NỘI THẤT BẰNG XU & TỰ DO TRANG TRÍ */}
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
                <meshStandardMaterial color="#f59e0b" roughness={0.3} />
              </mesh>
              <Html
                position={[0, 2.5, 0]}
                center
                zIndexRange={[16, 0]}
                style={{ pointerEvents: 'auto' }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHouseShopModal();
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '12px',
                    border: '2px solid #fef08a',
                    boxShadow: '0 8px 22px rgba(234, 88, 12, 0.65)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  <span>🛋️</span>
                  <span>Mua Nội Thất Bằng Xu</span>
                </button>
              </Html>
            </group>
          )}

          {/* Render toàn bộ các món nội thất 3D trong căn phòng rộng 32m x 26m */}
          {houseFurnitureList.map((item, idx) => {
            const isSelected = selectedFurnitureIndex === idx;
            const catalogInfo = FURNITURE_CATALOG.find((c) => c.maVatPham === item.maVatPham);
            return (
              <group key={`${item.maVatPham}-${idx}`}>
                <HouseFurnitureItem3D
                  item={item}
                  roomSpanX={11.5}
                  roomSpanZ={8.6}
                  itemScale={1.45}
                  isSelected={isSelected}
                  onSelect={
                    interior.isMyHouse
                      ? () => onSelectFurnitureIndex(isSelected ? null : idx)
                      : undefined
                  }
                />
                {isSelected && interior.isMyHouse && (
                  <Html
                    position={[
                      ((Math.min(9, Math.max(0, item.toaDoLuoiX)) - 4.5) / 4.5) * 11.5,
                      2.7,
                      ((Math.min(9, Math.max(0, item.toaDoLuoiZ)) - 4.5) / 4.5) * 8.6,
                    ]}
                    center
                    zIndexRange={[18, 0]}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 900,
                        border: '1.5px solid #bae6fd',
                        whiteSpace: 'nowrap',
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      ✨ Đang chọn: {catalogInfo?.tenVatPham || item.maVatPham} (Click sàn nhà để đặt)
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      )}

      {/* ================================================================= */}
      {/* 2B. KHÔNG GIAN BÊN TRONG 4 QUÁN RỘNG LỚN (32m x 26m)              */}
      {/* ================================================================= */}
      {interior.kind === 'SHOP' && shopData && (
        <group>
          {/* Biển hiệu chính trên tường Hậu trong quán */}
          <Html position={[0, 4.9, -12.3]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                padding: '6px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: `2px solid ${shopData.accentColor}`,
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
                boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
              }}
            >
              {shopData.title} • {isWorkingAsStaff ? '👨‍🍳 Đang Làm Nhân Viên' : '🛍️ Khách Hàng Tham Quan & Mua Sắm'}
            </div>
          </Html>

          {/* ------------------------------------------------------------- */}
          {/* KHU VỰC 1 (BÊN TRÁI): QUẦY THU NGÂN MUA HÀNG CHO KHÁCH         */}
          {/* ------------------------------------------------------------- */}
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
            {/* Thảm khách đứng mua hàng phía trước quầy */}
            <mesh
              position={[0, 0.03, 2.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onOpenShopBuyModal();
              }}
            >
              <planeGeometry args={[5.4, 2.0]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={0.75}
                transparent
                opacity={0.8}
              />
            </mesh>
            <Html position={[0, 0.8, 2.3]} center zIndexRange={[14, 0]} style={{ pointerEvents: 'auto' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShopBuyModal();
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '12px',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'system-ui, sans-serif',
                  boxShadow: '0 6px 18px rgba(2, 132, 199, 0.5)',
                }}
              >
                🛒 QUẦY MUA HÀNG (Đi tới & bấm [E] để mua đồ)
              </button>
            </Html>
          </group>

          {/* Nhân viên thu ngân đứng sau Quầy Mua Hàng */}
          <ShopCashierNPC3D
            name={
              interior.shopId === 'CAFE'
                ? 'Barista Emma'
                : interior.shopId === 'DINER'
                  ? 'Chef Luigi'
                  : interior.shopId === 'CLOTHING'
                    ? 'Stylist Sophie'
                    : 'Manager Max'
            }
            role={shopData.jobTitle}
            color={shopData.accentColor}
            onClickBuy={onOpenShopBuyModal}
          />

          {/* ------------------------------------------------------------- */}
          {/* KHU VỰC 2 (BÊN PHẢI): QUẦY ĐĂNG KÝ LÀM NHÂN VIÊN (TÙY CHỌN)    */}
          {/* ------------------------------------------------------------- */}
          <group position={[8.0, 0, -5.5]}>
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.65, 0]}>
              <mesh
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isWorkingAsStaff) {
                    onToggleWorkingAsStaff(true);
                  } else {
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

            {/* Thảm vị trí đứng làm nhân viên */}
            <mesh
              position={[0, 0.03, -2.1]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                if (!isWorkingAsStaff) {
                  onToggleWorkingAsStaff(true);
                } else {
                  onOpenShopWorkModal();
                }
              }}
            >
              <planeGeometry args={[4.6, 1.8]} />
              <meshStandardMaterial
                color={isWorkingAsStaff ? '#10b981' : '#f59e0b'}
                emissive={isWorkingAsStaff ? '#059669' : '#d97706'}
                emissiveIntensity={0.85}
                transparent
                opacity={0.85}
              />
            </mesh>

            <Html position={[0, 2.1, 0]} center zIndexRange={[14, 0]} style={{ pointerEvents: 'auto' }}>
              {isWorkingAsStaff ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShopWorkModal();
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '12px',
                      border: '2px solid #a7f3d0',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.55)',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    👨‍🍳 ĐANG LÀM NHÂN VIÊN • Bấm vào đây hoặc [E] để tiếp khách
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWorkingAsStaff(true);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #334155, #1e293b)',
                    color: '#fef08a',
                    fontWeight: 900,
                    fontSize: '11px',
                    border: '1.5px solid #fbbf24',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  💼 Quầy Nhân Viên ({shopData.jobTitle}) • Bấm nếu muốn xin làm việc
                </button>
              )}
            </Html>
          </group>

          {/* CHỈ KHI NGƯỜI CHƠI CHỌN LÀM NHÂN VIÊN (isWorkingAsStaff === true) THÌ KHÁCH NPC MỚI ĐI VÀO HỎI MUA */}
          {isWorkingAsStaff && activeWorkScenario && (
            <AnimatedShopCustomerNPC
              scenario={activeWorkScenario}
              onClickCustomer={onOpenShopWorkModal}
            />
          )}

          {/* ------------------------------------------------------------- */}
          {/* NỘI THẤT ĐẶC TRƯNG RỘNG RÃI CỦA TỪNG QUÁN (32m x 26m)          */}
          {/* ------------------------------------------------------------- */}
          {interior.shopId === 'CAFE' && (
            <group>
              {/* Máy pha cafe Espresso & Tủ bánh ngọt trên quầy */}
              <mesh position={[-9.0, 1.65, -5.5]} castShadow>
                <boxGeometry args={[1.3, 0.65, 0.8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[-5.8, 1.65, -5.5]} castShadow>
                <boxGeometry args={[1.8, 0.65, 0.9]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.75} />
              </mesh>
              {/* 6 Bàn ghế gỗ khách ngồi uống cafe rộng rãi khắp quán */}
              {[
                [-10.5, 1.5],
                [-5.0, 1.5],
                [0.5, 1.5],
                [-10.5, 6.2],
                [-5.0, 6.2],
                [8.5, 5.0],
              ].map(([tx, tz], i) => (
                <group key={i} position={[tx, 0, tz]}>
                  <mesh position={[0, 0.45, 0]} castShadow>
                    <cylinderGeometry args={[0.12, 0.16, 0.9, 10]} />
                    <meshStandardMaterial color="#451a03" />
                  </mesh>
                  <mesh position={[0, 0.92, 0]} castShadow>
                    <cylinderGeometry args={[1.15, 1.15, 0.09, 24]} />
                    <meshStandardMaterial color="#92400e" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {interior.shopId === 'DINER' && (
            <group>
              {/* Khu bếp nướng Burger & Lò Pizza lớn sát tường Hậu */}
              <mesh position={[0, 1.6, -10.8]} castShadow>
                <boxGeometry args={[7.5, 2.8, 1.6]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.4} />
              </mesh>
              {/* 4 Bộ bàn ghế Sofa Đỏ Retro Diner Booths rộng rãi */}
              {[
                [-10.0, 2.0],
                [-4.2, 2.0],
                [-10.0, 6.8],
                [8.5, 5.2],
              ].map(([bx, bz], idx) => (
                <group key={idx} position={[bx, 0, bz]}>
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

          {interior.shopId === 'CLOTHING' && (
            <group>
              {/* 4 Đảo trưng bày Mannequin Thời Trang rộng rãi cách xa nhau */}
              {[
                { x: -10.2, z: 3.2, color: '#38bdf8', label: '👕 Hoodie Xanh (140 Xu)' },
                { x: -3.5, z: 3.2, color: '#1e3a8a', label: '🧥 Vest Oxford (260 Xu)' },
                { x: 3.5, z: 3.2, color: '#ec4899', label: '⚡ Áo Cyberpunk (340 Xu)' },
                { x: 10.2, z: 3.2, color: '#991b1b', label: '👑 Hoàng Gia (480 Xu)' },
              ].map((m, idx) => (
                <group
                  key={idx}
                  position={[m.x, 0, m.z]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShopBuyModal();
                  }}
                >
                  <mesh position={[0, 0.18, 0]} castShadow>
                    <cylinderGeometry args={[1.25, 1.4, 0.35, 24]} />
                    <meshStandardMaterial color="#fbcfe8" />
                  </mesh>
                  <mesh position={[0, 1.05, 0]} castShadow>
                    <capsuleGeometry args={[0.32, 0.65, 8, 14]} />
                    <meshStandardMaterial color={m.color} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 1.8, 0]}>
                    <sphereGeometry args={[0.24, 12, 12]} />
                    <meshStandardMaterial color="#fde68a" />
                  </mesh>
                  <Html position={[0, 2.35, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
                    <div
                      style={{
                        padding: '3px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.88)',
                        color: '#fbcfe8',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: '1px solid #ec4899',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.label}
                    </div>
                  </Html>
                </group>
              ))}
            </group>
          )}

          {interior.shopId === 'CAR_SHOWROOM' && (
            <group>
              {/* 4 Bục Trưng Bày Xe Cộ & Siêu Xe cách xa nhau trong đại sảnh Showroom 32m x 26m */}
              {[
                { x: -10.5, z: 3.5, color: '#38bdf8', label: '🛹 Ván Trượt Pro (220 Xu)', w: 1.1, h: 0.18, l: 1.8 },
                { x: -3.6, z: 3.5, color: '#fde047', label: '🛵 Xe Vespa (650 Xu)', w: 1.0, h: 0.85, l: 2.1 },
                { x: 3.6, z: 3.5, color: '#dc2626', label: '🏍️ Mô Tô Ducati (1200 Xu)', w: 1.1, h: 0.9, l: 2.3 },
                { x: 10.5, z: 3.5, color: '#f97316', label: '🏎️ Siêu Xe Lamborghini (2500 Xu)', w: 1.95, h: 0.75, l: 3.4 },
              ].map((car, idx) => (
                <group
                  key={idx}
                  position={[car.x, 0, car.z]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShopBuyModal();
                  }}
                >
                  <mesh position={[0, 0.15, 0]} receiveShadow>
                    <cylinderGeometry args={[2.1, 2.3, 0.3, 28]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.9, 2.08, 28]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.1} />
                  </mesh>
                  <mesh position={[0, 0.31 + car.h / 2, 0]} castShadow>
                    <boxGeometry args={[car.w, car.h, car.l]} />
                    <meshStandardMaterial color={car.color} metalness={0.65} roughness={0.2} />
                  </mesh>
                  <Html position={[0, 1.85, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#bae6fd',
                        fontSize: '11px',
                        fontWeight: 900,
                        border: '1px solid #38bdf8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {car.label}
                    </div>
                  </Html>
                </group>
              ))}
            </group>
          )}
        </group>
      )}

      {/* ================================================================= */}
      {/* 3. NHÂN VẬT NGƯỜI CHƠI ĐI BỘ TỰ DO TRONG ĐẠI SẢNH RỘNG 32m x 26m  */}
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
        onStepInteriorExitDoor={onExitInterior}
        onInteriorZoneChange={onInteriorZoneChange}
      />
    </>
  );
}
