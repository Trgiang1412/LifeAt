'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Html } from './SafeHtml';
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import useMultiplayerStore from '@/stores/useMultiplayerStore';
import { useAuth } from '@/context/AuthContext';
import { HOUSE_PLOTS } from '@/data/housePlots';
import type { ShopVenueId } from '@/data/worldGameplayData';
import { FashionAvatar, type FashionAvatarRef } from './FashionAvatar';

// ============================================================================
// KHỞI TẠO BIẾN DÙNG CHUNG BÊN NGOÀI ĐỂ TRIỆT TIÊU GC SPIKE Ở 60-120 FPS
// ============================================================================
const _vInput = new THREE.Vector3();
const _vMove = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _targetCamPos = new THREE.Vector3();

// Góc xoay -45 độ quanh trục Y để căn chỉnh chuẩn xác WASD theo phương Isometric
const ISOMETRIC_ROTATION_ANGLE = -Math.PI / 4;

// Tốc độ di chuyển của người chơi phong cách Play Together (m/s)
const MOVE_SPEED = 7.5;
const SKATEBOARD_SPEED = 14.5;

// Lực nhảy Spacebar
const JUMP_FORCE = 8.5;

// Độ lệch camera góc nhìn cận cảnh sống động [18, 18, 18]
const CAMERA_OFFSET = new THREE.Vector3(18, 18, 18);

interface PlayerPhysicsProps {
  initialPosition?: [number, number, number];
  housePosition?: [number, number, number];
  isInteriorMode?: boolean;
  isFishing?: boolean;
  isSkateboarding?: boolean;
  activeVehicle?: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
  outfitColor?: string;
  hatColor?: string;
  currentEmote?: string | null;
  teleportTarget?: { x: number; z: number; id: number } | null;
  cameraOrbitAngle?: number;
  onNearFishingPier?: (isNear: boolean) => void;
  onNearPlayerHouse?: (isNear: boolean, isInside: boolean) => void;
  onEnterPlotInterior?: (plotCode: string | null) => void;
  onNearShopVenue?: (shopId: ShopVenueId | null) => void;
  onStepHouseDoor?: (plotCode: string) => void;
  onStepShopDoor?: (shopId: ShopVenueId) => void;
  onStepInteriorExitDoor?: () => void;
  onInteriorZoneChange?: (zone: 'BUY' | 'WORK' | null) => void;
}

const SHOP_LOCATIONS: Array<{
  id: ShopVenueId;
  x: number;
  z: number;
  doorX: number;
  doorZ: number;
}> = [
  { id: 'CAFE', x: 34, z: 35, doorX: 34, doorZ: 39.35 },
  { id: 'DINER', x: 35, z: 13, doorX: 35, doorZ: 17.15 },
  { id: 'CLOTHING', x: 12, z: -34, doorX: 12, doorZ: -29.8 },
  { id: 'CAR_SHOWROOM', x: -12, z: -34, doorX: -12, doorZ: -29.45 },
];

