'use client';

import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from './SafeHtml';
import { KeyPromptBadge } from './KeyPromptBadge';

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

/** Texture sàn gỗ sồi ấm áp sang trọng (Scandinavian Oak Herringbone/Plank) */
export function useWarmWoodParquetTexture(repeatX = 8, repeatY = 6) {
  return useMemo(
    () =>
      getOrCreateTexture('warm_oak_parquet', 512, 512, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#c89666';
        ctx.fillRect(0, 0, w, h);
        const plankH = 32;
        const plankW = 128;
        const rows = h / plankH;
        for (let r = 0; r < rows; r++) {
          const offset = (r % 2) * (plankW * 0.5);
          const cols = Math.ceil(w / plankW) + 2;
          for (let c = -1; c < cols; c++) {
            const x = c * plankW + offset;
            const y = r * plankH;
            const tone = (r * 7 + c * 13) % 4;
            ctx.fillStyle =
              tone === 0 ? '#d4a373' : tone === 1 ? '#c28f5c' : tone === 2 ? '#cb9967' : '#b8824f';
            ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

            // Vân gỗ tinh tế
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(x + 2, y + 9, plankW - 4, 1.5);
            ctx.fillRect(x + 2, y + 21, plankW - 4, 1.5);

            // Mạch ghép phay rãnh gỗ sồi
            ctx.strokeStyle = '#99653a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, plankW, plankH);
          }
        }
      }),
    [repeatX, repeatY]
  );
}

