'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from './SafeHtml';

// ============================================================================
// BỘ KHỞI TẠO TEXTURE PROCEDURAL CHÂN THỰC (CACHED CANVAS TEXTURES)
// Giúp bề mặt đường nhựa, vỉa hè, thảm cỏ, mái ngói, tường gạch và kính cao ốc
// có chiều sâu vật liệu thật mà không tốn băng thông tải ảnh ngoài.
// ============================================================================
const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(
  key: string,
  width: number,
  height: number,
  repeatX: number,
  repeatY: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cacheKey = `${key}_${repeatX}_${repeatY}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, width, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  textureCache.set(cacheKey, tex);
  return tex;
}

/** Texture thảm cỏ tự nhiên đa sắc độ */
function useGrassTexture(repeatX = 32, repeatY = 32) {
  return useMemo(
    () =>
      getOrCreateTexture('grass_realistic', 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#4d8b55';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 2400; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          ctx.fillStyle = i % 3 === 0 ? '#589a60' : i % 3 === 1 ? '#3f7847' : '#65a86d';
          ctx.fillRect(x, y, 2, 4);
        }
      }),
    [repeatX, repeatY]
  );
}

/** Texture nhựa đường Asphalt có hạt đá mịn */
function useAsphaltTexture(repeatX = 2, repeatY = 16) {
  return useMemo(
    () =>
      getOrCreateTexture('asphalt_realistic', 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#2b303c';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 3000; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          ctx.fillStyle = i % 2 === 0 ? '#353b49' : '#222630';
          ctx.fillRect(x, y, 2, 2);
        }
      }),
    [repeatX, repeatY]
  );
}

/** Texture mái ngói đỏ đất nung truyền thống Việt Nam */
function useRoofTileTexture(baseColor = '#b93829', repeatX = 6, repeatY = 4) {
  return useMemo(
    () =>
      getOrCreateTexture(`rooftile_${baseColor}`, 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, w, h);
        const rows = 8;
        const cols = 8;
        const rowH = h / rows;
        const colW = w / cols;

        for (let r = 0; r < rows; r++) {
          // Bóng đổ gờ ngói ngang
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.fillRect(0, r * rowH, w, 4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(0, r * rowH + 4, w, 3);

          const offset = (r % 2) * (colW * 0.5);
          for (let c = 0; c <= cols; c++) {
            const x = c * colW + offset;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(x, r * rowH, 3, rowH);
          }
        }
      }),
    [baseColor, repeatX, repeatY]
  );
}

/** Texture sân gạch đỏ Hạ Long truyền thống trước hiên Nhà Cấp 4 */
function useCourtyardTileTexture(repeatX = 8, repeatY = 8) {
  return useMemo(
    () =>
      getOrCreateTexture('courtyard_red_tile', 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#b84a39';
        ctx.fillRect(0, 0, w, h);
        const step = 64;
        ctx.strokeStyle = '#d6cfc7';
        ctx.lineWidth = 3;
        for (let x = 0; x <= w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y <= h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }),
    [repeatX, repeatY]
  );
}

/** Texture sàn gạch bông/gạch men sáng bóng trong nhà */
function useIndoorFloorTexture(repeatX = 6, repeatY = 6) {
  return useMemo(
    () =>
      getOrCreateTexture('indoor_ceramic_tile', 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#f8f4ec';
        ctx.fillRect(0, 0, w, h);
        const step = 64;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        for (let x = 0; x <= w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y <= h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }),
    [repeatX, repeatY]
  );
}

/** Texture kính mặt dựng tòa cao ốc (Curtain Wall Glass) */
function useCurtainWallTexture(tintColor = '#1e3a5f', repeatX = 4, repeatY = 8) {
  return useMemo(
    () =>
      getOrCreateTexture(`curtain_glass_${tintColor}`, 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = tintColor;
        ctx.fillRect(0, 0, w, h);
        const cols = 4;
        const rows = 4;
        const cw = w / cols;
        const ch = h / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const isWarmLit = (r * 3 + c * 7) % 5 === 0;
            ctx.fillStyle = isWarmLit ? 'rgba(254, 240, 138, 0.35)' : 'rgba(148, 163, 184, 0.18)';
            ctx.fillRect(c * cw + 6, r * ch + 6, cw - 12, ch - 14);
            // Khung đố nhôm kính
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 5;
            ctx.strokeRect(c * cw, r * ch, cw, ch);
          }
        }
      }),
    [tintColor, repeatX, repeatY]
  );
}

// ============================================================================
// MÔ HÌNH 3D CHI TIẾT CHO TỪNG MÓN NỘI THẤT TRONG NHÀ CẤP 4 (14 MÓN)
// ============================================================================
export interface HouseFurnitureRenderItem {
  maVatPham: string;
  tenVatPham?: string;
  toaDoLuoiX: number;
  toaDoLuoiZ: number;
  gocXoayDo: number;
}

const FALLBACK_FURNITURE_LIST: HouseFurnitureRenderItem[] = [
  { maVatPham: 'GIUONG_GO_DON', toaDoLuoiX: 8, toaDoLuoiZ: 7, gocXoayDo: 0 },
  { maVatPham: 'BAN_HOC_DEN_LED', toaDoLuoiX: 8, toaDoLuoiZ: 2, gocXoayDo: 0 },
  { maVatPham: 'KE_SACH_OXFORD', toaDoLuoiX: 9, toaDoLuoiZ: 2, gocXoayDo: 0 },
  { maVatPham: 'SOFA_GO_PHONG_KHACH', toaDoLuoiX: 2, toaDoLuoiZ: 5, gocXoayDo: 0 },
  { maVatPham: 'KE_TIVI_CO_DIEN', toaDoLuoiX: 2, toaDoLuoiZ: 8, gocXoayDo: 0 },
  { maVatPham: 'THAM_DET_THO_CAM', toaDoLuoiX: 3, toaDoLuoiZ: 5, gocXoayDo: 0 },
];

export function HouseFurnitureItem3D({
  item,
  roomSpanX = 3.35,
  roomSpanZ = 2.05,
  itemScale = 1,
  isSelected = false,
  onSelect,
}: {
  item: HouseFurnitureRenderItem;
  roomSpanX?: number;
  roomSpanZ?: number;
  itemScale?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  // Quy đổi tọa độ lưới 10x10 (0..9) sang tọa độ thực trên mặt sàn nhà
  const localX = ((Math.min(9, Math.max(0, item.toaDoLuoiX)) - 4.5) / 4.5) * roomSpanX;
  const localZ = ((Math.min(9, Math.max(0, item.toaDoLuoiZ)) - 4.5) / 4.5) * roomSpanZ;
  const rotY = ((item.gocXoayDo || 0) * Math.PI) / 180;

  return (
    <group
      position={[localX, 0, localZ]}
      rotation={[0, rotY, 0]}
      scale={itemScale}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {isSelected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.15, 28]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}
      {item.maVatPham === 'THAM_DET_THO_CAM' && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.2, 1.6]} />
          <meshStandardMaterial color="#fde68a" roughness={0.85} />
        </mesh>
      )}

      {item.maVatPham === 'THAM_LONG_CUU_TRON' && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.15, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      )}

      {item.maVatPham === 'SOFA_GO_PHONG_KHACH' && (
        <group>
          <mesh position={[-0.45, 0.32, 0]} castShadow>
            <boxGeometry args={[0.62, 0.42, 1.85]} />
            <meshStandardMaterial color="#92400e" roughness={0.6} />
          </mesh>
          <mesh position={[-0.68, 0.68, 0]} castShadow>
            <boxGeometry args={[0.14, 0.52, 1.85]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          <mesh position={[0.38, 0.3, 0]} castShadow>
            <boxGeometry args={[0.72, 0.4, 1.15]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          <mesh position={[0.38, 0.56, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.14, 10]} />
            <meshStandardMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'SOFA_DA_HIEN_DAI' && (
        <group>
          <mesh position={[-0.42, 0.34, 0]} castShadow>
            <boxGeometry args={[0.72, 0.44, 1.95]} />
            <meshStandardMaterial color="#0f766e" roughness={0.35} />
          </mesh>
          <mesh position={[-0.68, 0.72, 0]} castShadow>
            <boxGeometry args={[0.2, 0.55, 1.95]} />
            <meshStandardMaterial color="#115e59" roughness={0.35} />
          </mesh>
          <mesh position={[0.42, 0.28, 0]} castShadow>
            <boxGeometry args={[0.75, 0.35, 1.2]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.8} metalness={0.4} />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'KE_TIVI_CO_DIEN' && (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[1.75, 0.48, 0.46]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.88, 0]} castShadow>
            <boxGeometry args={[1.38, 0.78, 0.08]} />
            <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.6} />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'GIUONG_GO_DON' && (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[1.55, 0.34, 2.05]} />
            <meshStandardMaterial color="#92400e" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[1.45, 0.16, 1.92]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.46, -0.3]} castShadow>
            <boxGeometry args={[1.47, 0.14, 1.2]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.54, 0.65]} castShadow>
            <boxGeometry args={[0.78, 0.12, 0.38]} />
            <meshStandardMaterial color="#fef08a" roughness={0.5} />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'GIUONG_HOANG_GIA' && (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.95, 0.4, 2.15]} />
            <meshStandardMaterial color="#b45309" metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.78, 0.98]} castShadow>
            <boxGeometry args={[1.95, 0.95, 0.16]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.48, -0.15]} castShadow>
            <boxGeometry args={[1.82, 0.18, 1.55]} />
            <meshStandardMaterial color="#be123c" roughness={0.45} />
          </mesh>
          <mesh position={[-0.42, 0.58, 0.68]} castShadow>
            <boxGeometry args={[0.65, 0.14, 0.38]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
          <mesh position={[0.42, 0.58, 0.68]} castShadow>
            <boxGeometry args={[0.65, 0.14, 0.38]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'BAN_HOC_DEN_LED' && (
        <group>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[1.35, 0.72, 0.68]} />
            <meshStandardMaterial color="#d97706" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[0.42, 0.04, 0.3]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
          <mesh position={[-0.45, 0.98, -0.15]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1} />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'KE_SACH_OXFORD' && (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.52, 1.75, 0.68]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          <mesh position={[0.04, 1.2, 0]}>
            <boxGeometry args={[0.46, 0.28, 0.52]} />
            <meshStandardMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0.04, 0.75, 0]}>
            <boxGeometry args={[0.46, 0.28, 0.52]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'DAN_PIANO_CO_DIEN' && (
        <group>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[1.45, 1.15, 0.58]} />
            <meshStandardMaterial color="#0f172a" roughness={0.18} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.68, 0.32]} castShadow>
            <boxGeometry args={[1.32, 0.1, 0.22]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0.26, 0.65]} castShadow>
            <boxGeometry args={[0.68, 0.42, 0.35]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'TU_LANH_2_CANH' && (
        <group>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.88, 1.85, 0.72]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.95, 0.37]}>
            <boxGeometry args={[0.03, 1.75, 0.02]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'BE_CA_CANH_LED' && (
        <group>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[1.25, 0.58, 0.52]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[1.18, 0.52, 0.46]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0284c7"
              emissiveIntensity={0.6}
              transparent
              opacity={0.82}
            />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'CAY_MONSTERA' && (
        <group>
          <mesh position={[0, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.45, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <dodecahedronGeometry args={[0.38, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
        </group>
      )}

      {item.maVatPham === 'DEN_CAY_PHONG_KHACH' && (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.16, 1.45, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.52, 0]}>
            <coneGeometry args={[0.32, 0.38, 14]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// NGÔI NHÀ CẤP 4 MẶC ĐỊNH CỦA NGƯỜI CHƠI (PLAYER STARTER HOUSE CẤP 4)
// ============================================================================
export function PlayerStarterHouseCap4({
  position = [-10.5, 0, 32],
  ownerName = 'Bạn',
  houseTitle,
  wallColor = '#f5ebd6',
  roofColor = '#b93829',
  showInteriorCutaway = false,
  isMyHouse = true,
  plotLabel = '',
  furnitureList,
  onClickManageHouse,
}: {
  position?: [number, number, number];
  ownerName?: string;
  houseTitle?: string;
  wallColor?: string;
  roofColor?: string;
  showInteriorCutaway?: boolean;
  isMyHouse?: boolean;
  plotLabel?: string;
  furnitureList?: HouseFurnitureRenderItem[];
  onClickManageHouse?: () => void;
}) {
  const roofTex = useRoofTileTexture(roofColor, 6, 4);
  const courtyardTex = useCourtyardTileTexture(6, 5);
  const floorTex = useIndoorFloorTexture(6, 5);

  const displayTitle = houseTitle || `Nhà Cấp 4 của ${ownerName}`;
  const activeFurniture =
    furnitureList && furnitureList.length > 0 ? furnitureList : FALLBACK_FURNITURE_LIST;

  return (
    <group position={position}>
      {/* 1. SÂN GẠCH ĐỎ HẠ LONG & NỀN MÓNG NHÀ CẤP 4 */}
      <mesh position={[0, 0.03, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 11.2]} />
        <meshStandardMaterial
          map={courtyardTex || undefined}
          color="#c85a48"
          roughness={0.75}
        />
      </mesh>

      {/* Lối đi lát đá từ vỉa hè vào cổng nhà */}
      <mesh position={[0, 0.035, -6.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, 2.2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* 2. TƯỜNG RÀO & CỔNG NHÀ CẤP 4 (MỞ CỔNG PHÍA NAM Z = -5.0 ĐỂ ĐI VÀO) */}
      {/* Hàng rào mặt tiền bên trái & phải cổng */}
      {[-3.6, 3.6].map((x, idx) => (
        <group key={`front-fence-${idx}`} position={[x, 0, -5.0]}>
          {/* Chân tường gạch đỏ */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.35, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4.4, 0.7, 0.25]} />
              <meshStandardMaterial color="#e2dcd3" roughness={0.6} />
            </mesh>
          </RigidBody>
          {/* Nan sắt sơn đen/vàng đồng phía trên */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[4.2, 0.45, 0.08]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Hai trụ cổng chính ốp đá có đèn cổng phát sáng */}
      {[-1.35, 1.35].map((x, i) => (
        <group key={`gate-pillar-${i}`} position={[x, 0, -5.0]}>
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.9, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.48, 1.8, 0.48]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
          </RigidBody>
          {/* Mũ trụ cổng */}
          <mesh position={[0, 1.86, 0]} castShadow>
            <boxGeometry args={[0.58, 0.12, 0.58]} />
            <meshStandardMaterial color={roofColor} roughness={0.5} />
          </mesh>
          {/* Đèn cầu trang trí trên đỉnh trụ cổng */}
          <mesh position={[0, 2.08, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={0.85}
            />
          </mesh>
        </group>
      ))}

      {/* Cánh cổng sắt 2 bên đang mở đón chủ nhà */}
      <mesh position={[-1.15, 0.8, -4.4]} rotation={[0, Math.PI / 3, 0]} castShadow>
        <boxGeometry args={[1.1, 1.35, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.15, 0.8, -4.4]} rotation={[0, -Math.PI / 3, 0]} castShadow>
        <boxGeometry args={[1.1, 1.35, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3. NỀN NHÀ CAO (FOUNDATION PLINTH) & BẬC TAM CẤP */}
      {/* Nền móng nhà ốp đá rối xám */}
      <mesh position={[0, 0.22, 1.4]} receiveShadow castShadow>
        <boxGeometry args={[9.2, 0.44, 7.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      {/* Sàn gạch bông bên trong nhà cấp 4 */}
      <mesh position={[0, 0.45, 1.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.8, 5.8]} />
        <meshStandardMaterial
          map={floorTex || undefined}
          color="#fffbeb"
          roughness={0.3}
        />
      </mesh>
      {/* Sàn hiên nhà phía trước */}
      <mesh position={[0, 0.445, -1.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.8, 1.25]} />
        <meshStandardMaterial color="#d97706" roughness={0.45} />
      </mesh>

      {/* Bậc tam cấp lát đá hoa cương trước hiên nhà */}
      <mesh position={[0, 0.12, -2.5]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 0.16, 0.7]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, -2.3]} receiveShadow castShadow>
        <boxGeometry args={[2.5, 0.16, 0.45]} />
        <meshStandardMaterial color="#334155" roughness={0.35} />
      </mesh>

      {/* 2 Cột trụ vuông hiên nhà cấp 4 */}
      {[-3.8, 3.8].map((x, idx) => (
        <group key={`porch-col-${idx}`} position={[x, 0, -1.9]}>
          {/* Chân đế cột ốp đá */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.42, 0.65, 0.42]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
          {/* Thân cột sơn trắng kem */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[0.32, 2.5, 0.32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 4. HỆ TƯỜNG BAO QUANH NHÀ CẤP 4 (CHỪA CỬA CHÍNH Ở GIỮA ĐỂ ĐI VÀO TRONG NHÀ) */}
      {/* Tường hậu phía Bắc (Z = 4.7) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.0, 4.7]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8.8, 3.2, 0.28]} />
          <meshStandardMaterial color={wallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường hồi bên Trái (X = -4.3) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-4.3, 2.0, 1.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 3.2, 5.8]} />
          <meshStandardMaterial color={wallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường hồi bên Phải (X = 4.3) */}
      <RigidBody type="fixed" colliders="cuboid" position={[4.3, 2.0, 1.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 3.2, 5.8]} />
          <meshStandardMaterial color={wallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường mặt tiền bên Trái cửa chính (X = -2.65, Z = -0.95) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-2.65, 2.0, -0.95]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.1, 3.2, 0.28]} />
          <meshStandardMaterial color={wallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường mặt tiền bên Phải cửa chính (X = 2.65, Z = -0.95) */}
      <RigidBody type="fixed" colliders="cuboid" position={[2.65, 2.0, -0.95]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.1, 3.2, 0.28]} />
          <meshStandardMaterial color={wallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Đà lanh-tô phía trên cửa chính */}
      <mesh position={[0, 3.15, -0.95]} castShadow>
        <boxGeometry args={[2.2, 0.9, 0.28]} />
        <meshStandardMaterial color={wallColor} roughness={0.55} />
      </mesh>

      {/* Cánh cửa gỗ Pano mở 2 bên lối vào chính */}
      <mesh position={[-1.02, 1.55, -1.15]} rotation={[0, Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[0.55, 2.2, 0.08]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      <mesh position={[1.02, 1.55, -1.15]} rotation={[0, -Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[0.55, 2.2, 0.08]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>

      {/* Thảm phát sáng trước cửa chính: Đi bộ vào cửa để bước vào Không Gian Trong Nhà */}
      <group position={[0, 0.46, -1.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 1.1]} />
          <meshStandardMaterial
            color={isMyHouse ? '#f59e0b' : '#10b981'}
            emissive={isMyHouse ? '#ea580c' : '#059669'}
            emissiveIntensity={0.85}
            transparent
            opacity={0.85}
          />
        </mesh>
        <Html position={[0, 0.85, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              color: '#fef08a',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '999px',
              border: '1.5px solid #fbbf24',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚪 Bước vào cửa để vào Không Gian Nhà
          </div>
        </Html>
      </group>

      {/* 2 Cửa sổ mặt tiền có khung gỗ, kính xanh & bồn hoa dưới cửa sổ */}
      {[-2.65, 2.65].map((wx, idx) => (
        <group key={`window-${idx}`} position={[wx, 1.95, -1.12]}>
          {/* Khung bao cửa sổ gỗ */}
          <mesh castShadow>
            <boxGeometry args={[1.45, 1.35, 0.08]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Kính cửa sổ phản chiếu */}
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[1.25, 1.15, 0.06]} />
            <meshStandardMaterial
              color="#7dd3fc"
              roughness={0.15}
              metalness={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Mái hắt ngói nhỏ trên cửa sổ */}
          <mesh position={[0, 0.78, -0.15]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
            <boxGeometry args={[1.65, 0.1, 0.45]} />
            <meshStandardMaterial color={roofColor} roughness={0.5} />
          </mesh>
          {/* Bồn hoa nhỏ dưới cửa sổ */}
          <mesh position={[0, -0.78, -0.15]} castShadow>
            <boxGeometry args={[1.5, 0.25, 0.35]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} />
          </mesh>
          <mesh position={[-0.35, -0.58, -0.15]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0, -0.56, -0.15]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
          <mesh position={[0.35, -0.58, -0.15]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}

      {/* 5. NỘI THẤT 3D BÊN TRONG NHÀ CẤP 4 (HIỂN THỊ RÕ KHI BƯỚC VÀO NHÀ & TỰ DO TRANG TRÍ) */}
      <group position={[0, 0.46, 1.8]}>
        {activeFurniture.map((item, idx) => (
          <HouseFurnitureItem3D
            key={`${item.maVatPham}-${item.toaDoLuoiX}-${item.toaDoLuoiZ}-${idx}`}
            item={item}
          />
        ))}

        {/* Đèn trần ấm áp chiếu sáng nội thất nhà cấp 4 */}
        <pointLight position={[0, 2.6, 0]} color="#fef08a" intensity={0.95} distance={10} />

        {/* ICON NHỎ TRONG NHÀ ĐỂ MUA NỘI THẤT BẰNG XU & TỰ DO TRANG TRÍ KHI BƯỚC VÀO TRONG NHÀ */}
        {showInteriorCutaway && isMyHouse && (
          <Html
            position={[0, 2.15, -0.3]}
            center
            zIndexRange={[15, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClickManageHouse?.();
              }}
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '12px',
                borderRadius: '999px',
                border: '2px solid #fef08a',
                boxShadow: '0 8px 22px rgba(234, 88, 12, 0.65)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <span>🛋️</span>
              <span>Mua & Trang Trí Nội Thất ({activeFurniture.length} món)</span>
            </button>
          </Html>
        )}

        {/* KHI BƯỚC VÀO THĂM NHÀ BẠN BÈ ĐANG ONLINE */}
        {showInteriorCutaway && !isMyHouse && (
          <Html
            position={[0, 2.15, -0.3]}
            center
            zIndexRange={[15, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                padding: '5px 12px',
                background: 'linear-gradient(135deg, #059669, #0284c7)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11px',
                borderRadius: '999px',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              👀 Đang xem nội thất nhà của {ownerName} ({activeFurniture.length} món)
            </div>
          </Html>
        )}
      </group>

      {/* 6. MÁI NGÓI ĐỎ ĐẤT NUNG TRUYỀN THỐNG (TỰ ĐỘNG MỜ ĐI KHI XEM NỘI THẤT) */}
      <group position={[0, 3.65, 1.35]}>
        {/* Diềm mái trắng bao quanh */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[9.7, 0.22, 7.7]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.4}
            transparent={showInteriorCutaway}
            opacity={showInteriorCutaway ? 0.18 : 1.0}
          />
        </mesh>

        {/* Mái dốc phía Trước (Nghiêng về phía sân) */}
        <mesh
          position={[0, 0.95, -1.85]}
          rotation={[Math.PI / 5.2, 0, 0]}
          castShadow={!showInteriorCutaway}
          receiveShadow
        >
          <boxGeometry args={[9.8, 0.18, 4.35]} />
          <meshStandardMaterial
            map={roofTex || undefined}
            color={roofColor}
            roughness={0.55}
            transparent={showInteriorCutaway}
            opacity={showInteriorCutaway ? 0.15 : 1.0}
          />
        </mesh>

        {/* Mái dốc phía Sau */}
        <mesh
          position={[0, 0.95, 1.85]}
          rotation={[-Math.PI / 5.2, 0, 0]}
          castShadow={!showInteriorCutaway}
          receiveShadow
        >
          <boxGeometry args={[9.8, 0.18, 4.35]} />
          <meshStandardMaterial
            map={roofTex || undefined}
            color={roofColor}
            roughness={0.55}
            transparent={showInteriorCutaway}
            opacity={showInteriorCutaway ? 0.15 : 1.0}
          />
        </mesh>

        {/* Tam giác tường thu hồi 2 đầu mái (Gable ends) */}
        {[-4.35, 4.35].map((gx, i) => (
          <mesh
            key={`gable-${i}`}
            position={[gx, 0.85, 0]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow={!showInteriorCutaway}
          >
            <coneGeometry args={[2.75, 1.85, 3]} />
            <meshStandardMaterial
              color={wallColor}
              roughness={0.6}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
        ))}

        {/* Bờ nóc mái ngói trắng đắp nổi truyền thống */}
        <mesh position={[0, 1.98, 0]} castShadow={!showInteriorCutaway}>
          <boxGeometry args={[9.9, 0.24, 0.32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.4}
            transparent={showInteriorCutaway}
            opacity={showInteriorCutaway ? 0.2 : 1.0}
          />
        </mesh>
      </group>

      {/* 7. CÂY CẢNH SÂN VƯỜN & BÀN ĐÁ NGOÀI SÂN NHÀ CẤP 4 */}
      <CartoonTree position={[-4.2, 0, -3.2]} scale={0.95} color="#15803d" />
      <FlowerBush position={[3.8, 0, -3.5]} color="#f43f5e" />
      <FlowerBush position={[-2.2, 0, -2.4]} color="#fbbf24" />
      <FlowerBush position={[2.2, 0, -2.4]} color="#ec4899" />

      {/* 8. BIỂN TÊN NHÀ CẤP 4 CỦA NGƯỜI CHƠI NỔI TRÊN CỔNG */}
      <Html position={[0, 5.9, -1.5]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          onClick={onClickManageHouse}
          style={{
            padding: '5px 14px',
            background: isMyHouse
              ? 'linear-gradient(135deg, #b91c1c, #ea580c)'
              : 'linear-gradient(135deg, #047857, #0284c7)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '12px',
            borderRadius: '14px',
            border: isMyHouse ? '2px solid #fef08a' : '2px solid #a7f3d0',
            boxShadow: isMyHouse
              ? '0 6px 20px rgba(185, 28, 28, 0.55)'
              : '0 6px 20px rgba(4, 120, 87, 0.55)',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>
            {isMyHouse ? '🏡' : '🏘️'} {displayTitle.toUpperCase()}
          </span>
          <span
            style={{
              backgroundColor: isMyHouse ? '#fef08a' : '#a7f3d0',
              color: isMyHouse ? '#7c2d12' : '#064e3b',
              padding: '1px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            {isMyHouse ? (plotLabel ? `NHÀ BẠN • ${plotLabel.split('•')[0].trim()}` : 'NHÀ BẠN') : 'HÀNG XÓM'}
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Đài phun nước đá cẩm thạch trung tâm (Central Fountain)
 */
export function CentralFountain({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const waterSpoutRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (waterSpoutRef.current) {
      waterSpoutRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={position}>
      {/* Bậc thềm đá bát giác & thành hồ cẩm thạch */}
      <RigidBody type="fixed" colliders="hull" position={[0, 0.42, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[4.6, 5.0, 0.84, 32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* Viền gờ đá hoa cương trên thành hồ */}
      <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.1, 4.75, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
      </mesh>

      {/* Mặt nước hồ xanh ngọc trong vắt */}
      <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.15, 32]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.08}
          metalness={0.55}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Tầng tháp đá thứ 2 */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[2.3, 0.85, 1.25, 24]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.1, 24]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.15} transparent opacity={0.9} />
      </mesh>

      {/* Tầng đài trên cùng & Quả cầu đồng mạ vàng */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[1.05, 0.42, 1.15, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.25, 0]} castShadow>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.75} />
      </mesh>

      {/* Tia nước phun nghệ thuật */}
      <group ref={waterSpoutRef} position={[0, 3.35, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.18, 0.05, 1.2, 10]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.8} />
        </mesh>
        {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map(
          (angle, i) => (
            <mesh
              key={i}
              position={[Math.cos(angle) * 1.0, 0.05, Math.sin(angle) * 1.0]}
              rotation={[0, angle, Math.PI / 4]}
            >
              <cylinderGeometry args={[0.05, 0.025, 1.35, 8]} />
              <meshStandardMaterial color="#e0f2fe" transparent opacity={0.75} />
            </mesh>
          )
        )}
      </group>
    </group>
  );
}

/**
 * Hồ sinh thái & Cầu cảng gỗ câu cá chân thực (Fishing Lake & Pier)
 */
export function FishingLakeAndPier({
  position = [-36, 0, -28],
}: {
  position?: [number, number, number];
  onNearFishingPier?: (isNear: boolean) => void;
}) {
  return (
    <group position={position}>
      {/* Bờ kè đá tự nhiên & bãi cát ven hồ */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22.5, 20.5]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
      </mesh>

      {/* Lòng hồ nước xanh thẳm có độ phản xạ mặt nước */}
      <mesh position={[0, 0.08, -0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20.2, 18.2]} />
        <meshStandardMaterial
          color="#0369a1"
          roughness={0.06}
          metalness={0.65}
          transparent
          opacity={0.94}
        />
      </mesh>

      {/* Đá tảng tự nhiên quanh bờ hồ */}
      {[
        [-9.5, 0.3, 8.2, 0.7],
        [-7.8, 0.25, 8.5, 0.5],
        [8.5, 0.35, 8.0, 0.8],
        [-9.8, 0.3, -8.5, 0.75],
        [9.2, 0.28, -7.8, 0.65],
      ].map(([rx, ry, rz, rScale], idx) => (
        <mesh key={idx} position={[rx, ry, rz]} scale={rScale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.0, 1]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      ))}

      {/* Cầu cảng gỗ sồi có lan can dây thừng */}
      <RigidBody type="fixed" colliders="cuboid" position={[2, 0.38, 3.5]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3.8, 0.24, 11.2]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Ván gỗ ghép trên mặt cầu tàu */}
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={i} position={[2, 0.51, -1.6 + i * 1.02]} receiveShadow>
          <boxGeometry args={[3.9, 0.04, 0.85]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#92400e' : '#78350f'} roughness={0.85} />
        </mesh>
      ))}

      {/* Cọc trụ gỗ & Trụ đèn lồng hai bên cầu cảng */}
      {[-1, 1].map((side) =>
        [-1.2, 2.0, 5.2, 8.4].map((zPos, j) => (
          <group key={`${side}-${j}`} position={[2 + side * 1.75, 0, zPos]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.16, 1.9, 10]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            {j === 0 && (
              <mesh position={[0, 1.58, 0]}>
                <sphereGeometry args={[0.16, 10, 10]} />
                <meshStandardMaterial
                  color="#fef08a"
                  emissive="#f59e0b"
                  emissiveIntensity={1.1}
                />
              </mesh>
            )}
          </group>
        ))
      )}

      {/* Biển gỗ Bến Câu Cá */}
      <group position={[4.6, 0.3, 8.4]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 2.2, 8]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <boxGeometry args={[2.2, 0.9, 0.16]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
        <Html position={[0, 2.55, 0.1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '4px 12px',
              backgroundColor: '#0369a1',
              color: '#fff',
              fontWeight: 800,
              fontSize: '11px',
              borderRadius: '10px',
              border: '1.5px solid #bae6fd',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🎣 BẾN CẢNG CÂU CÁ (NHẤN F)
          </div>
        </Html>
      </group>
    </group>
  );
}

/**
 * Học viện & Trường học kiến trúc Châu Âu (Play School & Academy)
 */
export function PlaySchoolBuilding({ position = [-35, 0, 36] }: { position?: [number, number, number] }) {
  const roofTex = useRoofTileTexture('#991b1b', 8, 4);

  return (
    <group position={position}>
      {/* Bậc thềm đá nền trường */}
      <mesh position={[0, 0.2, 0.4]} receiveShadow castShadow>
        <boxGeometry args={[13.6, 0.4, 9.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Khối kiến trúc chính tường gạch đỏ kết hợp phào chỉ kem */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[12.8, 7.2, 8.2]} />
          <meshStandardMaterial color="#f5ebe0" roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Chân tường tầng 1 ốp gạch đỏ cổ điển */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.95, 2.2, 8.35]} />
        <meshStandardMaterial color="#9a3412" roughness={0.75} />
      </mesh>

      {/* Gờ phào chỉ phân tầng */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <boxGeometry args={[13.1, 0.22, 8.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[13.1, 0.22, 8.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Sảnh chính Portico với 4 cột đá trắng */}
      <mesh position={[0, 2.8, 4.6]} castShadow>
        <boxGeometry args={[4.4, 0.3, 1.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {[-1.8, -0.9, 0.9, 1.8].map((cx, i) => (
        <mesh key={i} position={[cx, 1.5, 5.0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 2.6, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} />
        </mesh>
      ))}

      {/* Cửa gỗ đôi lớn lối vào trường */}
      <mesh position={[0, 1.5, 4.18]}>
        <boxGeometry args={[2.2, 2.5, 0.12]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>

      {/* Hệ thống cửa sổ chia ô kiến trúc cổ điển */}
      {[-4.4, -2.5, 2.5, 4.4].map((wx, i) =>
        [1.5, 3.8, 6.0].map((wy, j) => (
          <group key={`${i}-${j}`} position={[wx, wy, 4.15]}>
            <mesh castShadow>
              <boxGeometry args={[1.35, 1.45, 0.1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[1.15, 1.25, 0.08]} />
              <meshStandardMaterial color="#1e3a5f" roughness={0.15} metalness={0.6} />
            </mesh>
          </group>
        ))
      )}

      {/* Mái ngói dốc chữ A lớn */}
      <mesh position={[0, 8.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[13.6, 1.4, 9.0]} />
        <meshStandardMaterial
          map={roofTex || undefined}
          color="#991b1b"
          roughness={0.55}
        />
      </mesh>

      {/* Tháp đồng hồ trung tâm có mặt đồng hồ & kim chỉ giờ */}
      <mesh position={[0, 9.8, 0]} castShadow>
        <boxGeometry args={[2.8, 2.8, 2.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>
      <mesh position={[0, 9.9, 1.43]}>
        <circleGeometry args={[0.92, 24]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.2} />
      </mesh>
      <mesh position={[0, 10.1, 1.45]}>
        <boxGeometry args={[0.08, 0.55, 0.04]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.2, 9.9, 1.45]}>
        <boxGeometry args={[0.45, 0.08, 0.04]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, 12.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 2.2, 4]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.4} />
      </mesh>

      <Html position={[0, 7.6, 4.5]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#991b1b',
            color: '#fef08a',
            fontWeight: 900,
            fontSize: '12px',
            borderRadius: '12px',
            border: '2px solid #fef08a',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.45)',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🏫 KAIA ROYAL ACADEMY
        </div>
      </Html>
    </group>
  );
}

/**
 * Thư viện Quốc tế Oxford kiến trúc Tân cổ điển (City Library Building)
 */
export function CityLibraryBuilding({ position = [-35, 0, 13] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Bậc thềm đá cẩm thạch rộng */}
      <mesh position={[0, 0.25, 0.5]} receiveShadow castShadow>
        <boxGeometry args={[11.4, 0.5, 8.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>

      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10.6, 6.3, 7.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
      </RigidBody>

      {/* Mái vòm đá cổ điển & trán tường tam giác (Pediment) */}
      <mesh position={[0, 6.8, 0]} castShadow>
        <boxGeometry args={[11.2, 0.7, 7.8]} />
        <meshStandardMaterial color="#334155" roughness={0.45} />
      </mesh>
      <mesh position={[0, 7.75, 0]} castShadow>
        <sphereGeometry args={[2.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0369a1" roughness={0.35} metalness={0.3} />
      </mesh>

      {/* Hàng 6 cột đá La Mã mặt tiền */}
      {[-4.2, -2.5, -0.85, 0.85, 2.5, 4.2].map((x, idx) => (
        <group key={idx} position={[x, 3.3, 3.85]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.26, 0.32, 5.8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          <mesh position={[0, 2.95, 0]}>
            <boxGeometry args={[0.72, 0.25, 0.72]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>
      ))}

      {/* Cửa kính vòm cao */}
      {[-3.3, 0, 3.3].map((wx, idx) => (
        <mesh key={idx} position={[wx, 2.8, 3.62]}>
          <boxGeometry args={[1.4, 4.2, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
        </mesh>
      ))}

      <Html position={[0, 7.4, 4.0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: '#1e3a8a',
            color: '#fff',
            fontWeight: 800,
            fontSize: '11px',
            borderRadius: '10px',
            border: '1.5px solid #93c5fd',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          📚 OXFORD CENTRAL LIBRARY
        </div>
      </Html>
    </group>
  );
}

/**
 * Tiệm Cafe & Bánh Ngọt Phong Cách Châu Âu (Plaza Cafe & Bakery)
 */
export function PlazaCafe({
  position = [34, 0, 35],
  onOpenShop,
}: {
  position?: [number, number, number];
  onOpenShop?: () => void;
}) {
  return (
    <group position={position}>
      {/* Sàn gỗ Patio ngoài trời */}
      <mesh position={[0, 0.06, 5.4]} receiveShadow>
        <boxGeometry args={[10.2, 0.12, 3.6]} />
        <meshStandardMaterial color="#92400e" roughness={0.75} />
      </mesh>

      {/* Khối nhà chính tường gạch kem & chân tường gạch nâu */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[9.8, 5.6, 7.2]} />
          <meshStandardMaterial color="#faf5ef" roughness={0.45} />
        </mesh>
      </RigidBody>

      {/* Chân tường ốp gạch thẻ nâu ấm */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[9.92, 1.8, 7.32]} />
        <meshStandardMaterial color="#78350f" roughness={0.75} />
      </mesh>

      {/* Viền mái & Cục nóng điều hòa + Ống khói lò bánh trên sân thượng */}
      <mesh position={[0, 5.75, 0]} castShadow>
        <boxGeometry args={[10.3, 0.45, 7.7]} />
        <meshStandardMaterial color="#451a03" roughness={0.5} />
      </mesh>
      <mesh position={[2.8, 6.45, -1.5]} castShadow>
        <boxGeometry args={[1.2, 1.0, 0.9]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-3.0, 6.6, -1.8]} castShadow>
        <boxGeometry args={[0.9, 1.4, 0.9]} />
        <meshStandardMaterial color="#9a3412" roughness={0.8} />
      </mesh>

      {/* Mái hiên vải bạt sọc Đỏ Bordeaux - Kem */}
      <group position={[0, 3.2, 4.15]} rotation={[Math.PI / 7, 0, 0]}>
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh key={i} position={[-4.0 + i * 0.8, 0, 0]} castShadow>
            <boxGeometry args={[0.78, 0.14, 2.1]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#be123c' : '#fffbeb'} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Khung kính mặt tiền lớn nhìn xuyên vào quầy pha chế bên trong */}
      <mesh position={[0, 1.65, 3.63]}>
        <boxGeometry args={[7.8, 2.8, 0.08]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.1}
          metalness={0.6}
          transparent
          opacity={0.78}
        />
      </mesh>
      {/* Đèn vàng ấm hắt ra từ quầy Barista bên trong */}
      <mesh position={[0, 2.3, 3.2]}>
        <boxGeometry args={[6.2, 0.4, 0.4]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.2} />
      </mesh>

      {/* Thảm cửa ra vào Quán Cafe: Đi vào cửa để bước vào Không Gian Quán Cafe */}
      <group position={[0, 0.14, 4.35]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.3]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#ea580c"
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#fde68a',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '999px',
              border: '1.5px solid #f59e0b',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚪 Đi vào cửa Quán Cafe
          </div>
        </Html>
      </group>

      <Html position={[0, 5.8, 3.9]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#9f1239',
            color: '#fffbeb',
            fontWeight: 800,
            fontSize: '12px',
            borderRadius: '10px',
            border: '1.5px solid #fde68a',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>☕ LONDON ARTISAN CAFE</span>
          <span
            style={{
              backgroundColor: '#fde68a',
              color: '#881337',
              padding: '1px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            🚪 Bước vào cửa quán
          </span>
        </div>
      </Html>

      {/* Bàn ghế gỗ & Dù che nắng ngoài trời */}
      {[-2.8, 2.8].map((xOffset, i) => (
        <group key={i} position={[xOffset, 0.12, 5.5]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 0.9, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.95, 0.95, 0.08, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.9, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 2.75, 0]} castShadow>
            <coneGeometry args={[1.7, 0.75, 16]} />
            <meshStandardMaterial color={i === 0 ? '#9f1239' : '#0f766e'} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Nhà hàng Burger & Pizza Diner phong cách Retro Mỹ
 */
export function PizzaBurgerDiner({
  position = [35, 0, 13],
  onOpenShop,
}: {
  position?: [number, number, number];
  onOpenShop?: () => void;
}) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[9.0, 5.0, 6.8]} />
          <meshStandardMaterial color="#fff7ed" roughness={0.35} />
        </mesh>
      </RigidBody>

      {/* Dải sọc kim loại Inox & Đỏ Retro */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[9.4, 0.85, 7.2]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[9.3, 0.25, 7.1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Cửa sổ kính lớn mặt tiền */}
      <mesh position={[0, 1.7, 3.43]}>
        <boxGeometry args={[7.2, 2.4, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Mô hình Burger 3D biểu tượng trên mái */}
      <group position={[0, 5.4, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.1, 0.4, 24]} />
          <meshStandardMaterial color="#d97706" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1.38, 1.38, 0.26, 24]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[1.42, 1.42, 0.1, 24]} />
          <meshStandardMaterial color="#16a34a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.54, 0]} castShadow>
          <sphereGeometry args={[1.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      </group>

      {/* Thảm cửa ra vào Quán Ăn: Đi vào cửa để bước vào Không Gian Quán Ăn */}
      <group position={[0, 0.05, 4.15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.3]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#fef08a',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '999px',
              border: '1.5px solid #ef4444',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚪 Đi vào cửa Quán Ăn
          </div>
        </Html>
      </group>

      <Html position={[0, 5.4, 3.7]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#b91c1c',
            color: '#fef08a',
            fontWeight: 800,
            fontSize: '11px',
            borderRadius: '10px',
            border: '1.5px solid #fef08a',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🍔 ROUTE 66 BURGER DINER</span>
          <span
            style={{
              backgroundColor: '#fef08a',
              color: '#7f1d1d',
              padding: '1px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            🚪 Bước vào cửa quán
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Cửa hàng Thời Trang Cao Cấp (Royal Fashion Boutique - Quán Quần Áo)
 */
export function FashionBoutiqueBuilding({
  position = [12, 0, -34],
  onOpenShop,
}: {
  position?: [number, number, number];
  onOpenShop?: () => void;
}) {
  return (
    <group position={position}>
      {/* Khối kiến trúc Boutique phong cách Paris hồng pastel - vàng kim */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[9.2, 5.6, 7.0]} />
          <meshStandardMaterial color="#fdf2f8" roughness={0.35} />
        </mesh>
      </RigidBody>

      {/* Viền mái & Mái vòm trang trí */}
      <mesh position={[0, 5.7, 0]} castShadow>
        <boxGeometry args={[9.6, 0.6, 7.4]} />
        <meshStandardMaterial color="#be185d" roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.9, 0]}>
        <boxGeometry args={[9.4, 0.2, 7.2]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tủ kính trưng bày Mannequin thời trang mặt tiền */}
      {[-2.4, 2.4].map((wx, idx) => (
        <group key={idx} position={[wx, 1.65, 3.55]}>
          <mesh>
            <boxGeometry args={[2.6, 2.6, 0.12]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.1}
              metalness={0.5}
              transparent
              opacity={0.65}
            />
          </mesh>
          {/* Mannequin trưng bày váy áo bên trong tủ kính */}
          <mesh position={[0, -0.35, -0.25]} castShadow>
            <coneGeometry args={[0.42, 1.15, 12]} />
            <meshStandardMaterial color={idx === 0 ? '#ec4899' : '#38bdf8'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.42, -0.25]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#fde68a" />
          </mesh>
        </group>
      ))}

      {/* Cửa kính chính giữa */}
      <mesh position={[0, 1.5, 3.54]}>
        <boxGeometry args={[1.6, 2.5, 0.1]} />
        <meshStandardMaterial color="#fbcfe8" metalness={0.4} roughness={0.2} />
      </mesh>

      {/* Thảm cửa ra vào Tiệm Quần Áo: Đi vào cửa để bước vào Không Gian Tiệm Quần Áo */}
      <group position={[0, 0.05, 4.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.3]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#be185d"
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#fbcfe8',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '999px',
              border: '1.5px solid #ec4899',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚪 Đi vào cửa Tiệm Quần Áo
          </div>
        </Html>
      </group>

      <Html position={[0, 6.2, 3.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#be185d',
            color: '#fdf2f8',
            fontWeight: 800,
            fontSize: '12px',
            borderRadius: '10px',
            border: '1.5px solid #fbcfe8',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(190, 24, 93, 0.5)',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>👗 ROYAL FASHION BOUTIQUE</span>
          <span
            style={{
              backgroundColor: '#fef08a',
              color: '#831843',
              padding: '1px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            🚪 Bước vào cửa quán
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Showroom Xe Cộ & Siêu Xe Hiện Đại (Kaia Luxury Auto Showroom - Quán Xe)
 */
export function AutoShowroomBuilding({
  position = [-12, 0, -34],
  onOpenShop,
}: {
  position?: [number, number, number];
  onOpenShop?: () => void;
}) {
  const podiumCarRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (podiumCarRef.current) {
      podiumCarRef.current.rotation.y += delta * 0.65;
    }
  });

  return (
    <group position={position}>
      {/* Khối nhà Showroom kính & thép hiện đại */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.9, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10.4, 5.8, 7.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.6} />
        </mesh>
      </RigidBody>

      {/* Viền mái Alu xanh dương Neon */}
      <mesh position={[0, 5.9, 0]} castShadow>
        <boxGeometry args={[10.8, 0.65, 8.0]} />
        <meshStandardMaterial color="#0284c7" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* Mặt kính Showroom lớn nhìn thấy Siêu Xe trưng bày bên trong */}
      <mesh position={[0, 2.1, 3.84]}>
        <boxGeometry args={[9.2, 3.6, 0.1]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.08}
          metalness={0.4}
          transparent
          opacity={0.38}
        />
      </mesh>

      {/* Bục xoay trưng bày Siêu Xe Thể Thao bên trái sảnh Showroom */}
      <group position={[-3.6, 0.15, 5.8]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.1, 2.3, 0.3, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.85, 2.05, 28]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
        </mesh>

        {/* Mô hình Siêu Xe đỏ đang xoay trên bục */}
        <group ref={podiumCarRef} position={[0, 0.42, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[2.5, 0.42, 1.25]} />
            <meshStandardMaterial color="#ef4444" metalness={0.65} roughness={0.2} />
          </mesh>
          <mesh position={[-0.15, 0.5, 0]} castShadow>
            <boxGeometry args={[1.25, 0.34, 1.08]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} />
          </mesh>
          {[
            [-0.8, 0, 0.65],
            [0.8, 0, 0.65],
            [-0.8, 0, -0.65],
            [0.8, 0, -0.65],
          ].map(([wx, wy, wz], idx) => (
            <mesh key={idx} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.2, 12]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Thảm cửa ra vào Showroom Xe: Đi vào cửa để bước vào Không Gian Showroom */}
      <group position={[0, 0.05, 4.55]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.3]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.95}
            transparent
            opacity={0.85}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#bae6fd',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '999px',
              border: '1.5px solid #38bdf8',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🚪 Đi vào cửa Showroom Xe
          </div>
        </Html>
      </group>

      <Html position={[0, 6.4, 4.1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#0369a1',
            color: '#f0f9ff',
            fontWeight: 800,
            fontSize: '12px',
            borderRadius: '10px',
            border: '1.5px solid #7dd3fc',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.55)',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🚗 KAIA LUXURY AUTO SHOWROOM</span>
          <span
            style={{
              backgroundColor: '#fef08a',
              color: '#0c4a6e',
              padding: '1px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            🚪 Bước vào cửa quán
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Trung tâm thương mại & Siêu thị hiện đại (Super Mart Building)
 */
export function SuperMartBuilding({ position = [35, 0, -35] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[11.0, 6.0, 8.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
      </RigidBody>

      {/* Mặt dựng Alu xanh-tím hiện đại */}
      <mesh position={[0, 5.4, 0]} castShadow>
        <boxGeometry args={[11.4, 1.3, 8.4]} />
        <meshStandardMaterial color="#4338ca" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Sảnh kính trượt tự động */}
      <mesh position={[0, 1.8, 4.05]}>
        <boxGeometry args={[8.4, 3.2, 0.12]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.1}
          metalness={0.75}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Mái đón sảnh kính */}
      <mesh position={[0, 3.55, 4.8]} castShadow>
        <boxGeometry args={[5.6, 0.2, 1.6]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>

      <Html position={[0, 6.2, 4.3]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '5px 14px',
            backgroundColor: '#3730a3',
            color: '#fff',
            fontWeight: 800,
            fontSize: '12px',
            borderRadius: '10px',
            border: '1.5px solid #a5b4fc',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🛒 METRO HYPERMARKET
        </div>
      </Html>
    </group>
  );
}

/**
 * Rạp Chiếu Phim Quốc Tế (Star Cinema Theater)
 */
export function CinemaTheaterBuilding({ position = [35, 0, -13] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10.2, 6.8, 7.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
      </RigidBody>

      {/* Bảng đèn Marquee rạp chiếu phim */}
      <mesh position={[0, 4.8, 3.85]} castShadow>
        <boxGeometry args={[8.2, 1.6, 0.5]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.8, 4.12]}>
        <boxGeometry args={[7.6, 1.2, 0.08]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={0.65} />
      </mesh>

      {/* 2 Khung Poster phim phát sáng 2 bên sảnh */}
      {[-3.0, 3.0].map((px, i) => (
        <mesh key={i} position={[px, 2.0, 3.74]}>
          <boxGeometry args={[1.5, 2.2, 0.08]} />
          <meshStandardMaterial
            color={i === 0 ? '#38bdf8' : '#f43f5e'}
            emissive={i === 0 ? '#0284c7' : '#e11d48'}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Thảm đỏ lối vào VIP */}
      <mesh position={[0, 0.035, 5.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 3.6]} />
        <meshStandardMaterial color="#991b1b" roughness={0.7} />
      </mesh>

      <Html position={[0, 6.2, 4.1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: '#991b1b',
            color: '#fef08a',
            fontWeight: 900,
            fontSize: '12px',
            borderRadius: '10px',
            border: '1.5px solid #fef08a',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🎬 GRAND IMAX CINEMA
        </div>
      </Html>
    </group>
  );
}

/**
 * Tòa Cao Ốc Kính Văn Phòng & Khách Sạn 5 Sao (Realistic Curtain-Wall Skyscraper)
 */
export function SkyscraperTower({
  position,
  height = 18,
  wallColor = '#1e3a5f',
  roofColor = '#334155',
  title = '🏙️ DOWNTOWN TOWER',
}: {
  position: [number, number, number];
  height?: number;
  wallColor?: string;
  roofColor?: string;
  title?: string;
}) {
  const glassTex = useCurtainWallTexture(wallColor, 4, Math.max(4, Math.floor(height / 2.2)));

  return (
    <group position={position}>
      {/* Khối đế Podium sảnh đá Granite 2 tầng */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, height / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[9.2, height, 9.2]} />
          <meshStandardMaterial
            map={glassTex || undefined}
            color="#94a3b8"
            roughness={0.18}
            metalness={0.65}
          />
        </mesh>
      </RigidBody>

      {/* Khối đế đá Granite tầng trệt */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.8, 3.2, 9.8]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Cột trụ đứng kiến trúc chạy dọc 4 góc tòa tháp */}
      {[-4.6, 4.6].map((cx) =>
        [-4.6, 4.6].map((cz) => (
          <mesh key={`${cx}-${cz}`} position={[cx, height / 2, cz]} castShadow>
            <boxGeometry args={[0.55, height + 0.4, 0.55]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.4} />
          </mesh>
        ))
      )}

      {/* Mái sảnh kính Canopy tầng 1 */}
      <mesh position={[0, 3.1, 5.5]} castShadow>
        <boxGeometry args={[4.8, 0.18, 1.6]} />
        <meshStandardMaterial color="#bae6fd" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Tầng kỹ thuật & Bãi đáp trực thăng trên đỉnh tòa nhà */}
      <mesh position={[0, height + 0.5, 0]} castShadow>
        <boxGeometry args={[8.0, 1.0, 8.0]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, height + 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.5, 24]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {/* Cột thu lôi & đèn báo độ cao hàng không */}
      <mesh position={[0, height + 2.4, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 2.8, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[0, height + 3.85, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>

      <Html position={[0, height + 2.2, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontWeight: 800,
            fontSize: '11px',
            borderRadius: '8px',
            border: '1.5px solid #38bdf8',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {title}
        </div>
      </Html>
    </group>
  );
}

/**
 * Biệt thự sân vườn ngoại ô kiến trúc thật (Realistic Suburb Villa)
 */
export function CozySuburbHouse({
  position,
  wallColor = '#f5ebd6',
  roofColor = '#991b1b',
  ownerLabel,
}: {
  position: [number, number, number];
  wallColor?: string;
  roofColor?: string;
  ownerLabel?: string;
}) {
  const roofTex = useRoofTileTexture(roofColor, 5, 4);

  return (
    <group position={position}>
      {/* Sân lát đá trước nhà */}
      <mesh position={[0, 0.03, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.6, 8.2]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.75} />
      </mesh>

      {/* Thân nhà chính + Chân tường ốp đá */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6.4, 4.2, 5.8]} />
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[6.55, 0.9, 5.95]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Mái ngói dốc có ống khói gạch */}
      <mesh position={[0, 5.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[5.5, 2.6, 4]} />
        <meshStandardMaterial
          map={roofTex || undefined}
          color={roofColor}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[1.8, 5.6, -1.0]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.85} />
      </mesh>

      {/* Cửa gỗ & Mái hiên đón */}
      <mesh position={[0, 1.25, 2.93]}>
        <boxGeometry args={[1.35, 2.3, 0.1]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.65, 3.35]} castShadow>
        <boxGeometry args={[2.2, 0.16, 1.0]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>

      {/* Cửa sổ 2 bên có khung trắng */}
      {[-1.95, 1.95].map((x, i) => (
        <group key={i} position={[x, 2.0, 2.93]}>
          <mesh>
            <boxGeometry args={[1.3, 1.3, 0.08]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[1.1, 1.1, 0.08]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.15} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Hàng rào gỗ trắng trước sân */}
      <mesh position={[-2.2, 0.45, 4.5]} castShadow>
        <boxGeometry args={[2.4, 0.85, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[2.2, 0.45, 4.5]} castShadow>
        <boxGeometry args={[2.4, 0.85, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {ownerLabel && (
        <Html position={[0, 6.4, 1.5]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '3px 10px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontWeight: 800,
              fontSize: '10px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {ownerLabel}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Công viên trò chơi ngoài trời: Cầu trượt & Xích đu
 */
export function PlaygroundPark({ position = [-32, 0, -8] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Thảm cát an toàn dưới sân chơi */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 6.5]} />
        <meshStandardMaterial color="#fde68a" roughness={0.9} />
      </mesh>

      {/* Cầu trượt liên hoàn */}
      <group position={[-2.5, 0, 0]}>
        <mesh position={[-1.2, 1.0, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
          <boxGeometry args={[0.15, 2.6, 0.9]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[1.0, 0.85, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.15, 2.8, 1.1]} />
          <meshStandardMaterial color="#059669" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[1.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#b91c1c" />
        </mesh>
      </group>

      {/* Xích đu đôi */}
      <group position={[3.0, 0, 0]}>
        {[-1.5, 1.5].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[-0.4, 1.4, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 2.9, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.6} />
            </mesh>
            <mesh position={[0.4, 1.4, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 2.9, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 4.0, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
        {[-0.65, 0.65].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[-0.25, 1.5, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 2.1, 6]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0.25, 1.5, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 2.1, 6]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.6, 0.08, 0.4]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Khu cắm trại dã ngoại rừng thông bên hồ
 */
export function CampingZone({ position = [-42, 0, -42] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-3.2, 1.2, -1.5]} rotation={[0, Math.PI / 6, 0]} castShadow>
        <coneGeometry args={[2.1, 2.5, 4]} />
        <meshStandardMaterial color="#d97706" roughness={0.75} />
      </mesh>
      <mesh position={[3.2, 1.2, -1.5]} rotation={[0, -Math.PI / 6, 0]} castShadow>
        <coneGeometry args={[2.1, 2.5, 4]} />
        <meshStandardMaterial color="#15803d" roughness={0.75} />
      </mesh>

      {/* Đống lửa trại & Khúc gỗ ngồi xung quanh */}
      <group position={[0, 0, 1.2]}>
        <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 1.4, 8]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 1.4, 8]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <coneGeometry args={[0.45, 0.9, 8]} />
          <meshStandardMaterial color="#f97316" emissive="#ef4444" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Đèn tín hiệu giao thông ngã tư (Traffic Light)
 */
export function TrafficLight({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 4.2, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.75, 3.85, 0]}>
        <boxGeometry args={[1.6, 0.12, 0.12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>
      <mesh position={[1.25, 3.85, 0.1]}>
        <boxGeometry args={[0.38, 0.95, 0.25]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[1.25, 4.12, 0.24]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[1.25, 3.85, 0.24]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[1.25, 3.58, 0.24]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

/**
 * Ghế gỗ khung gang công viên (Park Bench)
 */
export function ParkBench({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.85, 0.09, 0.55]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, -0.24]} castShadow>
        <boxGeometry args={[1.85, 0.5, 0.08]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.12, 0.44, 0.52]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Cây xanh đô thị tán lá đa tầng tự nhiên + Bồn gạch gốc cây
 */
export function CartoonTree({
  position,
  scale = 1.0,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Bồn gạch bao quanh gốc cây */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.58, 0.62, 0.24, 12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>

      {/* Thân cây gỗ sồi và nhánh cây */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 2.0, 10]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </mesh>

      {/* Tán lá đa tầng nhiều sắc độ xanh rừng tự nhiên */}
      <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.75} />
      </mesh>
      <mesh position={[-0.55, 2.0, 0.35]} castShadow>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#40916c" roughness={0.75} />
      </mesh>
      <mesh position={[0.55, 2.1, -0.3]} castShadow>
        <dodecahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#1b4332" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <dodecahedronGeometry args={[0.92, 1]} />
        <meshStandardMaterial color="#52b788" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Bụi cây cảnh & Hoa đô thị
 */
export function FlowerBush({
  position,
  color = '#f43f5e',
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <dodecahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.85} />
      </mesh>
      <mesh position={[-0.14, 0.5, 0.1]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.16, 0.52, -0.06]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

/**
 * Vạch kẻ sang đường trắng (Zebra Crosswalk)
 */
function ZebraCrosswalk({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-2.0, -1.0, 0, 1.0, 2.0].map((offset, i) => (
        <mesh key={i} position={[offset, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.52, 2.6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Con đường nhựa Asphalt chân thực kèm bó vỉa bê tông & vỉa hè lát gạch
 */
function RoadStrip({
  position,
  length,
  width = 6.2,
  horizontal = false,
}: {
  position: [number, number, number];
  length: number;
  width?: number;
  horizontal?: boolean;
}) {
  const dashCount = Math.floor(length / 4.5);
  const asphaltTex = useAsphaltTexture(2, Math.max(4, Math.floor(length / 4)));

  return (
    <group position={position} rotation={[0, horizontal ? Math.PI / 2 : 0, 0]}>
      {/* Mặt đường nhựa Asphalt có hạt nhám */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          map={asphaltTex || undefined}
          color="#334155"
          roughness={0.85}
        />
      </mesh>

      {/* Vạch trắng liền mép đường 2 bên */}
      {[-width / 2 + 0.2, width / 2 - 0.2].map((lx, idx) => (
        <mesh key={idx} position={[lx, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, length]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
      ))}

      {/* Vỉa hè lát đá hoa cương hai bên đường */}
      <mesh position={[-width / 2 - 0.7, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.1, length]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[width / 2 + 0.7, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.1, length]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* Vạch vàng đứt nét phân làn ở giữa */}
      {Array.from({ length: dashCount }).map((_, i) => {
        const zPos = -length / 2 + 2.2 + i * 4.5;
        return (
          <mesh key={i} position={[0, 0.03, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 2.2]} />
            <meshStandardMaterial color="#eab308" roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Mặt đất Thảo nguyên tự nhiên & Hệ thống mạng lưới Đại lộ Thành phố (160m x 160m)
 */
export function PlayTogetherGround() {
  const grassTex = useGrassTexture(36, 36);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Thảm cỏ tự nhiên có vân cỏ thật toàn thành phố (160x160) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]} friction={0}>
        <mesh receiveShadow>
          <boxGeometry args={[160, 0.5, 160]} />
          <meshStandardMaterial
            map={grassTex || undefined}
            color="#589a60"
            roughness={0.85}
          />
        </mesh>
      </RigidBody>

      {/* 2. Quảng trường trung tâm lát đá Granite sáng sang trọng */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[13.2, 14.1, 48]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.6} />
      </mesh>

      {/* 3. VÒNG ĐAI ĐƯỜNG NỘI ĐÔ (INNER RING ROAD: X = ±21, Z = ±21) */}
      <RoadStrip position={[0, 0, -21]} length={48} horizontal />
      <RoadStrip position={[0, 0, 21]} length={48} horizontal />
      <RoadStrip position={[-21, 0, 0]} length={48} />
      <RoadStrip position={[21, 0, 0]} length={48} />

      {/* 4. VÒNG ĐAI ĐẠI LỘ NGOÀI (OUTER BOULEVARD: X = ±52, Z = ±52) */}
      <RoadStrip position={[0, 0, -52]} length={110} horizontal />
      <RoadStrip position={[0, 0, 52]} length={110} horizontal />
      <RoadStrip position={[-52, 0, 0]} length={110} />
      <RoadStrip position={[52, 0, 0]} length={110} />

      {/* 5. ĐẠI LỘ XUYÊN TÂM NỐI VÒNG ĐAI TRONG RA VÒNG ĐAI NGOÀI */}
      <RoadStrip position={[0, 0, -36.5]} length={25} />
      <RoadStrip position={[0, 0, 36.5]} length={25} />
      <RoadStrip position={[-36.5, 0, 0]} length={25} horizontal />
      <RoadStrip position={[36.5, 0, 0]} length={25} horizontal />

      {/* 6. Vạch sang đường người đi bộ (Zebra Crosswalks) */}
      <ZebraCrosswalk position={[0, 0, -17.5]} />
      <ZebraCrosswalk position={[0, 0, 17.5]} />
      <ZebraCrosswalk position={[-17.5, 0, 0]} rotationY={Math.PI / 2} />
      <ZebraCrosswalk position={[17.5, 0, 0]} rotationY={Math.PI / 2} />
      <ZebraCrosswalk position={[0, 0, -48.5]} />
      <ZebraCrosswalk position={[0, 0, 48.5]} />

      {/* 7. Tường biên vật lý giữ người chơi trong thành phố 160x160 */}
      <RigidBody type="fixed" colliders={false} position={[0, 4, -76]}>
        <CuboidCollider args={[78, 8, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 4, 76]}>
        <CuboidCollider args={[78, 8, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[-76, 4, 0]}>
        <CuboidCollider args={[1, 8, 78]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[76, 4, 0]}>
        <CuboidCollider args={[1, 8, 78]} />
      </RigidBody>
    </group>
  );
}