export default function PlayerPhysics({
  initialPosition = [0, 1.2, 5],
  housePosition = [-10.5, 0, 32],
  isInteriorMode = false,
  isFishing = false,
  isSkateboarding = false,
  activeVehicle = 'none',
  outfitColor = '#38bdf8',
  hatColor = '#f59e0b',
  currentEmote = null,
  teleportTarget = null,
  cameraOrbitAngle = Math.PI / 4,
  onNearFishingPier,
  onNearPlayerHouse,
  onEnterPlotInterior,
  onNearShopVenue,
  onStepHouseDoor,
  onStepShopDoor,
  onStepInteriorExitDoor,
  onInteriorZoneChange,
}: PlayerPhysicsProps) {
  const { user } = useAuth();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const avatarRef = useRef<FashionAvatarRef>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const currentRotationY = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(true);
  const walkCycleRef = useRef<number>(0);
  const canJumpRef = useRef<boolean>(true);
  const nearPierStateRef = useRef<boolean>(false);
  const nearHouseStateRef = useRef<boolean>(false);
  const insideHouseStateRef = useRef<boolean>(false);
  const insideAnyPlotRef = useRef<string | null>(null);
  const nearShopRef = useRef<ShopVenueId | null>(null);
  const interiorZoneRef = useRef<'BUY' | 'WORK' | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const doorTriggeredRef = useRef<boolean>(false);
  const lastAppliedTeleportIdRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    doorTriggeredRef.current = false;
    if (isInteriorMode && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: 0, y: 0.3, z: 7.5 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (!isInteriorMode && rigidBodyRef.current) {
      const targetX = teleportTarget ? teleportTarget.x : initialPosition[0];
      const targetZ = teleportTarget ? teleportTarget.z : initialPosition[2];
      if (teleportTarget) {
        lastAppliedTeleportIdRef.current = teleportTarget.id;
      }
      rigidBodyRef.current.setTranslation({ x: targetX, y: 1.2, z: targetZ }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [isInteriorMode]);

  // Xử lý dịch chuyển tức thời khi chọn địa điểm trên bản đồ thành phố (chỉ áp dụng khi ở ngoài thành phố)
  useEffect(() => {
    if (!isInteriorMode && teleportTarget && rigidBodyRef.current) {
      lastAppliedTeleportIdRef.current = teleportTarget.id;
      rigidBodyRef.current.setTranslation(
        { x: teleportTarget.x, y: 1.2, z: teleportTarget.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [teleportTarget, isInteriorMode]);

  // Đọc phím điều khiển từ KeyboardControls của @react-three/drei
  const [, getKeys] = useKeyboardControls();

  const playerName = user?.tenDangNhap || 'Bạn';
  const playerColor = outfitColor || '#38bdf8';
  const effectiveVehicle =
    activeVehicle !== 'none' ? activeVehicle : isSkateboarding ? 'skateboard' : 'none';

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    // Đảm bảo nếu có lệnh dịch chuyển (teleportTarget) chưa được áp dụng lúc mount thì áp dụng ngay ở frame đầu tiên
    if (
      !isInteriorMode &&
      teleportTarget &&
      teleportTarget.id !== lastAppliedTeleportIdRef.current
    ) {
      lastAppliedTeleportIdRef.current = teleportTarget.id;
      rigidBodyRef.current.setTranslation(
        { x: teleportTarget.x, y: 1.2, z: teleportTarget.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const { forward, backward, left, right, jump, sprint } = getKeys() as any;
    const currentVel = rigidBodyRef.current.linvel();
    const playerPos = rigidBodyRef.current.translation();

    // Kiểm tra tiếp đất để cho phép nhảy (vận tốc Y gần bằng 0 và độ cao Y hợp lý)
    isGroundedRef.current = Math.abs(currentVel.y) < 0.25;

    const elapsedSinceMount = Date.now() - mountTimeRef.current;

    if (isInteriorMode) {
      // Giữ nhân vật luôn ổn định trên mặt sàn phòng nội thất rộng lớn (32m x 26m), không bao giờ bị rơi hay giật
      if (
        playerPos.y < -0.15 ||
        Math.abs(playerPos.x) > 15.2 ||
        playerPos.z < -12.0 ||
        playerPos.z > 12.2
      ) {
        const safeX = THREE.MathUtils.clamp(playerPos.x, -14.8, 14.8);
        const safeZ = THREE.MathUtils.clamp(playerPos.z, -11.5, 11.6);
        rigidBodyRef.current.setTranslation({ x: safeX, y: 0.1, z: safeZ }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }

      // KHI ĐANG Ở BÊN TRONG KHÔNG GIAN NỘI THẤT 3D RỘNG LỚN (NHÀ HOẶC QUÁN)
      // 1. Kiểm tra nếu đi bộ ra thảm Cửa Thoát (Exit Door ở [0, 0, 11.4])
      if (
        !doorTriggeredRef.current &&
        elapsedSinceMount > 1100 &&
        Math.abs(playerPos.x) <= 2.8 &&
        playerPos.z >= 10.5
      ) {
        doorTriggeredRef.current = true;
        onStepInteriorExitDoor?.();
      }

      // 2. Kiểm tra vùng đứng gần Quầy Mua Hàng (bên trái) hoặc Quầy Nhân Viên (bên phải) trong Quán
      let nextZone: 'BUY' | 'WORK' | null = null;
      if (playerPos.z <= 2.5 && playerPos.x <= -2.0) {
        nextZone = 'BUY';
      } else if (playerPos.z <= 1.0 && playerPos.x >= 3.5) {
        nextZone = 'WORK';
      }
      if (nextZone !== interiorZoneRef.current) {
        interiorZoneRef.current = nextZone;
        onInteriorZoneChange?.(nextZone);
      }
    } else {
      // KHI ĐANG Ở NGOÀI THÀNH PHỐ
      // Kiểm tra xem có đang đứng gần khu vực hồ câu cá (X: -48 đến -24, Z: -40 đến -15)
      const isNearLake =
        playerPos.x < -24 && playerPos.x > -48 && playerPos.z < -15 && playerPos.z > -40;
      if (isNearLake !== nearPierStateRef.current) {
        nearPierStateRef.current = isNearLake;
        onNearFishingPier?.(isNearLake);
      }

      // Kiểm tra xem người chơi có đang ở khuôn viên hoặc bên trong Ngôi Nhà Cấp 4 của mình không
      const hx = housePosition[0];
      const hz = housePosition[2];
      const isNearHouse =
        playerPos.x >= hx - 6.2 &&
        playerPos.x <= hx + 6.2 &&
        playerPos.z >= hz - 7.5 &&
        playerPos.z <= hz + 6.5;
      const isInsideHouse =
        playerPos.x >= hx - 4.7 &&
        playerPos.x <= hx + 4.7 &&
        playerPos.z >= hz - 1.8 &&
        playerPos.z <= hz + 4.8;

      if (
        isNearHouse !== nearHouseStateRef.current ||
        isInsideHouse !== insideHouseStateRef.current
      ) {
        nearHouseStateRef.current = isNearHouse;
        insideHouseStateRef.current = isInsideHouse;
        onNearPlayerHouse?.(isNearHouse, isInsideHouse);
      }

      // Kiểm tra xem người chơi có bước vào CỬA CHÍNH của bất kỳ ngôi nhà nào không -> Chuyển vào Không Gian Nhà 3D
      let detectedInsidePlot: string | null = null;
      for (const plot of HOUSE_PLOTS) {
        const px = plot.position[0];
        const pz = plot.position[2];
        if (
          playerPos.x >= px - 4.7 &&
          playerPos.x <= px + 4.7 &&
          playerPos.z >= pz - 2.1 &&
          playerPos.z <= pz + 4.8
        ) {
          detectedInsidePlot = plot.maLoDat;
          if (
            !doorTriggeredRef.current &&
            elapsedSinceMount > 1300 &&
            Math.abs(playerPos.x - px) <= 2.2 &&
            playerPos.z >= pz - 2.1 &&
            playerPos.z <= pz + 2.2
          ) {
            doorTriggeredRef.current = true;
            onStepHouseDoor?.(plot.maLoDat);
          }
          break;
        }
      }
      if (detectedInsidePlot !== insideAnyPlotRef.current) {
        insideAnyPlotRef.current = detectedInsidePlot;
        onEnterPlotInterior?.(detectedInsidePlot);
      }

      // Kiểm tra xem người chơi có đứng gần hoặc bước vào CỬA CHÍNH của 4 Quán (Cafe, Quán Ăn, Quần Áo, Xe)
      let detectedShop: ShopVenueId | null = null;
      for (const shop of SHOP_LOCATIONS) {
        if (Math.abs(playerPos.x - shop.x) <= 9.2 && Math.abs(playerPos.z - shop.z) <= 9.2) {
          detectedShop = shop.id;
          if (
            !doorTriggeredRef.current &&
            elapsedSinceMount > 1300 &&
            Math.abs(playerPos.x - shop.doorX) <= 2.6 &&
            Math.abs(playerPos.z - shop.doorZ) <= 1.65
          ) {
            doorTriggeredRef.current = true;
            onStepShopDoor?.(shop.id);
          }
          break;
        }
      }
      if (detectedShop !== nearShopRef.current) {
        nearShopRef.current = detectedShop;
        onNearShopVenue?.(detectedShop);
      }
    }

    // 1. Xử lý nhảy (Jump) bằng phím Space
    if (jump && isGroundedRef.current && canJumpRef.current && !isFishing) {
      canJumpRef.current = false;
      rigidBodyRef.current.setLinvel(
        {
          x: currentVel.x,
          y: JUMP_FORCE,
          z: currentVel.z,
        },
        true
      );
      setTimeout(() => {
        canJumpRef.current = true;
      }, 300);
    }

    // 2. Đọc phím WASD / Phím mũi tên
    let inputZ = 0;
    let inputX = 0;

    if (!isFishing) {
      if (forward) inputZ -= 1;
      if (backward) inputZ += 1;
      if (left) inputX -= 1;
      if (right) inputX += 1;
    }

    _vInput.set(inputX, 0, inputZ);
    const isMoving = _vInput.lengthSq() > 0;
    let vehicleSpeed = MOVE_SPEED;
    if (effectiveVehicle === 'sportscar') vehicleSpeed = 23.0;
    else if (effectiveVehicle === 'motorbike') vehicleSpeed = 19.0;
    else if (effectiveVehicle === 'vespa') vehicleSpeed = 16.0;
    else if (effectiveVehicle === 'skateboard' || isSkateboarding || sprint)
      vehicleSpeed = SKATEBOARD_SPEED;
    const activeSpeed = vehicleSpeed;

    if (isMoving) {
      _vInput.normalize();

      // Hướng di chuyển tương đối bám sát góc quay 360 độ của Camera (Intuitive 360° Movement)
      const curAngle = cameraOrbitAngle ?? Math.PI / 4;
      const forwardX = -Math.sin(curAngle);
      const forwardZ = -Math.cos(curAngle);
      const rightX = Math.cos(curAngle);
      const rightZ = -Math.sin(curAngle);

      const targetMoveX = forwardX * (-inputZ) + rightX * inputX;
      const targetMoveZ = forwardZ * (-inputZ) + rightZ * inputX;
      _vMove.set(targetMoveX, 0, targetMoveZ);
      if (_vMove.lengthSq() > 0) {
        _vMove.normalize();
      }

      const targetX = _vMove.x * activeSpeed;
      const targetZ = _vMove.z * activeSpeed;

      rigidBodyRef.current.setLinvel(
        {
          x: targetX,
          y: currentVel.y,
          z: targetZ,
        },
        true
      );

      // Nội suy góc xoay mặt nhân vật
      const targetAngle = Math.atan2(_vMove.x, _vMove.z);
      let angleDiff = targetAngle - currentRotationY.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      currentRotationY.current += angleDiff * Math.min(1.0, delta * 16);

      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = currentRotationY.current;
      }

      // Hoạt ảnh bước chân sải dài phong cách người mẫu thời trang
      walkCycleRef.current += delta * 13;
      const legSwing = Math.sin(walkCycleRef.current) * 0.52;
      const armSwing = Math.cos(walkCycleRef.current) * 0.45;

      const leftLeg = avatarRef.current?.leftLeg || leftLegRef.current;
      const rightLeg = avatarRef.current?.rightLeg || rightLegRef.current;
      const leftArm = avatarRef.current?.leftArm || leftArmRef.current;
      const rightArm = avatarRef.current?.rightArm || rightArmRef.current;

      if (leftLeg) leftLeg.rotation.x = legSwing;
      if (rightLeg) rightLeg.rotation.x = -legSwing;
      if (leftArm) leftArm.rotation.x = -armSwing;
      if (rightArm) rightArm.rotation.x = armSwing;
    } else {
      // Dừng di chuyển ngang khi thả phím
      rigidBodyRef.current.setLinvel(
        {
          x: 0,
          y: currentVel.y,
          z: 0,
        },
        true
      );

      const leftLeg = avatarRef.current?.leftLeg || leftLegRef.current;
      const rightLeg = avatarRef.current?.rightLeg || rightLegRef.current;
      const leftArm = avatarRef.current?.leftArm || leftArmRef.current;
      const rightArm = avatarRef.current?.rightArm || rightArmRef.current;

      // Trở về tư thế đứng bình thường (Idle)
      if (leftLeg) leftLeg.rotation.x *= 0.8;
      if (rightLeg) rightLeg.rotation.x *= 0.8;

      // Nếu đang nhảy múa (Dance Emote)
      if (currentEmote === 'dance') {
        const danceCycle = state.clock.elapsedTime * 6;
        if (meshGroupRef.current) {
          meshGroupRef.current.position.y = Math.abs(Math.sin(danceCycle)) * 0.2;
          meshGroupRef.current.rotation.y = currentRotationY.current + Math.sin(danceCycle) * 0.4;
        }
        if (leftArm) leftArm.rotation.z = Math.sin(danceCycle) * 0.8;
        if (rightArm) rightArm.rotation.z = -Math.sin(danceCycle) * 0.8;
      } else if (currentEmote === 'wave') {
        // Vẫy tay chào thanh lịch
        if (rightArm) {
          rightArm.rotation.x = -2.2 + Math.sin(state.clock.elapsedTime * 9) * 0.4;
          rightArm.rotation.z = 0.3;
        }
        if (leftArm) {
          leftArm.rotation.x *= 0.8;
          leftArm.rotation.z *= 0.8;
        }
      } else {
        if (leftArm) {
          leftArm.rotation.x *= 0.8;
          leftArm.rotation.z *= 0.8;
        }
        if (rightArm) {
          rightArm.rotation.x *= 0.8;
          rightArm.rotation.z *= 0.8;
        }
        if (meshGroupRef.current) meshGroupRef.current.position.y = 0;
      }
    }

    // 3. Smooth Camera Follow bám sát người chơi theo góc quay 360 độ (360 Orbit Camera)
    const curAngle = cameraOrbitAngle ?? Math.PI / 4;
    const orbitRadius = isInteriorMode ? 22.0 : 25.5;
    const camHeight = isInteriorMode ? 16.0 : 18.0;
    const camAnchorY = isInteriorMode ? 0.2 : Math.max(0, playerPos.y);

    _targetCamPos.set(
      playerPos.x + orbitRadius * Math.sin(curAngle),
      camAnchorY + camHeight,
      playerPos.z + orbitRadius * Math.cos(curAngle)
    );

    if (
      elapsedSinceMount < 200 ||
      state.camera.position.distanceToSquared(_targetCamPos) > 160
    ) {
      state.camera.position.copy(_targetCamPos);
    } else {
      state.camera.position.lerp(_targetCamPos, Math.min(1.0, delta * 8.5));
    }
    state.camera.lookAt(playerPos.x, camAnchorY + 1.15, playerPos.z);

    // 4. Phát sóng tọa độ và trạng thái lên Multiplayer Server (khi đang ở ngoài thành phố)
    if (!isInteriorMode) {
      useMultiplayerStore.getState().sendPosition(
        playerPos.x,
        playerPos.y,
        playerPos.z,
        currentRotationY.current,
        {
          isSkateboarding: effectiveVehicle === 'skateboard' || Boolean(sprint),
          activeVehicle: effectiveVehicle,
          isFishing,
          currentEmote,
        }
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      lockRotations
      position={initialPosition}
      userData={{ type: 'player' }}
      friction={0}
      restitution={0}
    >
      {/* Collider hình viên thuốc vừa vặn vóc dáng Model thời trang */}
      <CapsuleCollider
        args={[0.34, 0.42]}
        position={[0, 0.85, 0]}
        friction={0}
        restitution={0}
      />

      {/* Bảng tên & Level phong cách Play Together nổi trên đầu */}
      <Html position={[0, 2.25, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          {/* Tag cảm xúc Emote nổi nếu có */}
          {currentEmote === 'heart' && (
            <div style={{ fontSize: '20px', animation: 'bounce 0.8s infinite' }}>❤️</div>
          )}
          {currentEmote === 'dance' && (
            <div style={{ fontSize: '18px', animation: 'spin 1s infinite' }}>🎶</div>
          )}

          {/* Pill Badge Tên người chơi */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <span style={{ color: '#fbbf24', fontSize: '10px' }}>⭐ Lv.1</span>
            <span>{playerName}</span>
          </div>
        </div>
      </Html>

      {/* Model Nhân vật 3D phong cách Game Thời Trang cao cấp (Fashion Avatar) */}
      <group ref={meshGroupRef}>
        <FashionAvatar
          ref={avatarRef}
          outfitColor={playerColor}
          hatColor={hatColor}
          scale={1.35}
        />

        {/* VÁN TRƯỢT SKATEBOARD TỐC ĐỘ CAO PLAY TOGETHER */}
        {effectiveVehicle === 'skateboard' && (
          <group position={[0, 0.06, 0]}>
            {/* Mặt ván trượt màu vàng cam thể thao */}
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.48, 0.05, 1.15]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.3} />
            </mesh>
            {/* Sọc trang trí trên mặt ván */}
            <mesh position={[0, 0.068, 0]}>
              <boxGeometry args={[0.16, 0.01, 1.1]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
            {/* 4 bánh xe ván trượt */}
            {[-0.22, 0.22].map((wx) =>
              [-0.35, 0.35].map((wz) => (
                <mesh
                  key={`${wx}-${wz}`}
                  position={[wx, 0, wz]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <cylinderGeometry args={[0.06, 0.06, 0.08, 10]} />
                  <meshStandardMaterial color="#38bdf8" />
                </mesh>
              ))
            )}
          </group>
        )}

        {/* XE TAY GA VESPA Ý CỔ ĐIỂN */}
        {effectiveVehicle === 'vespa' && (
          <group position={[0, 0.12, 0]}>
            <mesh position={[0, 0.22, -0.1]} castShadow>
              <boxGeometry args={[0.52, 0.36, 1.25]} />
              <meshStandardMaterial color="#fde047" roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.55, 0.42]} castShadow>
              <boxGeometry args={[0.46, 0.55, 0.14]} />
              <meshStandardMaterial color="#fde047" roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.84, 0.42]}>
              <boxGeometry args={[0.68, 0.06, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
            {[-0.45, 0.45].map((wz, i) => (
              <mesh key={i} position={[0, 0.06, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        )}

        {/* MÔ TÔ PHÂN KHỐI LỚN DUCATI ĐỎ */}
        {effectiveVehicle === 'motorbike' && (
          <group position={[0, 0.14, 0]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[0.56, 0.42, 1.55]} />
              <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.62, 0.48]} rotation={[-Math.PI / 8, 0, 0]}>
              <boxGeometry args={[0.5, 0.38, 0.25]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[-0.58, 0.58].map((wz, i) => (
              <mesh key={i} position={[0, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.24, 0.24, 0.18, 14]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        )}

        {/* SIÊU XE MUI TRẦN LAMBORGHINI */}
        {effectiveVehicle === 'sportscar' && (
          <group position={[0, 0.16, 0]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[1.45, 0.42, 2.55]} />
              <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.52, 0.38]} rotation={[-Math.PI / 5, 0, 0]}>
              <boxGeometry args={[1.32, 0.35, 0.08]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.7} />
            </mesh>
            {[
              [-0.72, 0.06, -0.78],
              [0.72, 0.06, -0.78],
              [-0.72, 0.06, 0.78],
              [0.72, 0.06, 0.78],
            ].map(([wx, wy, wz], idx) => (
              <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.24, 0.24, 0.18, 12]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        )}

        {/* CẦN CÂU CÁ PLAY TOGETHER (HIỆN KHI Ở CHẾ ĐỘ CÂU CÁ) */}
        {isFishing && (
          <group position={[0.35, 0.65, 0.2]} rotation={[Math.PI / 4, 0, 0]}>
            {/* Thân cần câu dài vươn ra */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.045, 2.5, 8]} />
              <meshStandardMaterial color="#ea580c" roughness={0.3} />
            </mesh>
            {/* Cuộn dây cước */}
            <mesh position={[0, 0.25, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            {/* Dây câu buông xuống */}
            <mesh position={[0, 1.2, 0.8]} rotation={[-Math.PI / 6, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 1.8, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Phao câu màu đỏ trắng nổi trên nước */}
            <mesh position={[0, 0.25, 1.4]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#ef4444" roughness={0.2} />
            </mesh>
          </group>
        )}
      </group>
    </RigidBody>
  );
}