/** Texture gạch men phòng vệ sinh / phòng tắm sáng sạch chống trượt */
export function useBathroomTileTexture(repeatX = 6, repeatY = 6) {
  return useMemo(
    () =>
      getOrCreateTexture('bathroom_ceramic_tile', 256, 256, repeatX, repeatY, (ctx, w, h) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, w, h);
        const step = 64;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#f1f5f9' : '#e0f2fe';
            ctx.fillRect(c * step + 2, r * step + 2, step - 4, step - 4);
          }
        }
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
  { maVatPham: 'GIUONG_GO_DON', toaDoLuoiX: 8, toaDoLuoiZ: 0, gocXoayDo: 180 },
  { maVatPham: 'BAN_HOC_DEN_LED', toaDoLuoiX: 2, toaDoLuoiZ: 0, gocXoayDo: 0 },
  { maVatPham: 'KE_SACH_OXFORD', toaDoLuoiX: 3, toaDoLuoiZ: 0, gocXoayDo: 0 },
  { maVatPham: 'SOFA_GO_PHONG_KHACH', toaDoLuoiX: 1, toaDoLuoiZ: 6, gocXoayDo: 0 },
  { maVatPham: 'KE_TIVI_CO_DIEN', toaDoLuoiX: 3, toaDoLuoiZ: 6, gocXoayDo: 270 },
  { maVatPham: 'THAM_DET_THO_CAM', toaDoLuoiX: 2, toaDoLuoiZ: 6, gocXoayDo: 0 },
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
          <ringGeometry args={[1.05, 1.25, 28]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}

      {/* 1. THẢM DỆT THỔ CẨM / BOHEMIAN RUG */}
      {item.maVatPham === 'THAM_DET_THO_CAM' && (
        <group>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3.2, 2.3]} />
            <meshStandardMaterial color="#f5ebd6" roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2.85, 1.95]} />
            <meshStandardMaterial color="#e7d3b0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
            <planeGeometry args={[1.05, 1.05]} />
            <meshStandardMaterial color="#d97706" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
            <planeGeometry args={[0.62, 0.62]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.85} />
          </mesh>
          {[-1.64, 1.64].map((xPos, i) => (
            <mesh key={i} position={[xPos, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 2.24]} />
              <meshStandardMaterial color="#d6c5a9" roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}

      {/* 2. THẢM LÔNG CỪU TRÒN PASTEL */}
      {item.maVatPham === 'THAM_LONG_CUU_TRON' && (
        <group>
          <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.55, 32]} />
            <meshStandardMaterial color="#fce7f3" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.18, 28]} />
            <meshStandardMaterial color="#fbcfe8" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.72, 24]} />
            <meshStandardMaterial color="#fdf2f8" roughness={0.95} />
          </mesh>
        </group>
      )}

      {/* 3. BỘ TRƯỜNG KỶ GỖ SỒI & BÀN TRÀ JAPANDI */}
      {item.maVatPham === 'SOFA_GO_PHONG_KHACH' && (
        <group>
          {[
            [-0.72, -0.82],
            [-0.72, 0.82],
            [-0.18, -0.82],
            [-0.18, 0.82],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 0.1, z]} castShadow>
              <cylinderGeometry args={[0.035, 0.025, 0.2, 8]} />
              <meshStandardMaterial color="#5c2d0c" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[-0.45, 0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.78, 0.1, 1.95]} />
            <meshStandardMaterial color="#854d0e" roughness={0.55} />
          </mesh>
          <mesh position={[-0.42, 0.34, -0.46]} castShadow>
            <boxGeometry args={[0.7, 0.16, 0.88]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.85} />
          </mesh>
          <mesh position={[-0.42, 0.34, 0.46]} castShadow>
            <boxGeometry args={[0.7, 0.16, 0.88]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.85} />
          </mesh>
          <mesh position={[-0.78, 0.56, 0]} castShadow>
            <boxGeometry args={[0.1, 0.62, 1.95]} />
            <meshStandardMaterial color="#713f12" roughness={0.55} />
          </mesh>
          <mesh position={[-0.66, 0.56, -0.46]} rotation={[0, 0, -0.12]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.82]} />
            <meshStandardMaterial color="#e7e5e4" roughness={0.85} />
          </mesh>
          <mesh position={[-0.66, 0.56, 0.46]} rotation={[0, 0, -0.12]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.82]} />
            <meshStandardMaterial color="#e7e5e4" roughness={0.85} />
          </mesh>
          <mesh position={[-0.45, 0.44, -0.92]} castShadow>
            <boxGeometry args={[0.76, 0.34, 0.1]} />
            <meshStandardMaterial color="#713f12" roughness={0.55} />
          </mesh>
          <mesh position={[-0.45, 0.44, 0.92]} castShadow>
            <boxGeometry args={[0.76, 0.34, 0.1]} />
            <meshStandardMaterial color="#713f12" roughness={0.55} />
          </mesh>
          <mesh position={[-0.55, 0.52, -0.68]} rotation={[0.2, 0.25, -0.15]} castShadow>
            <boxGeometry args={[0.12, 0.28, 0.28]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
          <mesh position={[-0.55, 0.52, 0.68]} rotation={[-0.2, -0.25, -0.15]} castShadow>
            <boxGeometry args={[0.12, 0.28, 0.28]} />
            <meshStandardMaterial color="#0d9488" roughness={0.8} />
          </mesh>

          {[
            [0.25, -0.45],
            [0.25, 0.45],
            [0.75, -0.45],
            [0.75, 0.45],
          ].map(([x, z], idx) => (
            <mesh key={`tbl-leg-${idx}`} position={[x, 0.14, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.02, 0.28, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} />
            </mesh>
          ))}
          <mesh position={[0.5, 0.31, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.75, 0.07, 1.2]} />
            <meshStandardMaterial color="#a16207" roughness={0.45} />
          </mesh>
          <mesh position={[0.5, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.22, 0.03, 16]} />
            <meshStandardMaterial color="#d6d3d1" roughness={0.4} />
          </mesh>
          <mesh position={[0.48, 0.43, -0.06]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.11, 12]} />
            <meshStandardMaterial color="#0f766e" roughness={0.25} />
          </mesh>
          <mesh position={[0.56, 0.4, 0.1]}>
            <cylinderGeometry args={[0.04, 0.035, 0.06, 10]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* 4. SOFA DA BẮC ÂU L-SHAPE CAO CẤP & BÀN MARBLE */}
      {item.maVatPham === 'SOFA_DA_HIEN_DAI' && (
        <group>
          {[
            [-0.78, -0.95],
            [-0.78, 0.95],
            [-0.08, -0.95],
            [0.35, 0.95],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 0.08, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.02, 0.16, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
          ))}
          <mesh position={[-0.45, 0.26, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.82, 0.24, 2.1]} />
            <meshStandardMaterial color="#0f766e" roughness={0.35} />
          </mesh>
          <mesh position={[0.05, 0.26, 0.65]} castShadow receiveShadow>
            <boxGeometry args={[0.92, 0.24, 0.8]} />
            <meshStandardMaterial color="#0f766e" roughness={0.35} />
          </mesh>
          <mesh position={[-0.42, 0.42, -0.52]} castShadow>
            <boxGeometry args={[0.76, 0.14, 0.92]} />
            <meshStandardMaterial color="#14b8a6" roughness={0.4} />
          </mesh>
          <mesh position={[-0.18, 0.42, 0.55]} castShadow>
            <boxGeometry args={[1.25, 0.14, 0.9]} />
            <meshStandardMaterial color="#14b8a6" roughness={0.4} />
          </mesh>
          <mesh position={[-0.78, 0.62, 0]} castShadow>
            <boxGeometry args={[0.2, 0.62, 2.1]} />
            <meshStandardMaterial color="#115e59" roughness={0.35} />
          </mesh>
          <mesh position={[-0.45, 0.52, -1.0]} castShadow>
            <boxGeometry args={[0.84, 0.46, 0.18]} />
            <meshStandardMaterial color="#115e59" roughness={0.35} />
          </mesh>
          <mesh position={[-0.58, 0.6, -0.65]} rotation={[0.15, 0.3, -0.2]} castShadow>
            <boxGeometry args={[0.14, 0.32, 0.32]} />
            <meshStandardMaterial color="#fef08a" roughness={0.75} />
          </mesh>
          <mesh position={[-0.58, 0.6, 0.15]} rotation={[-0.1, -0.2, -0.2]} castShadow>
            <boxGeometry args={[0.14, 0.32, 0.32]} />
            <meshStandardMaterial color="#fb923c" roughness={0.75} />
          </mesh>
          <mesh position={[0.55, 0.34, -0.35]} castShadow receiveShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.05, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.1} />
          </mesh>
          <mesh position={[0.55, 0.17, -0.35]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 0.32, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.55, 0.44, -0.35]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.16, 12]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 5. KỆ TIVI HIỆN ĐẠI & SMART TV 75" OLED */}
      {item.maVatPham === 'KE_TIVI_CO_DIEN' && (
        <group>
          {[-0.85, 0.85].map((x, idx) => (
            <mesh key={idx} position={[x, 0.1, 0]} castShadow>
              <boxGeometry args={[0.06, 0.2, 0.42]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.1, 0.36, 0.52]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.53, 0]}>
            <boxGeometry args={[2.14, 0.04, 0.54]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.62, -0.04]} castShadow>
            <boxGeometry args={[0.45, 0.14, 0.22]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.12, -0.04]} castShadow>
            <boxGeometry args={[1.72, 0.94, 0.05]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.12, -0.01]}>
            <planeGeometry args={[1.64, 0.86]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0ea5e9"
              emissiveIntensity={0.65}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.59, 0.14]} castShadow>
            <boxGeometry args={[1.15, 0.08, 0.1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[-0.82, 0.64, 0.08]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.18, 12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
          </mesh>
          <mesh position={[-0.82, 0.78, 0.08]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#16a34a" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* 6. GIƯỜNG GỖ ĐƠN SCANDINAVIAN ẤM CÚNG */}
      {item.maVatPham === 'GIUONG_GO_DON' && (
        <group>
          {[
            [-0.78, -0.95],
            [0.78, -0.95],
            [-0.78, 0.95],
            [0.78, 0.95],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 0.11, z]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.22, 10]} />
              <meshStandardMaterial color="#78350f" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.72, 0.16, 2.15]} />
            <meshStandardMaterial color="#a16207" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.72, 1.02]} castShadow>
            <boxGeometry args={[1.76, 0.85, 0.12]} />
            <meshStandardMaterial color="#854d0e" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.74, 0.95]} castShadow>
            <boxGeometry args={[1.56, 0.56, 0.06]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.42, -0.02]} castShadow receiveShadow>
            <boxGeometry args={[1.58, 0.22, 1.98]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.47, -0.32]} castShadow>
            <boxGeometry args={[1.62, 0.18, 1.38]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.54, 0.35]} castShadow>
            <boxGeometry args={[1.6, 0.08, 0.24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[-0.4, 0.58, 0.74]} rotation={[0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.58, 0.14, 0.36]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0.4, 0.58, 0.74]} rotation={[0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.58, 0.14, 0.36]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.62, 0.58]} rotation={[0.35, 0.1, 0]} castShadow>
            <boxGeometry args={[0.42, 0.12, 0.24]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.75} />
          </mesh>
          <group position={[-1.12, 0, 0.8]}>
            <mesh position={[0, 0.26, 0]} castShadow>
              <boxGeometry args={[0.42, 0.44, 0.42]} />
              <meshStandardMaterial color="#92400e" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.54, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.12, 10]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <cylinderGeometry args={[0.1, 0.14, 0.16, 12]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={0.85}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. GIƯỜNG ĐÔI HOÀNG GIA KING SIZE */}
      {item.maVatPham === 'GIUONG_HOANG_GIA' && (
        <group>
          <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.15, 0.36, 2.3]} />
            <meshStandardMaterial color="#78350f" roughness={0.4} />
          </mesh>
          {[
            [-1.02, 1.08],
            [1.02, 1.08],
            [-1.02, -1.08],
            [1.02, -1.08],
          ].map(([x, z], idx) => (
            <group key={idx} position={[x, 0.65, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.06, 0.07, 1.2, 12]} />
                <meshStandardMaterial color="#b45309" metalness={0.45} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.65, 0]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.92, 1.08]} castShadow>
            <boxGeometry args={[2.0, 1.05, 0.16]} />
            <meshStandardMaterial color="#991b1b" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.92, 1.12]}>
            <boxGeometry args={[2.12, 1.15, 0.06]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.48, -0.02]} castShadow>
            <boxGeometry args={[1.95, 0.22, 2.08]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.54, -0.25]} castShadow>
            <boxGeometry args={[1.98, 0.18, 1.55]} />
            <meshStandardMaterial color="#be123c" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.62, -0.82]}>
            <boxGeometry args={[2.0, 0.05, 0.35]} />
            <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[-0.48, 0.66, 0.76]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[0.72, 0.16, 0.4]} />
            <meshStandardMaterial color="#fef08a" roughness={0.6} />
          </mesh>
          <mesh position={[0.48, 0.66, 0.76]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[0.72, 0.16, 0.4]} />
            <meshStandardMaterial color="#fef08a" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 8. BÀN HỌC TIẾNG ANH & LAPTOP HIỆN ĐẠI */}
      {item.maVatPham === 'BAN_HOC_DEN_LED' && (
        <group>
          {[
            [-0.72, -0.32],
            [0.72, -0.32],
            [-0.72, 0.32],
            [0.72, 0.32],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 0.36, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.72, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.06, 0.8]} />
            <meshStandardMaterial color="#d97706" roughness={0.45} />
          </mesh>
          <mesh position={[0.52, 0.6, 0]} castShadow>
            <boxGeometry args={[0.48, 0.24, 0.72]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          <mesh position={[-0.08, 0.775, 0.05]}>
            <boxGeometry args={[0.85, 0.01, 0.42]} />
            <meshStandardMaterial color="#334155" roughness={0.85} />
          </mesh>
          <mesh position={[-0.08, 0.79, 0.05]} castShadow>
            <boxGeometry args={[0.44, 0.02, 0.3]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.08, 0.92, -0.1]} rotation={[-0.25, 0, 0]} castShadow>
            <boxGeometry args={[0.44, 0.28, 0.015]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} />
          </mesh>
          <mesh position={[-0.08, 0.92, -0.09]} rotation={[-0.25, 0, 0]}>
            <planeGeometry args={[0.4, 0.24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.62, 0.8, -0.22]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.04, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-0.62, 0.98, -0.22]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>
          <mesh position={[-0.5, 1.12, -0.15]} rotation={[0.4, 0, 0.4]}>
            <coneGeometry args={[0.09, 0.14, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} />
          </mesh>
          <mesh position={[-0.5, 1.07, -0.12]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={1.5} />
          </mesh>
          <group position={[-0.08, 0, 0.68]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.25, 0.28, 0.04, 5]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.44, 0]} castShadow>
              <boxGeometry args={[0.48, 0.08, 0.46]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.72, 0.2]} rotation={[0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.44, 0.52, 0.07]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* 9. KỆ SÁCH GỖ SỒI OXFORD 5 TẦNG */}
      {item.maVatPham === 'KE_SACH_OXFORD' && (
        <group>
          <mesh position={[0, 1.05, -0.22]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 2.1, 0.06]} />
            <meshStandardMaterial color="#5c2d0c" roughness={0.6} />
          </mesh>
          <mesh position={[-0.52, 1.05, 0]} castShadow>
            <boxGeometry args={[0.06, 2.1, 0.48]} />
            <meshStandardMaterial color="#78350f" roughness={0.55} />
          </mesh>
          <mesh position={[0.52, 1.05, 0]} castShadow>
            <boxGeometry args={[0.06, 2.1, 0.48]} />
            <meshStandardMaterial color="#78350f" roughness={0.55} />
          </mesh>
          {[0.12, 0.58, 1.05, 1.52, 2.04].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.08, 0.06, 0.48]} />
              <meshStandardMaterial color="#92400e" roughness={0.5} />
            </mesh>
          ))}
          {[
            { y: 0.74, colors: ['#1d4ed8', '#b91c1c', '#047857', '#d97706', '#4338ca'] },
            { y: 1.21, colors: ['#be123c', '#0f766e', '#1e40af', '#a16207', '#334155'] },
            { y: 1.68, colors: ['#0369a1', '#991b1b', '#15803d', '#b45309'] },
          ].map((shelf, sIdx) => (
            <group key={sIdx} position={[-0.36, shelf.y, 0.02]}>
              {shelf.colors.map((c, bIdx) => (
                <mesh key={bIdx} position={[bIdx * 0.11, 0, 0]} castShadow>
                  <boxGeometry args={[0.085, 0.28 + (bIdx % 2) * 0.04, 0.32]} />
                  <meshStandardMaterial color={c} roughness={0.6} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0.3, 2.16, 0.02]} castShadow>
            <cylinderGeometry args={[0.1, 0.08, 0.16, 10]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0.3, 2.3, 0.02]}>
            <dodecahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#16a34a" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* 10. ĐÀN GRAND PIANO CỔ ĐIỂN */}
      {item.maVatPham === 'DAN_PIANO_CO_DIEN' && (
        <group>
          {[
            [-0.55, 0.2],
            [0.55, 0.2],
            [0, -0.55],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 0.34, z]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.68, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0.78, -0.1]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.28, 1.15]} />
            <meshStandardMaterial color="#090d16" roughness={0.12} metalness={0.65} />
          </mesh>
          <mesh position={[0, 0.94, -0.15]}>
            <boxGeometry args={[1.3, 0.04, 0.95]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.15, 1.18, -0.1]} rotation={[0, 0, -0.35]} castShadow>
            <boxGeometry args={[1.45, 0.04, 1.1]} />
            <meshStandardMaterial color="#090d16" roughness={0.12} metalness={0.65} />
          </mesh>
          <mesh position={[0, 0.72, 0.52]} castShadow>
            <boxGeometry args={[1.38, 0.08, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.77, 0.46]}>
            <boxGeometry args={[1.3, 0.03, 0.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0.1, 0.3]}>
            <boxGeometry args={[0.25, 0.05, 0.12]} />
            <meshStandardMaterial color="#facc15" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.36, 0.92]} castShadow>
            <boxGeometry args={[0.78, 0.1, 0.38]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          {[
            [-0.32, 0.78],
            [0.32, 0.78],
            [-0.32, 1.06],
            [0.32, 1.06],
          ].map(([x, z], idx) => (
            <mesh key={`pbench-${idx}`} position={[x, 0.18, z]}>
              <cylinderGeometry args={[0.03, 0.025, 0.36, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>
      )}

      {/* 11. TỦ LẠNH 2 CÁNH SIDE-BY-SIDE INOX */}
      {item.maVatPham === 'TU_LANH_2_CANH' && (
        <group>
          <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.98, 2.04, 0.78]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.22} />
          </mesh>
          <mesh position={[0, 1.25, 0.4]}>
            <boxGeometry args={[0.025, 1.45, 0.02]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 0.55, 0.4]}>
            <boxGeometry args={[0.94, 0.025, 0.02]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-0.08, 1.25, 0.43]}>
            <cylinderGeometry args={[0.015, 0.015, 0.65, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.9} />
          </mesh>
          <mesh position={[0.08, 1.25, 0.43]}>
            <cylinderGeometry args={[0.015, 0.015, 0.65, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.9} />
          </mesh>
          <mesh position={[-0.26, 1.32, 0.4]}>
            <boxGeometry args={[0.18, 0.28, 0.02]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* 12. BỂ CÁ THỦY SINH ĐÈN LED */}
      {item.maVatPham === 'BE_CA_CANH_LED' && (
        <group>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.76, 0.56]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.04, 0]}>
            <boxGeometry args={[1.38, 0.56, 0.48]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0284c7"
              emissiveIntensity={0.65}
              transparent
              opacity={0.78}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[-0.32, 0.85, 0]}>
            <dodecahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          <mesh position={[0.25, 0.9, 0.05]}>
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.38, 0]}>
            <boxGeometry args={[1.25, 0.04, 0.12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* 13. CHẬU CÂY MONSTERA TRONG NHÀ */}
      {item.maVatPham === 'CAY_MONSTERA' && (
        <group>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.28, 0.28, 8]} />
            <meshStandardMaterial color="#92400e" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.22, 0.42, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <dodecahedronGeometry args={[0.38, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.65} />
          </mesh>
          <mesh position={[-0.22, 1.02, 0.15]} castShadow>
            <dodecahedronGeometry args={[0.26, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.65} />
          </mesh>
          <mesh position={[0.22, 0.96, -0.14]} castShadow>
            <dodecahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial color="#22c55e" roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* 14. ĐÈN CÂY ĐỌC SÁCH ÁNH VÀNG */}
      {item.maVatPham === 'DEN_CAY_PHONG_KHACH' && (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.24, 0.1, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.92, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.03, 1.75, 10]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.78, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.34, 0.34, 16]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#f59e0b"
              emissiveIntensity={0.85}
              roughness={0.6}
            />
          </mesh>
        </group>
      )}

      {/* 15. BÀN GAMING CYBERPUNK RGB */}
      {item.maVatPham === 'SOFA_GAMING_RGB' && (
        <group>
          {[-0.68, 0.68].map((x, idx) => (
            <mesh key={idx} position={[x, 0.38, 0]} castShadow>
              <boxGeometry args={[0.08, 0.74, 0.68]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.06, 0.78]} />
            <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <boxGeometry args={[1.68, 0.025, 0.8]} />
            <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[-0.1, 1.08, -0.18]} castShadow>
            <boxGeometry args={[1.05, 0.44, 0.05]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0284c7" emissiveIntensity={0.95} />
          </mesh>
          <mesh position={[0.6, 1.02, -0.05]} castShadow>
            <boxGeometry args={[0.24, 0.46, 0.44]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
          <mesh position={[0.48, 1.02, -0.05]}>
            <planeGeometry args={[0.35, 0.35]} />
            <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={1.2} />
          </mesh>
          <group position={[-0.1, 0, 0.68]}>
            <mesh position={[0, 0.24, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.46, 0]} castShadow>
              <boxGeometry args={[0.52, 0.1, 0.5]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 0.82, 0.2]} castShadow>
              <boxGeometry args={[0.48, 0.68, 0.09]} />
              <meshStandardMaterial color="#be123c" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* 16. TỦ QUẦN ÁO CÁNH KÍNH CAO CẤP */}
      {item.maVatPham === 'TU_QUAN_AO_KINH' && (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.55, 2.1, 0.68]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[-0.37, 1.05, 0.35]}>
            <boxGeometry args={[0.7, 1.94, 0.03]} />
            <meshStandardMaterial
              color="#bae6fd"
              emissive="#fbbf24"
              emissiveIntensity={0.35}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh position={[0.37, 1.05, 0.35]}>
            <boxGeometry args={[0.7, 1.94, 0.03]} />
            <meshStandardMaterial
              color="#bae6fd"
              emissive="#fbbf24"
              emissiveIntensity={0.35}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh position={[-0.06, 1.05, 0.38]}>
            <boxGeometry args={[0.02, 0.65, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.06, 1.05, 0.38]}>
            <boxGeometry args={[0.02, 0.65, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )}

      {/* 17. QUẦY PHA CAFE & ESPRESSO BAR */}
      {item.maVatPham === 'MAY_PHA_CAFE_MINI' && (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.88, 0.7]} />
            <meshStandardMaterial color="#78350f" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.91, 0]}>
            <boxGeometry args={[1.5, 0.06, 0.74]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
          <mesh position={[-0.28, 1.15, 0]} castShadow>
            <boxGeometry args={[0.45, 0.42, 0.38]} />
            <meshStandardMaterial color="#dc2626" metalness={0.65} roughness={0.2} />
          </mesh>
          <mesh position={[0.28, 1.12, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.36, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* 18. THẢM HOÀNG GIA ĐỎ VIỀN VÀNG */}
      {item.maVatPham === 'THAM_HOANG_GIA_DO' && (
        <group>
          <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3.4, 2.4]} />
            <meshStandardMaterial color="#991b1b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3.0, 2.0]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.72, 0.84, 28]} />
            <meshStandardMaterial color="#facc15" metalness={0.6} />
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
  houseStyle = 'traditional',
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
  houseStyle?: string;
  onClickManageHouse?: () => void;
}) {
  const roofTex = useRoofTileTexture(roofColor, 6, 4);
  const courtyardTex = useCourtyardTileTexture(6, 5);
  const floorTex = useIndoorFloorTexture(6, 5);

  const displayTitle = houseTitle || `Nhà Cấp 4 của ${ownerName}`;
  const activeFurniture =
    furnitureList && furnitureList.length > 0 ? furnitureList : FALLBACK_FURNITURE_LIST;

  // Xác định phong cách kiến trúc hiện đại
  const isMinimalist = houseStyle === 'minimalist';
  const isEcoGarden = houseStyle === 'eco_garden';
  const isCyberLoft = houseStyle === 'cyber_loft';
  const isLuxuryMansion = houseStyle === 'luxury_mansion';
  const isTraditional = !isMinimalist && !isEcoGarden && !isCyberLoft && !isLuxuryMansion;

  const activeWallColor = wallColor || (
    isMinimalist ? '#f8fafc' :
    isEcoGarden ? '#f5ebd6' :
    isCyberLoft ? '#0f172a' :
    isLuxuryMansion ? '#f8fafc' : '#f5ebd6'
  );
  const activeRoofColor = roofColor || (
    isMinimalist ? '#334155' :
    isEcoGarden ? '#15803d' :
    isCyberLoft ? '#06b6d4' :
    isLuxuryMansion ? '#fbbf24' : '#b93829'
  );

  return (
    <group position={position}>
      {/* 1. SÂN & NỀN MÓNG BIỆT THỰ / NHÀ THEO PHONG CÁCH */}
      {/* Mặt sân chung */}
      <mesh position={[0, 0.03, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 11.2]} />
        <meshStandardMaterial
          map={isTraditional ? courtyardTex || undefined : undefined}
          color={
            isTraditional
              ? '#c85a48'
              : isMinimalist
                ? '#cbd5e1'
                : isEcoGarden
                  ? '#166534'
                  : isCyberLoft
                    ? '#090d16'
                    : '#f1f5f9'
          }
          roughness={isLuxuryMansion ? 0.2 : isCyberLoft ? 0.3 : 0.75}
        />
      </mesh>

      {/* Lối đi lát đá từ vỉa hè vào cổng nhà */}
      <mesh position={[0, 0.035, -6.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, 2.2]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#1e293b' : isLuxuryMansion ? '#e2e8f0' : '#cbd5e1'}
          roughness={0.6}
        />
      </mesh>

      {/* SÂN ĐẶC TRƯNG TỪNG PHONG CÁCH */}
      {/* Luxury Mansion: Bể bơi vô cực ngoài sân lát gạch xanh + 2 ghế tắm nắng */}
      {isLuxuryMansion && (
        <group position={[3.3, 0.04, -2.9]}>
          {/* Lòng hồ bơi */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3.2, 2.3]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.35}
              roughness={0.1}
            />
          </mesh>
          {/* Thành hồ bơi đá cẩm thạch trắng */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[3.4, 0.12, 2.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} wireframe={false} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[3.2, 0.14, 2.3]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} />
          </mesh>
          {/* Ghế tắm nắng hồ bơi */}
          <mesh position={[-1.0, 0.22, 0.8]} rotation={[0, -Math.PI / 6, 0]} castShadow>
            <boxGeometry args={[0.5, 0.25, 1.1]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* Eco Garden Villa: Hồ cá Koi mini tự nhiên với hoa sen */}
      {isEcoGarden && (
        <group position={[-3.3, 0.04, -2.9]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.35, 24]} />
            <meshStandardMaterial color="#0e7490" roughness={0.15} />
          </mesh>
          {/* Viền đá cuội tự nhiên quanh hồ cá Koi */}
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[1.35, 0.14, 8, 24]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
          </mesh>
          {/* Lá sen nổi */}
          {[-0.4, 0.3, 0.1].map((lx, i) => (
            <mesh key={`lotus-${i}`} position={[lx, 0.07, (i - 1) * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.22, 12]} />
              <meshStandardMaterial color="#22c55e" />
            </mesh>
          ))}
          {/* Hoa súng nở hồng */}
          <mesh position={[0.2, 0.12, 0.1]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Cyber Loft: Vạch đèn neon phát sáng trên sân */}
      {isCyberLoft && (
        <group position={[0, 0.04, -2.5]}>
          {[-3.0, 3.0].map((nx, i) => (
            <mesh key={`neon-floor-${i}`} position={[nx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.15, 4.0]} />
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#06b6d4"
                emissiveIntensity={1.2}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 2. TƯỜNG RÀO & CỔNG BIỆT THỰ / NHÀ (MỞ CỔNG PHÍA NAM Z = -5.0 ĐỂ ĐI VÀO) */}
      {/* Hàng rào mặt tiền bên trái & phải cổng */}
      {[-3.6, 3.6].map((x, idx) => (
        <group key={`front-fence-${idx}`} position={[x, 0, -5.0]}>
          {/* Chân tường rào */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.35, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4.4, 0.7, 0.25]} />
              <meshStandardMaterial
                color={isCyberLoft ? '#1e293b' : isLuxuryMansion ? '#f8fafc' : '#e2dcd3'}
                roughness={0.6}
              />
            </mesh>
          </RigidBody>
          {/* Nan sắt hoặc kính mặt tiền */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[4.2, 0.45, 0.08]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#06b6d4' : isLuxuryMansion ? '#fbbf24' : '#334155'}
              emissive={isCyberLoft ? '#06b6d4' : undefined}
              emissiveIntensity={isCyberLoft ? 0.6 : 0}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Hai trụ cổng chính ốp đá có đèn cổng phát sáng */}
      {[-1.35, 1.35].map((x, i) => (
        <group key={`gate-pillar-${i}`} position={[x, 0, -5.0]}>
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.9, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.48, 1.8, 0.48]} />
              <meshStandardMaterial
                color={isCyberLoft ? '#0f172a' : isLuxuryMansion ? '#f8fafc' : '#f8fafc'}
                roughness={0.4}
              />
            </mesh>
          </RigidBody>
          {/* Mũ trụ cổng */}
          <mesh position={[0, 1.86, 0]} castShadow>
            <boxGeometry args={[0.58, 0.12, 0.58]} />
            <meshStandardMaterial
              color={isLuxuryMansion ? '#fbbf24' : isCyberLoft ? '#38bdf8' : activeRoofColor}
              roughness={0.5}
            />
          </mesh>
          {/* Đèn cầu trang trí trên đỉnh trụ cổng */}
          <mesh position={[0, 2.08, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#a855f7' : isLuxuryMansion ? '#fef08a' : '#fef08a'}
              emissive={isCyberLoft ? '#a855f7' : '#f59e0b'}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      ))}

      {/* Cánh cổng 2 bên mở đón chủ nhà */}
      <mesh position={[-1.15, 0.8, -4.4]} rotation={[0, Math.PI / 3, 0]} castShadow>
        <boxGeometry args={[1.1, 1.35, 0.06]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#0f172a' : isLuxuryMansion ? '#fbbf24' : '#1e293b'}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[1.15, 0.8, -4.4]} rotation={[0, -Math.PI / 3, 0]} castShadow>
        <boxGeometry args={[1.1, 1.35, 0.06]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#0f172a' : isLuxuryMansion ? '#fbbf24' : '#1e293b'}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* 3. NỀN NHÀ CAO (FOUNDATION PLINTH) & BẬC TAM CẤP */}
      <mesh position={[0, 0.22, 1.4]} receiveShadow castShadow>
        <boxGeometry args={[9.2, 0.44, 7.2]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#0f172a' : isLuxuryMansion ? '#f8fafc' : '#64748b'}
          roughness={0.5}
        />
      </mesh>
      {/* Sàn bên trong nhà */}
      <mesh position={[0, 0.45, 1.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.8, 5.8]} />
        <meshStandardMaterial
          map={floorTex || undefined}
          color={isCyberLoft ? '#1e293b' : isLuxuryMansion ? '#ffffff' : '#fffbeb'}
          roughness={0.3}
        />
      </mesh>
      {/* Sàn hiên nhà phía trước */}
      <mesh position={[0, 0.445, -1.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.8, 1.25]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#090d16' : isLuxuryMansion ? '#f8fafc' : '#d97706'}
          roughness={0.4}
        />
      </mesh>

      {/* Bậc tam cấp lát đá trước hiên */}
      <mesh position={[0, 0.12, -2.5]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 0.16, 0.7]} />
        <meshStandardMaterial color={isLuxuryMansion ? '#e2e8f0' : '#475569'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, -2.3]} receiveShadow castShadow>
        <boxGeometry args={[2.5, 0.16, 0.45]} />
        <meshStandardMaterial color={isLuxuryMansion ? '#f1f5f9' : '#334155'} roughness={0.35} />
      </mesh>

      {/* 2 Cột trụ sảnh hiên nhà */}
      {[-3.8, 3.8].map((x, idx) => (
        <group key={`porch-col-${idx}`} position={[x, 0, -1.9]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.42, 0.65, 0.42]} />
            <meshStandardMaterial
              color={isLuxuryMansion ? '#fbbf24' : isCyberLoft ? '#06b6d4' : '#475569'}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[0.32, 2.5, 0.32]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#1e293b' : isEcoGarden ? '#78350f' : '#ffffff'}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* 4. HỆ TƯỜNG BAO QUANH BIỆT THỰ / NHÀ (CHỪA CỬA CHÍNH Ở GIỮA ĐỂ ĐI VÀO) */}
      {/* Tường hậu phía Bắc (Z = 4.7) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2.0, 4.7]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8.8, 3.2, 0.28]} />
          <meshStandardMaterial color={activeWallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường hồi bên Trái (X = -4.3) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-4.3, 2.0, 1.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 3.2, 5.8]} />
          <meshStandardMaterial color={activeWallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường hồi bên Phải (X = 4.3) */}
      <RigidBody type="fixed" colliders="cuboid" position={[4.3, 2.0, 1.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 3.2, 5.8]} />
          <meshStandardMaterial color={activeWallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường mặt tiền bên Trái cửa chính (X = -2.65, Z = -0.95) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-2.65, 2.0, -0.95]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.1, 3.2, 0.28]} />
          <meshStandardMaterial color={activeWallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Tường mặt tiền bên Phải cửa chính (X = 2.65, Z = -0.95) */}
      <RigidBody type="fixed" colliders="cuboid" position={[2.65, 2.0, -0.95]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.1, 3.2, 0.28]} />
          <meshStandardMaterial color={activeWallColor} roughness={0.55} />
        </mesh>
      </RigidBody>

      {/* Đà lanh-tô phía trên cửa chính */}
      <mesh position={[0, 3.15, -0.95]} castShadow>
        <boxGeometry args={[2.2, 0.9, 0.28]} />
        <meshStandardMaterial color={activeWallColor} roughness={0.55} />
      </mesh>

      {/* Cánh cửa mở 2 bên lối vào chính */}
      <mesh position={[-1.02, 1.55, -1.15]} rotation={[0, Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[0.55, 2.2, 0.08]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#0284c7' : isLuxuryMansion ? '#fbbf24' : isEcoGarden ? '#78350f' : '#78350f'}
          metalness={isCyberLoft || isLuxuryMansion ? 0.6 : 0.1}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[1.02, 1.55, -1.15]} rotation={[0, -Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[0.55, 2.2, 0.08]} />
        <meshStandardMaterial
          color={isCyberLoft ? '#0284c7' : isLuxuryMansion ? '#fbbf24' : isEcoGarden ? '#78350f' : '#78350f'}
          metalness={isCyberLoft || isLuxuryMansion ? 0.6 : 0.1}
          roughness={0.5}
        />
      </mesh>

      {/* Thảm phát sáng trước cửa chính: Đi bộ vào cửa để bước vào Không Gian Trong Nhà */}
      <group position={[0, 0.46, -1.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 1.1]} />
          <meshStandardMaterial
            color={isCyberLoft ? '#a855f7' : isLuxuryMansion ? '#fbbf24' : isMyHouse ? '#f59e0b' : '#10b981'}
            emissive={isCyberLoft ? '#9333ea' : isLuxuryMansion ? '#f59e0b' : isMyHouse ? '#ea580c' : '#059669'}
            emissiveIntensity={0.85}
            transparent
            opacity={0.85}
          />
        </mesh>
        {showInteriorCutaway && (
          <KeyPromptBadge
            keyLabel="E"
            position={[0, 0.85, 0]}
            color="#fbbf24"
            onClick={onClickManageHouse}
          />
        )}
      </group>

      {/* Cửa sổ 2 bên mặt tiền */}
      {[-2.65, 2.65].map((wx, idx) => (
        <group key={`window-${idx}`} position={[wx, 1.95, -1.12]}>
          <mesh castShadow>
            <boxGeometry args={[1.45, 1.35, 0.08]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#0f172a' : isLuxuryMansion ? '#fbbf24' : '#78350f'}
              roughness={0.7}
            />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[1.25, 1.15, 0.06]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#c084fc' : '#7dd3fc'}
              emissive={isCyberLoft ? '#a855f7' : undefined}
              emissiveIntensity={isCyberLoft ? 0.4 : 0}
              roughness={0.15}
              metalness={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Mái hắt ngói / lam kim loại trên cửa sổ */}
          <mesh position={[0, 0.78, -0.15]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
            <boxGeometry args={[1.65, 0.1, 0.45]} />
            <meshStandardMaterial
              color={isLuxuryMansion ? '#fbbf24' : isCyberLoft ? '#06b6d4' : activeRoofColor}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* KIẾN TRÚC TẦNG 2 & BAN CÔNG CHO CÁC MẪU HIỆN ĐẠI (MINIMALIST, CYBER, LUXURY, ECO) */}
      {(isMinimalist || isLuxuryMansion || isCyberLoft) && (
        <group position={[0, 3.8, 0.4]}>
          {/* Khối hộp tầng 2 vươn ra (Cantilever Box) */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[8.4, 1.8, 6.2]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#1e293b' : isLuxuryMansion ? '#ffffff' : '#f8fafc'}
              roughness={0.3}
            />
          </mesh>
          {/* Cửa kính lớn trần sàn kịch trần tầng 2 */}
          <mesh position={[0, 0.8, -3.12]}>
            <boxGeometry args={[5.2, 1.5, 0.06]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#38bdf8' : '#7dd3fc'}
              roughness={0.1}
              metalness={0.6}
              transparent
              opacity={0.75}
            />
          </mesh>
          {/* Lan can ban công kính cường lực tầng 2 */}
          <mesh position={[0, 0.4, -3.4]}>
            <boxGeometry args={[5.8, 0.85, 0.05]} />
            <meshStandardMaterial
              color={isCyberLoft ? '#06b6d4' : '#bae6fd'}
              emissive={isCyberLoft ? '#06b6d4' : undefined}
              emissiveIntensity={isCyberLoft ? 0.6 : 0}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}

      {/* Eco Garden Villa: Giàn Pergola nan gỗ Conwood phủ hoa trước hiên */}
      {isEcoGarden && (
        <group position={[0, 3.4, -1.8]}>
          <mesh castShadow>
            <boxGeometry args={[8.4, 0.15, 1.8]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          {/* Dây leo & hoa rủ */}
          {[-3, -1.5, 0, 1.5, 3].map((hx, idx) => (
            <mesh key={`pergola-vine-${idx}`} position={[hx, -0.2, 0.8]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial color="#22c55e" />
            </mesh>
          ))}
        </group>
      )}

      {/* 5. NỘI THẤT 3D BÊN TRONG NHÀ (HIỂN THỊ RÕ KHI BƯỚC VÀO NHÀ & TỰ DO TRANG TRÍ) */}
      <group position={[0, 0.46, 1.8]}>
        {activeFurniture.map((item, idx) => (
          <HouseFurnitureItem3D
            key={`${item.maVatPham}-${item.toaDoLuoiX}-${item.toaDoLuoiZ}-${idx}`}
            item={item}
            itemScale={0.85}
          />
        ))}

        {/* Đèn trần ấm áp chiếu sáng nội thất (chỉ bật khi bước vào nhà xem nội thất) */}
        <pointLight
          position={[0, 2.6, 0]}
          color={isCyberLoft ? '#a855f7' : '#fef08a'}
          intensity={0.95}
          distance={10}
          visible={showInteriorCutaway}
        />

        {/* NÚT MUA & TRANG TRÍ NỘI THẤT KHI BƯỚC VÀO TRONG NHÀ */}
        {showInteriorCutaway && isMyHouse && (
          <KeyPromptBadge
            keyLabel="E"
            position={[0, 2.15, -0.3]}
            color="#f59e0b"
            onClick={onClickManageHouse}
          />
        )}
      </group>

      {/* 6. HỆ MÁI NHÀ THEO TỪNG PHONG CÁCH (TỰ ĐỘNG MỜ ĐI KHI XEM NỘI THẤT) */}
      {/* 6A. MÁI NGÓI ĐỎ ĐẤT NUNG TRUYỀN THỐNG VIỆT NAM (ÚP XUỐNG CHUẨN, KHÔNG CHỔNG NGƯỢC) */}
      {isTraditional && (
        <group position={[0, 3.65, 1.85]}>
          {/* Mái dốc phía Trước (Dốc xuôi xuống phía hiên nhà - Z âm) */}
          <mesh
            position={[0, 0.75, -1.8]}
            rotation={[-Math.PI / 6.2, 0, 0]}
            castShadow={!showInteriorCutaway}
            receiveShadow
          >
            <boxGeometry args={[9.8, 0.16, 4.4]} />
            <meshStandardMaterial
              map={roofTex || undefined}
              color={activeRoofColor}
              roughness={0.55}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>

          {/* Mái dốc phía Sau (Dốc xuôi xuống phía sau nhà - Z dương) */}
          <mesh
            position={[0, 0.75, 1.8]}
            rotation={[Math.PI / 6.2, 0, 0]}
            castShadow={!showInteriorCutaway}
            receiveShadow
          >
            <boxGeometry args={[9.8, 0.16, 4.4]} />
            <meshStandardMaterial
              map={roofTex || undefined}
              color={activeRoofColor}
              roughness={0.55}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>

          {/* Tường hồi phẳng 2 đầu hồi (X = -4.3 và X = 4.3, nằm phẳng dưới mái che kín đầu hồi) */}
          {[-4.3, 4.3].map((gx, i) => (
            <mesh
              key={`gable-flat-${i}`}
              position={[gx, 0.65, 0]}
              castShadow={!showInteriorCutaway}
            >
              <boxGeometry args={[0.28, 1.35, 5.6]} />
              <meshStandardMaterial
                color={activeWallColor}
                roughness={0.55}
                transparent={showInteriorCutaway}
                opacity={showInteriorCutaway ? 0.15 : 1.0}
              />
            </mesh>
          ))}

          {/* Bờ nóc đắp chỉ phào trắng ngà chạy dọc đỉnh mái */}
          <mesh position={[0, 1.76, 0]} castShadow={!showInteriorCutaway}>
            <boxGeometry args={[9.95, 0.22, 0.38]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.35}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.2 : 1.0}
            />
          </mesh>

          {/* Con kìm nóc truyền thống ở 2 đầu bờ nóc */}
          {[-4.96, 4.96].map((kx, i) => (
            <mesh key={`kim-noc-${i}`} position={[kx, 1.9, 0]} castShadow={!showInteriorCutaway}>
              <boxGeometry args={[0.15, 0.36, 0.25]} />
              <meshStandardMaterial
                color="#f8fafc"
                roughness={0.3}
                transparent={showInteriorCutaway}
                opacity={showInteriorCutaway ? 0.2 : 1.0}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 6B. MÁI BẰNG HIỆN ĐẠI (MINIMALIST / SCANDINAVIAN) */}
      {isMinimalist && (
        <group position={[0, 5.5, 0.6]}>
          <mesh castShadow={!showInteriorCutaway}>
            <boxGeometry args={[9.0, 0.3, 7.0]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.3}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
          {/* Giàn lam nhôm chống nắng trên mái */}
          <mesh position={[0, 0.35, 0]} castShadow={!showInteriorCutaway}>
            <boxGeometry args={[7.5, 0.12, 4.5]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.6}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
        </group>
      )}

      {/* 6C. MÁI SINH THÁI XANH (ECO GARDEN VILLA) */}
      {isEcoGarden && (
        <group position={[0, 4.2, 1.0]}>
          <mesh castShadow={!showInteriorCutaway}>
            <boxGeometry args={[9.2, 0.35, 7.2]} />
            <meshStandardMaterial
              color="#15803d"
              roughness={0.7}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
          {/* Cụm cây cảnh sân thượng */}
          {[-2.5, 2.5].map((cx, i) => (
            <mesh key={`roof-tree-${i}`} position={[cx, 0.6, 0]} castShadow={!showInteriorCutaway}>
              <sphereGeometry args={[0.45, 8, 8]} />
              <meshStandardMaterial
                color="#16a34a"
                transparent={showInteriorCutaway}
                opacity={showInteriorCutaway ? 0.15 : 1.0}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 6D. MÁI VÁT TƯƠNG LAI CÓ LED NEON (CYBER LOFT 2077) */}
      {isCyberLoft && (
        <group position={[0, 5.6, 0.6]}>
          <mesh rotation={[0, 0, Math.PI / 18]} castShadow={!showInteriorCutaway}>
            <boxGeometry args={[9.4, 0.35, 7.2]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.8}
              roughness={0.2}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
          {/* Dải LED neon viền mái phát sáng rực rỡ */}
          <mesh position={[0, 0.3, -3.55]}>
            <boxGeometry args={[9.6, 0.1, 0.12]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={1.8}
            />
          </mesh>
          <mesh position={[0, 0.3, 3.55]}>
            <boxGeometry args={[9.6, 0.1, 0.12]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>
      )}

      {/* 6E. MÁI DINH THỰ LUXURY BEVERLY MANSION */}
      {isLuxuryMansion && (
        <group position={[0, 5.6, 0.6]}>
          <mesh castShadow={!showInteriorCutaway}>
            <boxGeometry args={[9.4, 0.4, 7.2]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.2}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
          {/* Viền chỉ phào mạ vàng hoàng kim xung quanh mái */}
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[9.7, 0.16, 7.5]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.8}
              roughness={0.2}
              transparent={showInteriorCutaway}
              opacity={showInteriorCutaway ? 0.15 : 1.0}
            />
          </mesh>
        </group>
      )}

      {/* 7. CÂY CẢNH SÂN VƯỜN & BÀN ĐÁ NGOÀI SÂN */}
      <CartoonTree position={[-4.2, 0, -3.2]} scale={0.95} color={isEcoGarden ? '#15803d' : '#15803d'} />
      <FlowerBush position={[3.8, 0, -3.5]} color={isCyberLoft ? '#06b6d4' : '#f43f5e'} />
      <FlowerBush position={[-2.2, 0, -2.4]} color="#fbbf24" />
      <FlowerBush position={[2.2, 0, -2.4]} color="#ec4899" />

      {/* 8. NHÃN TRÊN MÁI NHÀ - ĐÃ TỐI ƯU GỠ BỎ ĐỂ KHÔNG BỊ RÁC CHỮ TRÊN BẦU TRỜI */}
    </group>
  );
}

/**
 * Tháp Truyền Hình Trung Tâm Đô Thị & Màn Hình LED Khổng Lồ Quảng Cáo YouTube
 * (Metropolis Landmark Broadcast TV Tower & Times Square Giant 4K LED Screen)
 */
/**
 * ĐÀI PHUN NƯỚC HOÀNG GIA LA MÃ & QUẦN THỂ CÔNG VIÊN QUẢNG TRƯỜNG TRUNG TÂM
 * (Royal Baroque Grand Fountain & Central Plaza Botanical Garden Complex)
 *
 * Tác phẩm nghệ thuật đỉnh cao:
 * - Đài phun nước cẩm thạch 3 tầng phong cách Baroque Châu Âu với 4 bình gốm đồng La Mã rót nước.
 * - Tượng thiên thần tung cánh mạ vàng vươn cao trên đỉnh búp sen.
 * - Màng nước tràn mềm mại, bọt nước trắng dập dềnh tự nhiên (KHÔNG DÙNG QUE THÔ CỨNG).
 * - Sàn quảng trường lát đá hoa văn Ngôi sao La Mã 8 cánh (Compass Rose Mosaic) rực rỡ.
 * - 4 bồn hoa Parterre uốn cong ngập tràn hoa hồng, oải hương, cẩm tú cầu và cây tùng tròn.
 * - Cột đèn đường Victoria 3 bóng có giỏ hoa tươi rủ xuống.
 * - Ghế băng nan gỗ sồi chân sắt uốn, xe kem cổ điển Ý và đàn chim bồ câu sống động.
 */
export function CentralFountain({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const centralSpoutRef = useRef<THREE.Group>(null);
  const foamRipplesRef = useRef<THREE.Group>(null);
  const birdsGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Búp nước đỉnh phun nhấp nhô nhịp nhàng
    if (centralSpoutRef.current) {
      const sy = 1 + Math.sin(t * 2.8) * 0.12;
      const sxz = 1 + Math.cos(t * 2.8) * 0.08;
      centralSpoutRef.current.scale.set(sxz, sy, sxz);
    }

    // Vòng bọt nước dập dềnh giãn nở nhẹ trên mặt hồ
    if (foamRipplesRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.06;
      foamRipplesRef.current.scale.set(s, 1, s);
      foamRipplesRef.current.rotation.y = t * 0.05;
    }

    // Đàn chim bồ câu mổ thóc nhấp nhô nhẹ
    if (birdsGroupRef.current) {
      birdsGroupRef.current.children.forEach((child, idx) => {
        child.rotation.x = Math.sin(t * 3.5 + idx * 1.5) * 0.15;
      });
    }
  });

  return (
    <group position={position}>
      {/* ========================================================================= */}
      {/* 1. MẶT SÀN HOA VĂN QUẢNG TRƯỜNG LA MÃ (GRAND COMPASS ROSE PAVING)         */}
      {/* ========================================================================= */}
      {/* Vòng nền đá cẩm thạch Ý kem ấm đường kính 27m */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[13.8, 64]} />
        <meshStandardMaterial color="#faf5ef" roughness={0.4} />
      </mesh>

      {/* Vành đai đá phiến xám xanh viền ngoài */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[12.8, 13.8, 64]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      {/* Vòng đá hoa cương đỏ gạch Terracotta viền trung gian */}
      <mesh position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[9.8, 10.4, 64]} />
        <meshStandardMaterial color="#c2410c" roughness={0.45} />
      </mesh>

      {/* Vòng đá cẩm thạch trắng viền chân đài phun */}
      <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[5.8, 6.4, 48]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
      </mesh>

      {/* HOA VĂN NGÔI SAO LA BÀN LA MÃ 8 CÁNH (8-POINTED COMPASS ROSE MOSAIC) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const starAngle = (i * Math.PI) / 4;
        const isMain = i % 2 === 0;
        return (
          <group key={`star-ray-${i}`} rotation={[0, starAngle, 0]}>
            {/* Cánh sao chính nhọn vươn ra sàn */}
            <mesh
              position={[0, 0.046, isMain ? 8.2 : 7.6]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <coneGeometry args={[isMain ? 0.95 : 0.65, isMain ? 3.4 : 2.5, 3]} />
              <meshStandardMaterial
                color={isMain ? '#0284c7' : '#f59e0b'}
                roughness={0.35}
                metalness={0.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* ========================================================================= */}
      {/* 2. ĐÀI PHUN NƯỚC HOÀNG GIA BAROQUE LA MÃ 3 TẦNG (ROYAL FOUNTAIN)          */}
      {/* ========================================================================= */}

      {/* Tam cấp giật 2 tầng chân đài phun */}
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[5.6, 5.85, 0.16, 48]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[5.25, 5.45, 0.16, 48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} />
      </mesh>

      {/* Thành hồ đài phun nước cẩm thạch trắng chạm phào chỉ tròn kiên cố */}
      <RigidBody type="fixed" colliders="hull" position={[0, 0.58, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[4.8, 5.1, 0.72, 48]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.15} />
        </mesh>
      </RigidBody>

      {/* Gờ đá cẩm thạch bo tròn miệng hồ mạ viền vàng */}
      <mesh position={[0, 0.94, 0]} receiveShadow>
        <torusGeometry args={[4.8, 0.16, 16, 48]} />
        <meshStandardMaterial color="#fefefe" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.97, 0]}>
        <torusGeometry args={[4.8, 0.035, 12, 48]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Đáy hồ lát gạch mosaic màu xanh sapphire sâu thẳm */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.65, 48]} />
        <meshStandardMaterial color="#0369a1" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Ngôi sao khảm vàng dưới đáy hồ nước */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ra, idx) => (
        <mesh
          key={`bottom-star-${idx}`}
          position={[0, 0.35, 0]}
          rotation={[-Math.PI / 2, 0, ra]}
        >
          <planeGeometry args={[0.3, 4.2]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Mặt nước hồ chính xanh ngọc lam biếc trong suốt, lấp lánh phản quang */}
      <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.68, 48]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.03}
          metalness={0.4}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* 4 BỆ ĐÁ & BÌNH GỐM LA MÃ AMPHORA ĐỒNG VÀNG RÓT NƯỚC VÀO HỒ (4 GÓC CHÍNH) */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
        const px = Math.cos(angle) * 4.8;
        const pz = Math.sin(angle) * 4.8;
        return (
          <group key={`amphora-post-${i}`} position={[px, 0.65, pz]} rotation={[0, angle + Math.PI, 0]}>
            {/* Bệ đá cẩm thạch trắng */}
            <mesh castShadow position={[0, 0.05, 0]}>
              <boxGeometry args={[0.55, 0.85, 0.55]} />
              <meshStandardMaterial color="#ffffff" roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.65, 0.08, 0.65]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
            {/* Bình gốm La Mã Amphora đúc đồng vàng hoàng gia */}
            <group position={[0, 0.78, 0.08]} rotation={[-0.45, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.16, 0.24, 0.48, 16]} />
                <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
              </mesh>
              {/* Miệng bình gốm */}
              <mesh position={[0, 0.26, 0]}>
                <torusGeometry args={[0.16, 0.04, 12, 16]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Quai bình gốm uốn cong nghệ thuật */}
              {[-0.18, 0.18].map((qx, qi) => (
                <mesh key={`handle-${qi}`} position={[qx, 0.08, 0]} rotation={[0, 0, qi === 0 ? 0.3 : -0.3]}>
                  <torusGeometry args={[0.1, 0.025, 8, 12, Math.PI]} />
                  <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
                </mesh>
              ))}
              {/* Làn nước chảy mềm mại từ miệng bình rót vào hồ */}
              <mesh position={[0, 0.45, 0.3]} rotation={[0.6, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.08, 0.75, 10]} />
                <meshStandardMaterial
                  color="#e0f2fe"
                  emissive="#7dd3fc"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.8}
                  roughness={0.05}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* ========================================================================= */}
      {/* 3. TẦNG 2 & TẦNG 3 ĐÀI PHUN: MÂM ĐÁ SÒ BIỂN & MÀN NƯỚC TRÀN MỀM MẠI       */}
      {/* ========================================================================= */}
      {/* Chân trụ La Mã Corinthian đục rãnh dọc nâng đỡ tầng 2 */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.45, 0.75, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Thân trụ chạm nổi 4 phù điêu hoa sen */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.6, 24]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.25} />
      </mesh>

      {/* MÂM ĐĨA ĐÁ CẨM THẠCH TRẮNG TẦNG 2 (BÁN KÍNH 2.8M) */}
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 2.2, 0.32, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Viền đĩa chạm gờ sóng lượn mạ chỉ vàng */}
      <mesh position={[0, 2.22, 0]}>
        <torusGeometry args={[2.78, 0.1, 14, 40]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <torusGeometry args={[2.78, 0.025, 8, 40]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mặt nước trong mâm tầng 2 */}
      <mesh position={[0, 2.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.68, 36]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.04}
          metalness={0.3}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* MÀN NƯỚC TRÀN VIỀN TẦNG 2 (WATER CURTAIN VEIL) - MỀM MẠI, ÓNG ÁNH */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[2.76, 3.2, 1.15, 36, 1, true]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#38bdf8"
          emissiveIntensity={0.25}
          transparent
          opacity={0.45}
          roughness={0.1}
        />
      </mesh>

      {/* CỘT ĐÁ NÂNG ĐỠ TẦNG 3 */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.85, 0.85, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* MÂM ĐĨA ĐÁ CẨM THẠCH TRẮNG TẦNG 3 (BÁN KÍNH 1.5M) */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.1, 0.25, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.34, 0]}>
        <torusGeometry args={[1.48, 0.08, 12, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Mặt nước trong mâm tầng 3 */}
      <mesh position={[0, 3.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.42, 28]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.03}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* MÀN NƯỚC TRÀN TẦNG 3 XUỐNG TẦNG 2 */}
      <mesh position={[0, 2.75, 0]}>
        <cylinderGeometry args={[1.46, 1.85, 0.95, 28, 1, true]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#38bdf8"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* 4. ĐỈNH ĐÀI PHUN: TƯỢNG THIÊN THẦN TUNG CÁNH MẠ VÀNG & BÚP NƯỚC TỰ NHIÊN  */}
      {/* ========================================================================= */}
      {/* Bệ đài hoa sen cẩm thạch đỡ tượng đỉnh */}
      <mesh position={[0, 3.65, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.65, 0.65, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* TƯỢNG THIÊN THẦN TUNG CÁNH HOÀNG GIA (MẠ VÀNG NGHỆ THUẬT) */}
      <group position={[0, 4.15, 0]}>
        {/* Thân tượng thiên thần thanh thoát */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.16, 0.85, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Đầu tượng */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Đôi cánh thiên thần dang rộng vươn lên mây trời */}
        {[-1, 1].map((dir, wingIdx) => (
          <mesh
            key={`wing-${wingIdx}`}
            position={[dir * 0.22, 0.72, -0.06]}
            rotation={[0.3, dir * 0.4, dir * 0.75]}
            castShadow
          >
            <boxGeometry args={[0.48, 0.18, 0.04]} />
            <meshStandardMaterial color="#fef08a" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}
        {/* Bình gốm nhỏ trên tay thiên thần dốc nước */}
        <mesh position={[0, 1.05, 0.1]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.09, 0.2, 10]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* BÚP NƯỚC ĐỈNH PHUN XÒE NỞ TỰ NHIÊN (ANIMATED FOUNTAIN JET) */}
      <group ref={centralSpoutRef} position={[0, 5.25, 0.1]}>
        {/* Cột nước trắng mờ vươn cao */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 1.1, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={0.65}
            transparent
            opacity={0.88}
            roughness={0.08}
          />
        </mesh>
        {/* Vòm búp nước xòe rủ mềm mại như hoa chuông */}
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial
            color="#bae6fd"
            emissive="#38bdf8"
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* VÒNG BỌT NƯỚC TRẮNG SỦI BỌT DẬP DỀNH QUANH MẶT HỒ (ANIMATED FOAM) */}
      <group ref={foamRipplesRef} position={[0, 0.81, 0]}>
        {/* Vòng bọt nước chân tầng 2 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.7, 3.1, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
            roughness={0.3}
          />
        </mesh>
        {/* Vòng bọt nước chân mâm đĩa */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.7, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.4}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* ĐÈN LED CHIẾU SÁNG NGẦM DƯỚI NƯỚC (SAPPHIRE & CYAN ILLUMINATION) */}
      <pointLight position={[0, 1.2, 0]} color="#38bdf8" intensity={2.6} distance={12} />
      <pointLight position={[0, 3.4, 0]} color="#06b6d4" intensity={1.8} distance={8} />

      {/* ========================================================================= */}
      {/* 5. BỐN BỒN HOA CÔNG VIÊN PARTERRE CHÂU ÂU UỐN LƯỢN (4 ROYAL FLOWER BEDS)   */}
      {/* ========================================================================= */}
      {[
        { cx: -8.6, cz: -8.6, rot: 0.785 },
        { cx: 8.6, cz: -8.6, rot: -0.785 },
        { cx: -8.6, cz: 8.6, rot: 2.356 },
        { cx: 8.6, cz: 8.6, rot: -2.356 },
      ].map((bed, idx) => (
        <group key={`flower-bed-${idx}`} position={[bed.cx, 0, bed.cz]} rotation={[0, bed.rot, 0]}>
          {/* Gờ đá cẩm thạch trắng bo viền bồn hoa */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.22, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4.2, 0.44, 2.4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </RigidBody>
          {/* Gờ phào chỉ vàng kim trên mép bồn hoa */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[4.3, 0.05, 2.5]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Lớp đất mùn hữu cơ màu nâu sẫm */}
          <mesh position={[0, 0.46, 0]}>
            <boxGeometry args={[3.9, 0.06, 2.1]} />
            <meshStandardMaterial color="#3f2e1e" roughness={0.9} />
          </mesh>

          {/* CÂY TÙNG CẮT TỈA HÌNH CẦU (BOXWOOD TOPIARY SPHERES) */}
          {[-1.3, 0, 1.3].map((tx, ti) => (
            <group key={`topiary-${ti}`} position={[tx, 0.72, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.36, 14, 14]} />
                <meshStandardMaterial color="#15803d" roughness={0.7} />
              </mesh>
            </group>
          ))}

          {/* THẢM HOA RỰC RỠ SẮC MÀU: HOA HỒNG ĐỎ, OẢI HƯƠNG, CÚC VÀNG, CẨM TÚ CẦU */}
          {[
            { x: -1.4, z: -0.65, c: '#e11d48' },
            { x: -0.7, z: -0.65, c: '#8b5cf6' },
            { x: 0, z: -0.65, c: '#f59e0b' },
            { x: 0.7, z: -0.65, c: '#0284c7' },
            { x: 1.4, z: -0.65, c: '#ec4899' },
            { x: -1.4, z: 0.65, c: '#f59e0b' },
            { x: -0.7, z: 0.65, c: '#0284c7' },
            { x: 0, z: 0.65, c: '#e11d48' },
            { x: 0.7, z: 0.65, c: '#8b5cf6' },
            { x: 1.4, z: 0.65, c: '#10b981' },
          ].map((fl, fi) => (
            <mesh key={`flower-${fi}`} position={[fl.x, 0.56, fl.z]} castShadow>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={fl.c} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 6. TÁM CỘT ĐÈN CÔNG VIÊN VICTORIA CỔ ĐIỂN CÓ GIỎ HOA TƯƠI (8 STREET LAMPS) */}
      {/* ========================================================================= */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
        const la = (k * Math.PI) / 4 + Math.PI / 8;
        const lx = Math.cos(la) * 11.2;
        const lz = Math.sin(la) * 11.2;
        return (
          <group key={`lamp-post-${k}`} position={[lx, 0, lz]}>
            {/* Chân cột đúc bằng gang đen */}
            <mesh position={[0, 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.36, 0.7, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Thân cột đèn sắt rèn thanh mảnh */}
            <mesh position={[0, 2.0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.12, 2.8, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Vòng đai đồng viền thân cột */}
            <mesh position={[0, 2.9, 0]}>
              <torusGeometry args={[0.09, 0.025, 8, 16]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Chụp đèn chính ở đỉnh */}
            <mesh position={[0, 3.65, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.14, 0.38, 8]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={1.8}
                roughness={0.15}
              />
            </mesh>
            {/* Nón chụp đèn bằng đồng cổ */}
            <mesh position={[0, 3.92, 0]} castShadow>
              <coneGeometry args={[0.34, 0.22, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* 2 Chụp đèn vệ tinh vươn sang 2 bên */}
            {[-0.45, 0.45].map((wx, wi) => (
              <group key={`sub-lamp-${wi}`} position={[wx, 3.25, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.16, 0.1, 0.28, 8]} />
                  <meshStandardMaterial
                    color="#fef08a"
                    emissive="#f59e0b"
                    emissiveIntensity={1.5}
                  />
                </mesh>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <coneGeometry args={[0.24, 0.16, 8]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
                </mesh>
              </group>
            ))}

            {/* Giỏ hoa tươi treo đung đưa trên thân cột đèn */}
            <group position={[0, 2.1, 0.28]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.14, 0.25, 12]} />
                <meshStandardMaterial color="#78350f" roughness={0.8} />
              </mesh>
              {/* Cụm hoa dạ yến thảo rủ sắc màu */}
              {[-0.1, 0.1].map((fx, fi) => (
                <mesh key={`basket-flower-${fi}`} position={[fx, 0.12, 0]}>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <meshStandardMaterial
                    color={fi === 0 ? '#ec4899' : '#a855f7'}
                    roughness={0.4}
                  />
                </mesh>
              ))}
            </group>

            {/* Đèn vàng ấm tỏa sáng về đêm */}
            <pointLight position={[0, 3.5, 0]} color="#fef08a" intensity={0.85} distance={6} />
          </group>
        );
      })}

      {/* ========================================================================= */}
      {/* 7. HÀNG GHẾ BĂNG CÔNG VIÊN CAO CẤP & BỘ BÀN TRÀ SÂN VƯỜN                   */}
      {/* ========================================================================= */}
      {[
        { gx: 0, gz: -8.8, ang: 0 },
        { gx: 0, gz: 8.8, ang: Math.PI },
        { gx: -8.8, gz: 0, ang: Math.PI / 2 },
        { gx: 8.8, gz: 0, ang: -Math.PI / 2 },
      ].map((bench, bi) => (
        <group key={`royal-bench-${bi}`} position={[bench.gx, 0, bench.gz]} rotation={[0, bench.ang, 0]}>
          {/* Chân ghế sắt uốn nghệ thuật màu đen */}
          {[-0.85, 0.85].map((bx, bxi) => (
            <mesh key={`b-leg-${bxi}`} position={[bx, 0.35, 0]} castShadow>
              <boxGeometry args={[0.08, 0.7, 0.55]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* Nan gỗ sồi bóng bẩy mặt ghế ngồi */}
          <mesh position={[0, 0.46, 0.05]} castShadow>
            <boxGeometry args={[1.95, 0.08, 0.52]} />
            <meshStandardMaterial color="#854d0e" roughness={0.45} />
          </mesh>
          {/* Tựa lưng nan gỗ sồi ấm áp */}
          <mesh position={[0, 0.85, -0.22]} rotation={[-0.18, 0, 0]} castShadow>
            <boxGeometry args={[1.95, 0.42, 0.08]} />
            <meshStandardMaterial color="#a16207" roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 8. XE ĐẨY BÁN KEM Ý CỔ ĐIỂN (VINTAGE ITALIAN GELATO CART)                  */}
      {/* ========================================================================= */}
      <group position={[6.8, 0, -6.8]} rotation={[0, -0.65, 0]}>
        {/* Thùng xe kem màu ngọc bích pastel */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[1.5, 0.75, 0.9]} />
          <meshStandardMaterial color="#0d9488" roughness={0.35} />
        </mesh>
        {/* Mặt bàn inox quầy kem sáng bóng */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.98]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.15} />
        </mesh>
        {/* 4 Nắp hũ kem tròn bằng đồng bóng loáng */}
        {[-0.45, -0.15, 0.15, 0.45].map((kx, ki) => (
          <mesh key={`gelato-lid-${ki}`} position={[kx, 1.12, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        {/* Bánh xe gỗ nan hoa cổ điển */}
        {[-0.5, 0.5].map((wx, wi) => (
          <mesh key={`cart-wheel-${wi}`} position={[wx, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.08, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
        ))}
        {/* Cột chống & Dù che sọc đỏ trắng viền ren */}
        <mesh position={[0, 1.85, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.45, 0]} castShadow>
          <coneGeometry args={[1.2, 0.45, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 9. ĐÀN CHIM BỒ CÂU TRẮNG & XÁM ĐẬU TRÊN SÂN QUẢNG TRƯỜNG                  */}
      {/* ========================================================================= */}
      <group ref={birdsGroupRef} position={[0, 0, 0]}>
        {[
          { x: -3.8, z: 2.8, rot: 0.8, c: '#ffffff' },
          { x: -4.3, z: 3.2, rot: 1.2, c: '#94a3b8' },
          { x: -3.5, z: 3.6, rot: -0.5, c: '#ffffff' },
          { x: 3.8, z: -2.5, rot: 2.2, c: '#ffffff' },
          { x: 4.2, z: -2.1, rot: 2.6, c: '#64748b' },
        ].map((bird, bidx) => (
          <group key={`pigeon-${bidx}`} position={[bird.x, 0.08, bird.z]} rotation={[0, bird.rot, 0]}>
            {/* Thân chim bồ câu */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color={bird.c} roughness={0.6} />
            </mesh>
            {/* Đầu chim */}
            <mesh position={[0, 0.16, 0.08]} castShadow>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={bird.c} roughness={0.6} />
            </mesh>
            {/* Mỏ chim cam nhỏ xíu */}
            <mesh position={[0, 0.15, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.02, 0.04, 6]} />
              <meshStandardMaterial color="#f97316" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 10. CỘT CHỈ ĐƯỜNG MỸ NGHỆ 4 HƯỚNG QUẢNG TRƯỜNG (ORNATE SIGNPOST)          */}
      {/* ========================================================================= */}
      <group position={[-5.6, 0, -4.8]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 2.7, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Mũi tên chỉ các hướng */}
        {[
          { text: '🏫 Play School', ang: 0, y: 2.45, bg: '#0284c7' },
          { text: '🎬 Cinema Center', ang: Math.PI / 2, y: 2.25, bg: '#7c3aed' },
          { text: '🛍️ Fashion Mall', ang: Math.PI, y: 2.05, bg: '#db2777' },
          { text: '🎣 Fishing Pier', ang: -Math.PI / 2, y: 1.85, bg: '#059669' },
        ].map((sign, si) => (
          <group key={`sign-${si}`} position={[0, sign.y, 0]} rotation={[0, sign.ang, 0]}>
            <mesh position={[0.42, 0, 0]} castShadow>
              <boxGeometry args={[0.85, 0.16, 0.04]} />
              <meshStandardMaterial color={sign.bg} roughness={0.3} />
            </mesh>
            {/* Mũi nhọn biển chỉ đường */}
            <mesh position={[0.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.1, 0.16, 3]} />
              <meshStandardMaterial color={sign.bg} roughness={0.3} />
            </mesh>
          </group>
        ))}
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
        <KeyPromptBadge keyLabel="F" position={[0, 2.55, 0.1]} color="#0284c7" />
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

      {/* Thảm cửa ra vào Quán Cafe */}
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
      </group>

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

      {/* Thảm cửa ra vào Quán Ăn */}
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
      </group>
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

      {/* Thảm cửa ra vào Tiệm Quần Áo */}
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
      </group>
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

      {/* Thảm cửa ra vào Showroom Xe */}
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
      </group>
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
      <mesh position={[0, 0.45, 0]}>
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
      <mesh position={[1.8, 5.6, -1.0]}>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.85} />
      </mesh>

      {/* Cửa gỗ & Mái hiên đón */}
      <mesh position={[0, 1.25, 2.93]}>
        <boxGeometry args={[1.35, 2.3, 0.1]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.65, 3.35]}>
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
      <mesh position={[-2.2, 0.45, 4.5]}>
        <boxGeometry args={[2.4, 0.85, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[2.2, 0.45, 4.5]}>
        <boxGeometry args={[2.4, 0.85, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Khu Vui Chơi Giải Trí Trung Tâm (Funfair & Playground Park)
 * Bao gồm: Đu quay ngựa gỗ (Merry-Go-Round), Cầu trượt lâu đài, Xích đu đôi, Bập bênh & Quầy kẹo bông
 */
export function PlaygroundPark({ position = [-33, 0, -8] }: { position?: [number, number, number] }) {
  const carouselRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (carouselRef.current) {
      carouselRef.current.rotation.y += delta * 0.85;
    }
  });

  return (
    <group position={position}>
      {/* Nền gạch sắc màu Khu Vui Chơi */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#fef08a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16.8, 10.8]} />
        <meshStandardMaterial color="#fde68a" roughness={0.9} />
      </mesh>

      {/* Hàng rào gỗ sắc màu bao quanh Khu Vui Chơi */}
      {[-8.2, -6.2, -4.2, -2.2, 2.2, 4.2, 6.2, 8.2].map((x, idx) => (
        <mesh key={`fence-s-${idx}`} position={[x, 0.45, 5.8]} castShadow>
          <boxGeometry args={[1.6, 0.7, 0.14]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#f43f5e' : '#38bdf8'} roughness={0.5} />
        </mesh>
      ))}
      {[-8.2, -6.2, -4.2, -2.2, 0, 2.2, 4.2, 6.2, 8.2].map((x, idx) => (
        <mesh key={`fence-n-${idx}`} position={[x, 0.45, -5.8]} castShadow>
          <boxGeometry args={[1.6, 0.7, 0.14]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#a855f7' : '#facc15'} roughness={0.5} />
        </mesh>
      ))}

      {/* Cổng chào Khu Vui Chơi (Carnival Arch) */}
      <group position={[0, 0, 5.8]}>
        <mesh position={[-1.5, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 3.6, 12]} />
          <meshStandardMaterial color="#ec4899" roughness={0.4} />
        </mesh>
        <mesh position={[1.5, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 3.6, 12]} />
          <meshStandardMaterial color="#ec4899" roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.6, 0]} castShadow>
          <boxGeometry args={[3.8, 0.75, 0.35]} />
          <meshStandardMaterial color="#7e22ce" roughness={0.4} />
        </mesh>
      </group>

      {/* 1. Đu Quay Ngựa Gỗ Hoàng Gia (Royal Carousel) */}
      <group position={[-4.8, 0, -0.5]}>
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.8, 3.0, 0.4, 24]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 3.8, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
        <group ref={carouselRef}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI) / 3;
            const hx = Math.cos(angle) * 2.0;
            const hz = Math.sin(angle) * 2.0;
            const horseColors = ['#ffffff', '#f472b6', '#38bdf8', '#fde047', '#c084fc', '#4ade80'];
            return (
              <group key={i} position={[hx, 0, hz]} rotation={[0, -angle, 0]}>
                <mesh position={[0, 1.9, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 3.0, 8]} />
                  <meshStandardMaterial color="#eab308" metalness={0.8} />
                </mesh>
                <mesh position={[0, 1.1 + (i % 2) * 0.25, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.35, 0.85]} />
                  <meshStandardMaterial color={horseColors[i]} roughness={0.4} />
                </mesh>
                <mesh position={[0, 1.45 + (i % 2) * 0.25, 0.32]} castShadow>
                  <boxGeometry args={[0.26, 0.42, 0.3]} />
                  <meshStandardMaterial color={horseColors[i]} roughness={0.4} />
                </mesh>
              </group>
            );
          })}
        </group>
        <mesh position={[0, 4.3, 0]} castShadow>
          <coneGeometry args={[3.1, 1.5, 16]} />
          <meshStandardMaterial color="#ec4899" roughness={0.4} />
        </mesh>
        <mesh position={[0, 5.2, 0]}>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* 2. Lâu đài Cầu trượt liên hoàn */}
      <group position={[1.2, 0, -1.5]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[2.0, 2.8, 2.0]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.3, 0]} castShadow>
          <coneGeometry args={[1.65, 1.3, 4]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.5} />
        </mesh>
        <mesh position={[-1.5, 1.0, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
          <boxGeometry args={[0.18, 2.6, 0.95]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[1.6, 0.9, 0]} rotation={[0, 0, Math.PI / 3.5]} castShadow>
          <boxGeometry args={[0.18, 3.0, 1.1]} />
          <meshStandardMaterial color="#10b981" roughness={0.3} />
        </mesh>
      </group>

      {/* 3. Xích đu đôi & Bập bênh */}
      <group position={[5.6, 0, -1.2]}>
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
          <meshStandardMaterial color="#ef4444" metalness={0.5} />
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
              <meshStandardMaterial color="#facc15" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Bập bênh đôi (Seesaw) */}
      <group position={[4.5, 0, 3.0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <coneGeometry args={[0.4, 0.7, 4]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
        <mesh position={[0, 0.72, 0]} rotation={[0, 0, 0.14]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.45]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Đại Công Viên Giải Trí Wonderland (Ở góc trái bản đồ đang để trống)
 * Gồm: Vòng Quay Mặt Trời Khổng Lồ (Giant Ferris Wheel), Lều Xiếc Hoàng Gia, Sân Xe Điện Đụng & Quầy Lễ Hội
 */
export function WonderlandAmusementPark({
  position = [-64, 0, -14],
}: {
  position?: [number, number, number];
}) {
  const wheelRef = useRef<THREE.Group>(null);
  const rocketSpinnerRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += delta * 0.35;
    }
    if (rocketSpinnerRef.current) {
      rocketSpinnerRef.current.rotation.y -= delta * 0.9;
    }
  });

  const cabinCount = 8;

  return (
    <group position={position}>
      {/* Thảm gạch Quảng trường Lễ Hội (20m x 42m) */}
      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[19, 42]} />
        <meshStandardMaterial color="#fce7f3" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[17.2, 40.2]} />
        <meshStandardMaterial color="#fbcfe8" roughness={0.8} />
      </mesh>

      {/* 1. VÒNG QUAY MẶT TRỜI KHỔNG LỒ (GIANT NEON FERRIS WHEEL) */}
      <group position={[0, 0, -11]}>
        {/* Chân đế đôi chữ A */}
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[8.5, 0.6, 5.2]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {[-1.4, 1.4].map((zOff, idx) => (
          <group key={idx} position={[0, 0, zOff]}>
            <mesh position={[-2.2, 5.2, 0]} rotation={[0, 0, -0.32]} castShadow>
              <cylinderGeometry args={[0.2, 0.28, 10.8, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh position={[2.2, 5.2, 0]} rotation={[0, 0, 0.32]} castShadow>
              <cylinderGeometry args={[0.2, 0.28, 10.8, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Trục chính phát sáng */}
        <mesh position={[0, 9.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 3.6, 16]} />
          <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.8} />
        </mesh>

        {/* Vành bánh xe & 8 Cabin quay tròn */}
        <group position={[0, 9.8, 0]} ref={wheelRef}>
          <mesh>
            <torusGeometry args={[6.8, 0.22, 12, 36]} />
            <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.9} />
          </mesh>
          <mesh>
            <torusGeometry args={[4.2, 0.14, 10, 28]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>

          {Array.from({ length: cabinCount }).map((_, i) => {
            const angle = (i * Math.PI * 2) / cabinCount;
            const cx = Math.cos(angle) * 6.8;
            const cy = Math.sin(angle) * 6.8;
            const cabinColors = [
              '#f43f5e',
              '#38bdf8',
              '#facc15',
              '#a855f7',
              '#4ade80',
              '#fb923c',
              '#ec4899',
              '#2dd4bf',
            ];
            return (
              <group key={i}>
                {/* Nan hoa */}
                <mesh
                  position={[cx / 2, cy / 2, 0]}
                  rotation={[0, 0, angle + Math.PI / 2]}
                >
                  <cylinderGeometry args={[0.07, 0.07, 6.8, 8]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.6} />
                </mesh>
                {/* Cabin hành khách */}
                <group position={[cx, cy, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[1.35, 1.35, 1.35]} />
                    <meshStandardMaterial color={cabinColors[i]} roughness={0.35} />
                  </mesh>
                  <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[1.4, 0.45, 1.0]} />
                    <meshStandardMaterial
                      color="#bae6fd"
                      emissive="#38bdf8"
                      emissiveIntensity={0.4}
                    />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      </group>

      {/* 2. THÁP TÊN LỬA XOAY VŨ TRỤ (SPACE ROCKET SPINNER) */}
      <group position={[0, 0, 2.5]}>
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.2, 4.5, 0.5, 24]} />
          <meshStandardMaterial color="#312e81" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.85, 6.0, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 6.5, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.1} />
        </mesh>
        <group position={[0, 4.6, 0]} ref={rocketSpinnerRef}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2;
            const rx = Math.cos(angle) * 3.4;
            const rz = Math.sin(angle) * 3.4;
            const rocketColors = ['#ef4444', '#22c55e', '#eab308', '#ec4899'];
            return (
              <group key={i}>
                <mesh
                  position={[rx / 2, -0.4, rz / 2]}
                  rotation={[0, -angle, Math.PI / 2.3]}
                >
                  <cylinderGeometry args={[0.07, 0.07, 3.5, 8]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
                </mesh>
                <group position={[rx, -0.8, rz]} rotation={[0, -angle, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.9, 0.65, 1.5]} />
                    <meshStandardMaterial color={rocketColors[i]} roughness={0.35} />
                  </mesh>
                  <mesh position={[0, 0.35, 0.2]}>
                    <sphereGeometry args={[0.35, 10, 10]} />
                    <meshStandardMaterial color="#e0f2fe" />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      </group>

      {/* 3. LỀU XIẾC & QUẦY VÉ CARNIVAL (CIRCUS PAVILION) */}
      <group position={[0, 0, 14.5]}>
        <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.4, 4.4, 4.2, 16]} />
          <meshStandardMaterial color="#fef08a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <coneGeometry args={[4.9, 2.6, 16]} />
          <meshStandardMaterial color="#e11d48" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.2, 4.35]}>
          <boxGeometry args={[2.2, 2.4, 0.25]} />
          <meshStandardMaterial color="#1e1b4b" />
        </mesh>
        {/* Cột bóng bay trang trí 2 bên */}
        {[-5.5, 5.5].map((bx, idx) => (
          <group key={idx} position={[bx, 0, 2.5]}>
            <mesh position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.8, 8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 3.0, 0]}>
              <sphereGeometry args={[0.45, 12, 12]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.35, 2.65, 0.2]}>
              <sphereGeometry args={[0.38, 12, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0.35, 2.65, -0.2]}>
              <sphereGeometry args={[0.38, 12, 12]} />
              <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.4} />
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
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.58, 0.62, 0.24, 10]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 10]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>

      {/* Thân cây gỗ sồi và nhánh cây */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.18, 0.3, 2.0, 8]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </mesh>

      {/* Tán lá đa tầng nhiều sắc độ xanh rừng tự nhiên (chỉ 1 tán chính castShadow để tối ưu GPU) */}
      <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.75} />
      </mesh>
      <mesh position={[-0.55, 2.0, 0.35]}>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#40916c" roughness={0.75} />
      </mesh>
      <mesh position={[0.55, 2.1, -0.3]}>
        <dodecahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#1b4332" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.05, 0]}>
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
      <mesh position={[0, 0.24, 0]}>
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
 * Vạch kẻ sang đường trắng chuẩn quốc tế (Zebra Crosswalk)
 * Luôn nằm gọn trong lòng đường nhựa giữa 2 vạch giới hạn trắng
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
      {/* 2 vạch dừng chuẩn trước vạch đi bộ */}
      <mesh position={[0, 0.031, -1.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.6, 0.16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.031, 1.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.6, 0.16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* 6 dải sọc trắng sang đường */}
      {[-2.25, -1.35, -0.45, 0.45, 1.35, 2.25].map((offset, i) => (
        <mesh key={i} position={[offset, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.48, 2.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Nút giao thông ngã tư / ngã ba / góc cua (Road Intersection)
 * Giải quyết triệt để lỗi vỉa hè & vạch kẻ đường đâm xuyên qua ngã tư
 */
function RoadIntersection({
  position,
  negZ = false,
  posZ = false,
  negX = false,
  posX = false,
}: {
  position: [number, number, number];
  negZ?: boolean;
  posZ?: boolean;
  negX?: boolean;
  posX?: boolean;
}) {
  const asphaltTex = useAsphaltTexture(2, 2);
  const roadWidth = 6.4;
  const sidewalkWidth = 1.3;
  const swOffset = roadWidth / 2 + sidewalkWidth / 2; // 3.85
  const lineOffset = roadWidth / 2 - 0.2; // 3.0

  return (
    <group position={position}>
      {/* Mặt nhựa trung tâm ngã giao (6.4m x 6.4m) */}
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadWidth, roadWidth]} />
        <meshStandardMaterial
          map={asphaltTex || undefined}
          color="#334155"
          roughness={0.85}
        />
      </mesh>

      {/* 4 trụ góc vỉa hè (1.3m x 1.3m) tại 4 góc ngã tư */}
      {[
        [-swOffset, -swOffset],
        [swOffset, -swOffset],
        [-swOffset, swOffset],
        [swOffset, swOffset],
      ].map(([cx, cz], idx) => (
        <mesh key={idx} position={[cx, 0.05, cz]} receiveShadow>
          <boxGeometry args={[sidewalkWidth, 0.1, sidewalkWidth]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      ))}

      {/* Bó vỉa hè & vạch trắng liền ở các hướng KHÔNG có đường nối tiếp (Ngã 3 hoặc Góc cua) */}
      {!negZ && (
        <>
          <mesh position={[0, 0.05, -swOffset]} receiveShadow>
            <boxGeometry args={[roadWidth, 0.1, sidewalkWidth]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.028, -lineOffset]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadWidth - 0.28, 0.12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
        </>
      )}
      {!posZ && (
        <>
          <mesh position={[0, 0.05, swOffset]} receiveShadow>
            <boxGeometry args={[roadWidth, 0.1, sidewalkWidth]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.028, lineOffset]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadWidth - 0.28, 0.12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
        </>
      )}
      {!negX && (
        <>
          <mesh position={[-swOffset, 0.05, 0]} receiveShadow>
            <boxGeometry args={[sidewalkWidth, 0.1, roadWidth]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          <mesh position={[-lineOffset, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, roadWidth - 0.28]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
        </>
      )}
      {!posX && (
        <>
          <mesh position={[swOffset, 0.05, 0]} receiveShadow>
            <boxGeometry args={[sidewalkWidth, 0.1, roadWidth]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          <mesh position={[lineOffset, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, roadWidth - 0.28]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

/**
 * Đoạn đường chuẩn nối giữa 2 nút giao (Road Segment)
 * Tự động căn chỉnh vỉa hè, vạch trắng biên, vạch vàng tim đường và vạch sang đường không chồng lấn
 */
function RoadSegment({
  position,
  asphaltLength,
  sidewalkLength,
  horizontal = false,
  crosswalkStart = false,
  crosswalkEnd = false,
  centerCrosswalk = false,
}: {
  position: [number, number, number];
  asphaltLength: number;
  sidewalkLength?: number;
  horizontal?: boolean;
  crosswalkStart?: boolean;
  crosswalkEnd?: boolean;
  centerCrosswalk?: boolean;
}) {
  const roadWidth = 6.4;
  const sidewalkWidth = 1.3;
  const swLen = sidewalkLength ?? Math.max(1, asphaltLength - sidewalkWidth * 2);
  const asphaltTex = useAsphaltTexture(2, Math.max(2, Math.floor(asphaltLength / 4)));

  // Tính khoảng trống an toàn cho vạch đứt vàng ở tim đường để không đè lên vạch đi bộ
  const zMin = -asphaltLength / 2 + (crosswalkStart ? 3.8 : 1.5);
  const zMax = asphaltLength / 2 - (crosswalkEnd ? 3.8 : 1.5);
  const usableDashSpan = Math.max(0, zMax - zMin);
  const dashStep = 4.2;
  const dashCount = centerCrosswalk ? 0 : Math.floor(usableDashSpan / dashStep);
  const dashStartOffset = zMin + (usableDashSpan - Math.max(0, dashCount - 1) * dashStep) / 2;

  return (
    <group position={position} rotation={[0, horizontal ? Math.PI / 2 : 0, 0]}>
      {/* Mặt đường nhựa Asphalt */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadWidth, asphaltLength]} />
        <meshStandardMaterial
          map={asphaltTex || undefined}
          color="#334155"
          roughness={0.85}
        />
      </mesh>

      {/* Vạch trắng liền mép đường 2 bên */}
      {[-roadWidth / 2 + 0.2, roadWidth / 2 - 0.2].map((lx, idx) => (
        <mesh key={idx} position={[lx, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, swLen]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
      ))}

      {/* Vỉa hè lát đá hoa cương hai bên đường (dừng đúng mép góc giao lộ) */}
      <mesh position={[-roadWidth / 2 - sidewalkWidth / 2, 0.05, 0]} receiveShadow>
        <boxGeometry args={[sidewalkWidth, 0.1, swLen]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[roadWidth / 2 + sidewalkWidth / 2, 0.05, 0]} receiveShadow>
        <boxGeometry args={[sidewalkWidth, 0.1, swLen]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* Vạch vàng đứt nét phân làn ở chính giữa */}
      {Array.from({ length: dashCount }).map((_, i) => {
        const zPos = dashStartOffset + i * dashStep;
        return (
          <mesh key={i} position={[0, 0.03, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 2.0]} />
            <meshStandardMaterial color="#eab308" roughness={0.5} />
          </mesh>
        );
      })}

      {/* Vạch sang đường người đi bộ ở 2 đầu hoặc chính giữa */}
      {crosswalkStart && <ZebraCrosswalk position={[0, 0, -asphaltLength / 2 + 1.65]} />}
      {crosswalkEnd && <ZebraCrosswalk position={[0, 0, asphaltLength / 2 - 1.65]} />}
      {centerCrosswalk && <ZebraCrosswalk position={[0, 0, 0]} />}
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
        <meshStandardMaterial color="#faf5ef" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[13.0, 14.05, 48]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      {/* 3. CÁC NÚT GIAO THÔNG VÒNG ĐAI TRONG (INNER RING INTERSECTIONS: ±21) */}
      <RoadIntersection position={[-21, 0, -21]} posX posZ />
      <RoadIntersection position={[21, 0, -21]} negX posZ />
      <RoadIntersection position={[-21, 0, 21]} posX negZ />
      <RoadIntersection position={[21, 0, 21]} negX negZ />

      <RoadIntersection position={[0, 0, -21]} negX posX negZ posZ />
      <RoadIntersection position={[0, 0, 21]} negX posX negZ posZ />
      <RoadIntersection position={[-21, 0, 0]} negZ posZ negX posX />
      <RoadIntersection position={[21, 0, 0]} negZ posZ negX posX />

      {/* 4. CÁC NÚT GIAO THÔNG VÒNG ĐAI NGOÀI (OUTER RING INTERSECTIONS: ±52) */}
      <RoadIntersection position={[-52, 0, -52]} posX posZ />
      <RoadIntersection position={[52, 0, -52]} negX posZ />
      <RoadIntersection position={[-52, 0, 52]} posX negZ />
      <RoadIntersection position={[52, 0, 52]} negX negZ />

      <RoadIntersection position={[0, 0, -52]} negX posX posZ />
      <RoadIntersection position={[0, 0, 52]} negX posX negZ />
      <RoadIntersection position={[-52, 0, 0]} negZ posZ posX />
      <RoadIntersection position={[52, 0, 0]} negZ posZ negX />

      {/* 5. LỐI SANG ĐƯỜNG NỐI QUẢNG TRƯỜNG ĐÀI PHUN NƯỚC RA 4 ĐẠI LỘ CHÍNH */}
      <RoadSegment
        position={[0, 0, -15.55]}
        asphaltLength={4.5}
        sidewalkLength={2.4}
        centerCrosswalk
      />
      <RoadSegment
        position={[0, 0, 15.55]}
        asphaltLength={4.5}
        sidewalkLength={2.4}
        centerCrosswalk
      />
      <RoadSegment
        position={[-15.55, 0, 0]}
        asphaltLength={4.5}
        sidewalkLength={2.4}
        horizontal
        centerCrosswalk
      />
      <RoadSegment
        position={[15.55, 0, 0]}
        asphaltLength={4.5}
        sidewalkLength={2.4}
        horizontal
        centerCrosswalk
      />

      {/* 6. ĐOẠN ĐƯỜNG VÒNG ĐAI NỘI ĐÔ (INNER RING SEGMENTS: D = 21 -> asphalt = 14.6) */}
      <RoadSegment position={[-10.5, 0, -21]} asphaltLength={14.6} horizontal crosswalkEnd />
      <RoadSegment position={[10.5, 0, -21]} asphaltLength={14.6} horizontal crosswalkStart />
      <RoadSegment position={[-10.5, 0, 21]} asphaltLength={14.6} horizontal crosswalkEnd />
      <RoadSegment position={[10.5, 0, 21]} asphaltLength={14.6} horizontal crosswalkStart />

      <RoadSegment position={[-21, 0, -10.5]} asphaltLength={14.6} crosswalkEnd />
      <RoadSegment position={[-21, 0, 10.5]} asphaltLength={14.6} crosswalkStart />
      <RoadSegment position={[21, 0, -10.5]} asphaltLength={14.6} crosswalkEnd />
      <RoadSegment position={[21, 0, 10.5]} asphaltLength={14.6} crosswalkStart />

      {/* 7. ĐẠI LỘ XUYÊN TÂM NỐI VÒNG ĐAI TRONG RA VÒNG ĐAI NGOÀI (D = 31 -> asphalt = 24.6) */}
      <RoadSegment position={[0, 0, -36.5]} asphaltLength={24.6} crosswalkStart crosswalkEnd />
      <RoadSegment position={[0, 0, 36.5]} asphaltLength={24.6} crosswalkStart crosswalkEnd />
      <RoadSegment
        position={[-36.5, 0, 0]}
        asphaltLength={24.6}
        horizontal
        crosswalkStart
        crosswalkEnd
      />
      <RoadSegment
        position={[36.5, 0, 0]}
        asphaltLength={24.6}
        horizontal
        crosswalkStart
        crosswalkEnd
      />

      {/* 8. ĐẠI LỘ VÒNG ĐAI NGOÀI (OUTER BOULEVARD SEGMENTS: D = 52 -> asphalt = 45.6) */}
      <RoadSegment position={[-26, 0, -52]} asphaltLength={45.6} horizontal crosswalkEnd />
      <RoadSegment position={[26, 0, -52]} asphaltLength={45.6} horizontal crosswalkStart />
      <RoadSegment position={[-26, 0, 52]} asphaltLength={45.6} horizontal crosswalkEnd />
      <RoadSegment position={[26, 0, 52]} asphaltLength={45.6} horizontal crosswalkStart />

      <RoadSegment position={[-52, 0, -26]} asphaltLength={45.6} crosswalkEnd />
      <RoadSegment position={[-52, 0, 26]} asphaltLength={45.6} crosswalkStart />
      <RoadSegment position={[52, 0, -26]} asphaltLength={45.6} crosswalkEnd />
      <RoadSegment position={[52, 0, 26]} asphaltLength={45.6} crosswalkStart />

      {/* 9. Tường biên vật lý giữ người chơi trong thành phố 160x160 */}
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
