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
import type {
  ShopVenueId,
  AvatarTopStyle,
  AvatarHatStyle,
  AvatarAccessoryStyle,
  WorldVehicleType,
} from '@/data/worldGameplayData';
import { FashionAvatar, type FashionAvatarRef } from './FashionAvatar';
import {
  computeAmusementRidePlayerTransform,
  type AmusementRideId,
} from './AmusementParkSystem';

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
  isSchoolMode?: boolean;
  isFishing?: boolean;
  isSkateboarding?: boolean;
  activeVehicle?: WorldVehicleType;
  vehicleColor?: string;
  outfitColor?: string;
  hatColor?: string;
  pantsColor?: string;
  shoeColor?: string;
  hairColor?: string;
  avatarStyle?: AvatarTopStyle;
  hatStyle?: AvatarHatStyle;
  accessory?: AvatarAccessoryStyle;
  currentEmote?: string | null;
  teleportTarget?: { x: number; z: number; id: number } | null;
  cameraOrbitAngle?: number;
  onNearFishingPier?: (isNear: boolean) => void;
  onNearPlayerHouse?: (isNear: boolean, isInside: boolean) => void;
  onEnterPlotInterior?: (plotCode: string | null) => void;
  onNearShopVenue?: (shopId: ShopVenueId | null) => void;
  onStepHouseDoor?: (plotCode: string) => void;
  onStepShopDoor?: (shopId: ShopVenueId) => void;
  onStepSchoolDoor?: () => void;
  onNearSchoolBuilding?: (isNear: boolean) => void;
  onStepCinemaDoor?: () => void;
  onNearCinemaBuilding?: (isNear: boolean) => void;
  activeAmusementRide?: AmusementRideId | null;
  onNearAmusementPark?: (isNear: boolean) => void;
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
  isSchoolMode = false,
  isFishing = false,
  isSkateboarding = false,
  activeVehicle = 'none',
  vehicleColor,
  outfitColor = '#38bdf8',
  hatColor = '#f59e0b',
  pantsColor = '#1e293b',
  shoeColor = '#ffffff',
  hairColor = '#1e293b',
  avatarStyle = 'streetwear',
  hatStyle = 'snapback',
  accessory = 'headphones',
  currentEmote = null,
  teleportTarget = null,
  cameraOrbitAngle = Math.PI / 4,
  onNearFishingPier,
  onNearPlayerHouse,
  onEnterPlotInterior,
  onNearShopVenue,
  onStepHouseDoor,
  onStepShopDoor,
  onStepSchoolDoor,
  onNearSchoolBuilding,
  onStepCinemaDoor,
  onNearCinemaBuilding,
  activeAmusementRide = null,
  onNearAmusementPark,
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
  const nearSchoolStateRef = useRef<boolean>(false);
  const nearCinemaStateRef = useRef<boolean>(false);
  const nearAmusementParkRef = useRef<boolean>(false);
  const interiorZoneRef = useRef<'BUY' | 'WORK' | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const doorTriggeredRef = useRef<boolean>(false);
  const lastAppliedTeleportIdRef = useRef<number>(0);
  const activeKeysRef = useRef<{ [code: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      activeKeysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete activeKeysRef.current[e.code];
    };

    const handleBlur = () => {
      activeKeysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      activeKeysRef.current = {};
    };
  }, []);

  // Bộ điều khiển vật lý lái xe chân thực (Gia tốc, bẻ lái, thân xe nghiêng, bánh xe lăn)
  const vehicleCurrentSpeedRef = useRef<number>(0);
  const vehicleWheelSpinRef = useRef<number>(0);
  const vehicleLeanAngleRef = useRef<number>(0);
  const vehicleMoveDirRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));

  useEffect(() => {
    mountTimeRef.current = Date.now();
    doorTriggeredRef.current = false;
    activeKeysRef.current = {};
    if (isInteriorMode && rigidBodyRef.current) {
      if (isSchoolMode) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 0.42, z: 2.05 }, true);
      } else {
        rigidBodyRef.current.setTranslation({ x: 0, y: 0.3, z: 7.5 }, true);
      }
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (!isInteriorMode && rigidBodyRef.current) {
      const targetX = teleportTarget ? teleportTarget.x : initialPosition[0];
      const targetZ = teleportTarget ? teleportTarget.z : initialPosition[2];
      if (teleportTarget) {
        lastAppliedTeleportIdRef.current = teleportTarget.id;
      }
      rigidBodyRef.current.setTranslation({ x: targetX, y: 0.6, z: targetZ }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [isInteriorMode, isSchoolMode]);

  // Xử lý dịch chuyển tức thời khi chọn địa điểm trên bản đồ thành phố (chỉ áp dụng khi ở ngoài thành phố)
  useEffect(() => {
    if (!isInteriorMode && teleportTarget && rigidBodyRef.current) {
      activeKeysRef.current = {};
      lastAppliedTeleportIdRef.current = teleportTarget.id;
      rigidBodyRef.current.setTranslation(
        { x: teleportTarget.x, y: 0.6, z: teleportTarget.z },
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

  const isCar = ['sportscar', 'rollsroyce', 'gclass', 'cybertruck'].includes(effectiveVehicle);
  const isMotorcycle = ['motorbike', 'harley', 'vespa'].includes(effectiveVehicle);
  const isBoard = ['skateboard', 'hoverboard'].includes(effectiveVehicle);

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
        { x: teleportTarget.x, y: 0.6, z: teleportTarget.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // Snap tức thì vị trí camera đến mục tiêu teleport để không bị trôi mất nhân vật
      const camAngle = cameraOrbitAngle ?? Math.PI / 4;
      _targetCamPos.set(
        teleportTarget.x + 25.5 * Math.sin(camAngle),
        18.0,
        teleportTarget.z + 25.5 * Math.cos(camAngle)
      );
      state.camera.position.copy(_targetCamPos);
      state.camera.lookAt(teleportTarget.x, 1.15, teleportTarget.z);
    }

    const { forward, backward, left, right, jump, sprint } = getKeys() as any;
    const currentVel = rigidBodyRef.current.linvel();
    const playerPos = rigidBodyRef.current.translation();

    // Kiểm tra tiếp đất để cho phép nhảy (vận tốc Y gần bằng 0 và độ cao Y hợp lý)
    isGroundedRef.current = Math.abs(currentVel.y) < 0.25;

    const elapsedSinceMount = Date.now() - mountTimeRef.current;
    const isDoorCooldownActive = elapsedSinceMount < 3200;

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
      // Cơ chế bảo vệ cứu hộ sàn: Không bao giờ để nhân vật bị rơi xuyên map ngoài thành phố
      if (playerPos.y < -0.3 || Math.abs(playerPos.x) > 78 || Math.abs(playerPos.z) > 78) {
        const safeX = THREE.MathUtils.clamp(playerPos.x, -72, 72);
        const safeZ = THREE.MathUtils.clamp(playerPos.z, -72, 72);
        rigidBodyRef.current.setTranslation({ x: safeX, y: 0.6, z: safeZ }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }

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
            !isDoorCooldownActive &&
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
            !isDoorCooldownActive &&
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

      // Kiểm tra xem người chơi có đứng gần hoặc bước vào CỬA CHÍNH của TRƯỜNG HỌC ([-35, 0, 36])
      const distToSchoolCenter = Math.hypot(playerPos.x - -35, playerPos.z - 36);
      const isNearSchool = distToSchoolCenter <= 9.5;
      if (isNearSchool !== nearSchoolStateRef.current) {
        nearSchoolStateRef.current = isNearSchool;
        onNearSchoolBuilding?.(isNearSchool);
      }
      if (
        !doorTriggeredRef.current &&
        !isDoorCooldownActive &&
        Math.abs(playerPos.x - -35) <= 2.4 &&
        Math.abs(playerPos.z - 40.2) <= 1.7
      ) {
        doorTriggeredRef.current = true;
        onStepSchoolDoor?.();
      }

      // Kiểm tra xem người chơi có đứng gần hoặc bước vào CỬA CHÍNH của RẠP CHIẾU PHIM ([35, 0, -13])
      const distToCinemaCenter = Math.hypot(playerPos.x - 35, playerPos.z - -13);
      const isNearCinema = distToCinemaCenter <= 9.5;
      if (isNearCinema !== nearCinemaStateRef.current) {
        nearCinemaStateRef.current = isNearCinema;
        onNearCinemaBuilding?.(isNearCinema);
      }
      if (
        !doorTriggeredRef.current &&
        !isDoorCooldownActive &&
        Math.abs(playerPos.x - 35) <= 2.4 &&
        Math.abs(playerPos.z - -8.5) <= 1.7
      ) {
        doorTriggeredRef.current = true;
        onStepCinemaDoor?.();
      }

      // Kiểm tra xem người chơi có đang đứng gần 2 Khu Vui Chơi Giải Trí (Smile Park & Wonderland Park)
      const isNearPark =
        playerPos.x <= -22 &&
        playerPos.x >= -76 &&
        playerPos.z <= 10 &&
        playerPos.z >= -38;
      if (isNearPark !== nearAmusementParkRef.current) {
        nearAmusementParkRef.current = isNearPark;
        onNearAmusementPark?.(isNearPark);
      }
    }

    // Nếu người chơi đang ngồi trên một trò chơi trong Khu Vui Chơi (Vòng quay Mặt trời, Tháp rơi, Ngựa gỗ...)
    if (!isInteriorMode && activeAmusementRide) {
      const rideTransform = computeAmusementRidePlayerTransform(
        activeAmusementRide,
        state.clock.elapsedTime
      );
      rigidBodyRef.current.setTranslation(
        { x: rideTransform.x, y: rideTransform.y, z: rideTransform.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      currentRotationY.current = rideTransform.rotationY;
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = rideTransform.rotationY;
        meshGroupRef.current.position.y = 0;
      }

      const curAngle = cameraOrbitAngle ?? Math.PI / 4;
      _targetCamPos.set(
        rideTransform.x + rideTransform.camOrbitRadius * Math.sin(curAngle),
        rideTransform.y + rideTransform.camHeight,
        rideTransform.z + rideTransform.camOrbitRadius * Math.cos(curAngle)
      );
      state.camera.position.lerp(_targetCamPos, Math.min(1.0, delta * 6.5));
      state.camera.lookAt(rideTransform.x, rideTransform.y + 1.0, rideTransform.z);

      useMultiplayerStore.getState().sendPosition(
        rideTransform.x,
        rideTransform.y,
        rideTransform.z,
        rideTransform.rotationY,
        {
          isSkateboarding: false,
          activeVehicle: 'none',
          isFishing: false,
          currentEmote: 'wave',
        }
      );
      return;
    }

    const isTypingInInput =
      typeof document !== 'undefined' &&
      (document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA');

    const isForward = !isTypingInInput && Boolean(activeKeysRef.current['KeyW'] || activeKeysRef.current['ArrowUp']);
    const isBackward = !isTypingInInput && Boolean(activeKeysRef.current['KeyS'] || activeKeysRef.current['ArrowDown']);
    const isLeft = !isTypingInInput && Boolean(activeKeysRef.current['KeyA'] || activeKeysRef.current['ArrowLeft']);
    const isRight = !isTypingInInput && Boolean(activeKeysRef.current['KeyD'] || activeKeysRef.current['ArrowRight']);
    const isJumpKey = !isTypingInInput && Boolean(activeKeysRef.current['Space'] || jump);
    const isSprintKey = !isTypingInInput && Boolean(activeKeysRef.current['ShiftLeft'] || activeKeysRef.current['ShiftRight'] || sprint);

    // 1. Xử lý nhảy (Jump) bằng phím Space (bỏ qua nếu đang gõ chữ trong ô input hoặc trong lớp học)
    if (isJumpKey && !isSchoolMode && !isTypingInInput && isGroundedRef.current && canJumpRef.current && !isFishing) {
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

    // 2. Đọc phím WASD / Phím mũi tên (bỏ qua nếu đang gõ chữ trong ô input hoặc trong lớp học)
    let inputZ = 0;
    let inputX = 0;

    if (!isFishing && !isSchoolMode && !isTypingInInput) {
      if (isForward) inputZ -= 1;
      if (isBackward) inputZ += 1;
      if (isLeft) inputX -= 1;
      if (isRight) inputX += 1;
    }

    _vInput.set(inputX, 0, inputZ);
    const isMoving = _vInput.lengthSq() > 0;
    let vehicleSpeed = MOVE_SPEED;
    if (effectiveVehicle === 'sportscar') vehicleSpeed = 27.0;
    else if (effectiveVehicle === 'rollsroyce') vehicleSpeed = 24.0;
    else if (effectiveVehicle === 'gclass') vehicleSpeed = 23.0;
    else if (effectiveVehicle === 'cybertruck') vehicleSpeed = 23.5;
    else if (effectiveVehicle === 'motorbike') vehicleSpeed = 23.0;
    else if (effectiveVehicle === 'harley') vehicleSpeed = 19.5;
    else if (effectiveVehicle === 'vespa') vehicleSpeed = 17.5;
    else if (effectiveVehicle === 'hoverboard') vehicleSpeed = 16.5;
    else if (effectiveVehicle === 'skateboard' || isSkateboarding || isSprintKey)
      vehicleSpeed = SKATEBOARD_SPEED;
    const activeSpeed = vehicleSpeed;

    const leftLeg = avatarRef.current?.leftLeg || leftLegRef.current;
    const rightLeg = avatarRef.current?.rightLeg || rightLegRef.current;
    const leftArm = avatarRef.current?.leftArm || leftArmRef.current;
    const rightArm = avatarRef.current?.rightArm || rightArmRef.current;

    // Hướng di chuyển tương đối bám sát góc quay 360 độ của Camera
    const curAngle = isSchoolMode ? 0 : (cameraOrbitAngle ?? Math.PI / 4);
    const forwardX = -Math.sin(curAngle);
    const forwardZ = -Math.cos(curAngle);
    const rightX = Math.cos(curAngle);
    const rightZ = -Math.sin(curAngle);

    if (isSchoolMode) {
      // =========================================================================
      // TRONG LỚP HỌC: NGỒI YÊN NGAY NGẮN TẠI BÀN HỌC, KHÔNG CHO DI CHUYỂN
      // =========================================================================
      rigidBodyRef.current.setTranslation({ x: 0.0, y: 0.42, z: 2.05 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      currentRotationY.current = Math.PI;

      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = Math.PI;
        meshGroupRef.current.position.y = 0;
        meshGroupRef.current.rotation.z = 0;
      }

      // Tư thế ngồi học sinh chuẩn: 2 chân gập 90 độ đặt xuống ghế
      if (leftLeg) {
        leftLeg.rotation.x = -1.48;
        leftLeg.rotation.y = 0.05;
        leftLeg.rotation.z = 0;
      }
      if (rightLeg) {
        rightLeg.rotation.x = -1.48;
        rightLeg.rotation.y = -0.05;
        rightLeg.rotation.z = 0;
      }

      // 2 tay đặt ngay ngắn lên mặt bàn học sinh chăm chú lắng nghe cô Lan
      if (leftArm) {
        leftArm.rotation.x = -1.18;
        leftArm.rotation.y = 0.25;
        leftArm.rotation.z = 0.12;
      }
      if (rightArm) {
        rightArm.rotation.x = -1.18;
        rightArm.rotation.y = -0.25;
        rightArm.rotation.z = -0.12;
      }
    } else if (isCar || isMotorcycle) {
      // =========================================================================
      // VẬT LÝ XE HƠI & MÔ TÔ CHÂN THỰC: GIA TỐC MƯỢT, PHANH TRÔI, BẺ LÁI, XE NGHIÊNG
      // =========================================================================
      if (isMoving) {
        _vInput.normalize();
        const targetMoveX = forwardX * (-inputZ) + rightX * inputX;
        const targetMoveZ = forwardZ * (-inputZ) + rightZ * inputX;
        _vMove.set(targetMoveX, 0, targetMoveZ).normalize();

        // Tăng tốc dần đều theo gia tốc động cơ xe
        const accelRate = isCar ? 26.0 : 22.0;
        vehicleCurrentSpeedRef.current = Math.min(
          activeSpeed,
          vehicleCurrentSpeedRef.current + delta * accelRate
        );
        vehicleMoveDirRef.current.lerp(_vMove, Math.min(1.0, delta * (isCar ? 8.0 : 10.0)));
      } else {
        // Nhả phím ga: Xe trôi êm (coasting / inertia) giảm dần chứ không khựng đơ tức thì
        const friction = isCar ? 4.2 : 4.8;
        vehicleCurrentSpeedRef.current *= Math.exp(-delta * friction);
        if (vehicleCurrentSpeedRef.current < 0.2) {
          vehicleCurrentSpeedRef.current = 0;
        }
      }

      const curSpd = vehicleCurrentSpeedRef.current;
      vehicleWheelSpinRef.current += curSpd * delta * 5.5;

      if (curSpd > 0.1) {
        // Áp dụng vận tốc di chuyển mượt mà
        rigidBodyRef.current.setLinvel(
          {
            x: vehicleMoveDirRef.current.x * curSpd,
            y: currentVel.y,
            z: vehicleMoveDirRef.current.z * curSpd,
          },
          true
        );

        // Bán kính quay vòng mượt mà theo góc lái xe hơi / mô tô
        const targetAngle = Math.atan2(vehicleMoveDirRef.current.x, vehicleMoveDirRef.current.z);
        let angleDiff = targetAngle - currentRotationY.current;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const turnSpeed = isCar ? 9.0 : 12.0;
        currentRotationY.current += angleDiff * Math.min(1.0, delta * turnSpeed);

        // Thân xe nghiêng khi vào cua (Body Lean / Roll)
        const targetLean = THREE.MathUtils.clamp(
          angleDiff * (isMotorcycle ? 0.42 : 0.08),
          -0.35,
          0.35
        );
        vehicleLeanAngleRef.current +=
          (targetLean - vehicleLeanAngleRef.current) * Math.min(1.0, delta * 9.0);
      } else {
        rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        vehicleLeanAngleRef.current *= 0.85;
      }

      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = currentRotationY.current;
        meshGroupRef.current.rotation.z = -vehicleLeanAngleRef.current;
      }

      // TƯ THẾ AVATAR LÁI XE CHUYÊN NGHIỆP (KHÔNG CHẠY BỘ TRÊN NÓC XE)
      if (isCar) {
        // Ngồi vào ghế lái: đùi chân gập ngang, tay cầm vô lăng
        if (leftLeg) {
          leftLeg.rotation.x = -1.45;
          leftLeg.rotation.z = 0.08;
        }
        if (rightLeg) {
          rightLeg.rotation.x = -1.45;
          rightLeg.rotation.z = -0.08;
        }
        if (leftArm) {
          leftArm.rotation.x = -1.1;
          leftArm.rotation.y = 0.28;
          leftArm.rotation.z = 0.1;
        }
        if (rightArm) {
          rightArm.rotation.x = -1.1;
          rightArm.rotation.y = -0.28;
          rightArm.rotation.z = -0.1;
        }
      } else if (isMotorcycle) {
        // Ngồi trên yên xe máy: chân ôm sườn xe, tay nắm ghi-đông
        if (leftLeg) {
          leftLeg.rotation.x = -0.85;
          leftLeg.rotation.z = -0.22;
        }
        if (rightLeg) {
          rightLeg.rotation.x = -0.85;
          rightLeg.rotation.z = 0.22;
        }
        if (leftArm) {
          leftArm.rotation.x = -1.05;
          leftArm.rotation.y = 0.15;
        }
        if (rightArm) {
          rightArm.rotation.x = -1.05;
          rightArm.rotation.y = -0.15;
        }
      }
    } else {
      // =========================================================================
      // ĐI BỘ & VÁN TRƯỢT THÔNG THƯỜNG
      // =========================================================================
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.z = 0;
      }

      if (isMoving) {
        _vInput.normalize();
        const targetMoveX = forwardX * (-inputZ) + rightX * inputX;
        const targetMoveZ = forwardZ * (-inputZ) + rightZ * inputX;
        _vMove.set(targetMoveX, 0, targetMoveZ).normalize();

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

        const targetAngle = Math.atan2(_vMove.x, _vMove.z);
        let angleDiff = targetAngle - currentRotationY.current;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        currentRotationY.current += angleDiff * Math.min(1.0, delta * 16);

        if (meshGroupRef.current) {
          meshGroupRef.current.rotation.y = currentRotationY.current;
        }

        if (isBoard) {
          // Tư thế trượt ván thăng bằng
          if (leftLeg) leftLeg.rotation.x = -0.25;
          if (rightLeg) rightLeg.rotation.x = 0.25;
          if (leftArm) leftArm.rotation.z = 0.55;
          if (rightArm) rightArm.rotation.z = -0.55;
        } else {
          // Hoạt ảnh bước chân sải dài thời trang
          walkCycleRef.current += delta * 13;
          const legSwing = Math.sin(walkCycleRef.current) * 0.52;
          const armSwing = Math.cos(walkCycleRef.current) * 0.45;

          if (leftLeg) leftLeg.rotation.x = legSwing;
          if (rightLeg) rightLeg.rotation.x = -legSwing;
          if (leftArm) leftArm.rotation.x = -armSwing;
          if (rightArm) rightArm.rotation.x = armSwing;
        }
      } else {
        rigidBodyRef.current.setLinvel(
          {
            x: 0,
            y: currentVel.y,
            z: 0,
          },
          true
        );

        if (leftLeg) leftLeg.rotation.x *= 0.8;
        if (rightLeg) rightLeg.rotation.x *= 0.8;

        if (currentEmote === 'dance') {
          const danceCycle = state.clock.elapsedTime * 6;
          if (meshGroupRef.current) {
            meshGroupRef.current.position.y = Math.abs(Math.sin(danceCycle)) * 0.2;
            meshGroupRef.current.rotation.y =
              currentRotationY.current + Math.sin(danceCycle) * 0.4;
          }
          if (leftArm) leftArm.rotation.z = Math.sin(danceCycle) * 0.8;
          if (rightArm) rightArm.rotation.z = -Math.sin(danceCycle) * 0.8;
        } else if (currentEmote === 'wave') {
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
    }

    // 3. Smooth Camera Follow bám sát người chơi (Trong lớp học giữ góc nhìn thẳng 0 độ chính diện như game Livestream)
    const camAngle = isSchoolMode ? 0 : (cameraOrbitAngle ?? Math.PI / 4);
    const orbitRadius = isSchoolMode ? 20.0 : isInteriorMode ? 22.0 : 25.5;
    const camHeight = isSchoolMode ? 13.5 : isInteriorMode ? 16.0 : 18.0;
    const camAnchorY = isInteriorMode ? 0.2 : Math.max(0, playerPos.y);
    const anchorX = isSchoolMode ? playerPos.x * 0.2 : playerPos.x;
    const anchorZ = isSchoolMode ? -0.5 : playerPos.z;
    const lookY = isSchoolMode ? 2.4 : camAnchorY + 1.15;

    _targetCamPos.set(
      anchorX + orbitRadius * Math.sin(camAngle),
      camAnchorY + camHeight,
      anchorZ + orbitRadius * Math.cos(camAngle)
    );

    if (
      elapsedSinceMount < 500 ||
      state.camera.position.distanceToSquared(_targetCamPos) > 80
    ) {
      state.camera.position.copy(_targetCamPos);
    } else {
      state.camera.position.lerp(_targetCamPos, Math.min(1.0, delta * 8.5));
    }
    state.camera.lookAt(anchorX, lookY, anchorZ);

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
        <group
          position={
            isCar
              ? [-0.22, 0.22, 0.12]
              : isMotorcycle
                ? [0, 0.38, -0.05]
                : isBoard
                  ? [0, 0.1, 0]
                  : [0, 0, 0]
          }
          rotation={isBoard ? [0, Math.PI / 4, 0] : [0, 0, 0]}
        >
          <FashionAvatar
            ref={avatarRef}
            outfitColor={playerColor}
            hatColor={hatColor}
            pantsColor={pantsColor}
            shoeColor={shoeColor}
            hairColor={hairColor}
            avatarStyle={avatarStyle}
            hatStyle={hatStyle}
            accessory={accessory}
            scale={isCar ? 1.15 : isMotorcycle ? 1.25 : 1.35}
          />
        </group>

        {/* VÁN TRƯỢT SKATEBOARD TỐC ĐỘ CAO PLAY TOGETHER */}
        {effectiveVehicle === 'skateboard' && (
          <group position={[0, 0.06, 0]}>
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.48, 0.05, 1.15]} />
              <meshStandardMaterial color={vehicleColor || '#f59e0b'} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.068, 0]}>
              <boxGeometry args={[0.16, 0.01, 1.1]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
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

        {/* VÁN BAY ĐỆM TỪ HOVERBOARD NEON 🛸 */}
        {effectiveVehicle === 'hoverboard' && (
          <group position={[0, 0.14, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.56, 0.07, 1.28]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Viền đèn LED Neon phát sáng xung quanh Hoverboard */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.6, 0.025, 1.32]} />
              <meshStandardMaterial
                color={vehicleColor || '#06b6d4'}
                emissive={vehicleColor || '#06b6d4'}
                emissiveIntensity={1.6}
              />
            </mesh>
            {/* 2 Lõi phản trọng lực phát sáng dưới đáy */}
            {[-0.38, 0.38].map((hz, idx) => (
              <mesh key={idx} position={[0, -0.05, hz]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.1, 0.2, 16]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={2.0}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* XE TAY GA VESPA Ý CỔ ĐIỂN */}
        {effectiveVehicle === 'vespa' && (
          <group position={[0, 0.12, 0]}>
            <mesh position={[0, 0.22, -0.1]} castShadow>
              <boxGeometry args={[0.52, 0.36, 1.25]} />
              <meshStandardMaterial
                color={vehicleColor || '#fde047'}
                roughness={0.22}
                metalness={0.35}
              />
            </mesh>
            {/* Yên da nâu cổ điển */}
            <mesh position={[0, 0.42, -0.15]}>
              <boxGeometry args={[0.42, 0.09, 0.65]} />
              <meshStandardMaterial color="#78350f" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.55, 0.42]} castShadow>
              <boxGeometry args={[0.46, 0.55, 0.14]} />
              <meshStandardMaterial
                color={vehicleColor || '#fde047'}
                roughness={0.22}
                metalness={0.35}
              />
            </mesh>
            <mesh position={[0, 0.84, 0.42]}>
              <boxGeometry args={[0.68, 0.06, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
            </mesh>
            {/* Đèn pha tròn mạ Chrome */}
            <mesh position={[0, 0.84, 0.49]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.2} />
            </mesh>
            {[-0.45, 0.45].map((wz, i) => (
              <mesh key={i} position={[0, 0.06, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        )}

        {/* MÔ TÔ CRUISER CƠ BẮP HARLEY-DAVIDSON FAT BOY V-TWIN */}
        {effectiveVehicle === 'harley' && (
          <group position={[0, 0.14, 0]}>
            {/* Khung sườn & Bình xăng giọt nước cơ bắp */}
            <mesh position={[0, 0.45, 0.1]} castShadow>
              <boxGeometry args={[0.45, 0.32, 0.85]} />
              <meshStandardMaterial color={vehicleColor || '#0f172a'} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Khối động cơ V-Twin Chrome mạ sáng bóng */}
            <mesh position={[0, 0.22, 0.05]} castShadow>
              <boxGeometry args={[0.42, 0.35, 0.55]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Ghi-đông vểnh cao phong trần (Ape Hanger Bars) */}
            <mesh position={[0, 0.88, 0.48]}>
              <boxGeometry args={[0.78, 0.06, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {/* Pô đôi mạ Chrome kéo dài về sau */}
            {[0.24, 0.26].map((px, idx) => (
              <mesh key={idx} position={[px, 0.14 + idx * 0.08, -0.45]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.05, 1.1, 10]} />
                <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.08} />
              </mesh>
            ))}
            {/* Đèn pha tròn lớn phía trước */}
            <mesh position={[0, 0.65, 0.62]}>
              <sphereGeometry args={[0.11, 14, 14]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.5} />
            </mesh>
            {/* Bánh béo Fat Boy to bản */}
            {[-0.62, 0.65].map((wz, i) => (
              <mesh key={i} position={[0, 0.1, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 0.24, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.8} />
              </mesh>
            ))}
          </group>
        )}

        {/* SIÊU MÔ TÔ DUCATI PANIGALE / BMW S1000RR */}
        {effectiveVehicle === 'motorbike' && (
          <group position={[0, 0.14, 0]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[0.56, 0.42, 1.55]} />
              <meshStandardMaterial
                color={vehicleColor || '#dc2626'}
                roughness={0.18}
                metalness={0.55}
              />
            </mesh>
            {/* Yếm thể thao & Kính núp gió khí động học */}
            <mesh position={[0, 0.62, 0.48]} rotation={[-Math.PI / 8, 0, 0]}>
              <boxGeometry args={[0.5, 0.38, 0.25]} />
              <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.2} />
            </mesh>
            {/* Cánh gió đôi Carbon Winglets hai bên yếm */}
            {[-0.34, 0.34].map((wx, idx) => (
              <mesh key={idx} position={[wx, 0.46, 0.52]} rotation={[0, idx * -0.2, 0]}>
                <boxGeometry args={[0.16, 0.03, 0.22]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
            ))}
            {/* Phuộc nhún vàng Ohlins Upside Down */}
            {[-0.14, 0.14].map((fx, idx) => (
              <mesh key={idx} position={[fx, 0.32, 0.68]} rotation={[-0.25, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
                <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
            {/* Đèn pha đôi LED mắt chim ưng */}
            {[-0.14, 0.14].map((lx, idx) => (
              <mesh key={idx} position={[lx, 0.45, 0.78]}>
                <boxGeometry args={[0.12, 0.06, 0.04]} />
                <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.8} />
              </mesh>
            ))}
            {/* Ống xả bô đua thể thao */}
            <mesh position={[0.26, 0.18, -0.42]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.55, 10]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            {[-0.58, 0.58].map((wz, i) => (
              <mesh key={i} position={[0, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.24, 0.24, 0.18, 14]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        )}

        {/* SIÊU XE ĐUA LAMBORGHINI / FERRARI / PORSCHE GT3 RS */}
        {effectiveVehicle === 'sportscar' && (
          <group position={[0, 0.16, 0]}>
            {/* Vệt đèn pha LED rọi sáng mặt đường ban đêm */}
            <mesh position={[0, -0.12, 2.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.5, 4.0]} />
              <meshBasicMaterial color="#fef08a" transparent opacity={0.22} />
            </mesh>

            {/* Đèn hậu LED đỏ thể thao phát sáng */}
            {[-0.56, 0.56].map((tx, idx) => (
              <mesh key={`tail-${idx}`} position={[tx, 0.28, -1.38]}>
                <boxGeometry args={[0.26, 0.08, 0.04]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={2.5} />
              </mesh>
            ))}

            {/* Thân xe khí động học gầm thấp sắc sảo */}
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[1.56, 0.42, 2.75]} />
              <meshStandardMaterial
                color={vehicleColor || '#ef4444'}
                roughness={0.12}
                metalness={0.78}
              />
            </mesh>
            {/* Hốc gió cản trước carbon */}
            <mesh position={[0, 0.14, 1.34]}>
              <boxGeometry args={[1.42, 0.16, 0.12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Cánh gió đua thể thao GT Rear Spoiler khổng lồ phía sau */}
            <mesh position={[0, 0.62, -1.25]} castShadow>
              <boxGeometry args={[1.62, 0.06, 0.34]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
            </mesh>
            {[-0.45, 0.45].map((sx, idx) => (
              <mesh key={idx} position={[sx, 0.44, -1.22]}>
                <boxGeometry args={[0.06, 0.32, 0.12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            ))}
            {/* Kính chắn gió vòm cong siêu xe */}
            <mesh position={[0, 0.52, 0.42]} rotation={[-Math.PI / 5, 0, 0]}>
              <boxGeometry args={[1.38, 0.38, 0.08]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.75} roughness={0.1} />
            </mesh>
            {/* Đèn pha LED mắt xếch chữ Y phong cách Lamborghini / Ferrari */}
            {[-0.54, 0.54].map((lx, idx) => (
              <mesh key={idx} position={[lx, 0.28, 1.36]}>
                <boxGeometry args={[0.3, 0.08, 0.05]} />
                <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.8} />
              </mesh>
            ))}
            {/* 4 Ống xả thể thao phía sau */}
            {[-0.32, -0.12, 0.12, 0.32].map((ox, idx) => (
              <mesh key={idx} position={[ox, 0.16, -1.38]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
              </mesh>
            ))}
            {[
              [-0.78, 0.06, -0.85],
              [0.78, 0.06, -0.85],
              [-0.78, 0.06, 0.85],
              [0.78, 0.06, 0.85],
            ].map(([wx, wy, wz], idx) => (
              <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 0.22, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
              </mesh>
            ))}
          </group>
        )}

        {/* SIÊU BÁN TẢI BỌC THÉP TESLA CYBERTRUCK 🚙 */}
        {effectiveVehicle === 'cybertruck' && (
          <group position={[0, 0.18, 0]}>
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[1.68, 0.52, 2.92]} />
              <meshStandardMaterial
                color={vehicleColor || '#94a3b8'}
                roughness={0.18}
                metalness={0.88}
              />
            </mesh>
            {/* Mui vát tam giác đặc trưng Cyber */}
            <mesh position={[0, 0.68, 0.1]} rotation={[0.12, 0, 0]} castShadow>
              <boxGeometry args={[1.56, 0.32, 1.78]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Dải đèn LED ngang toàn chiều rộng mặt trước */}
            <mesh position={[0, 0.45, 1.46]}>
              <boxGeometry args={[1.62, 0.06, 0.04]} />
              <meshStandardMaterial color="#38bdf8" emissive="#06b6d4" emissiveIntensity={2.0} />
            </mesh>
            {/* Dải đèn hậu LED đỏ ngang phía sau */}
            <mesh position={[0, 0.45, -1.46]}>
              <boxGeometry args={[1.62, 0.06, 0.04]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.8} />
            </mesh>
            {[
              [-0.86, 0.08, -0.94],
              [0.86, 0.08, -0.94],
              [-0.86, 0.08, 0.94],
              [0.86, 0.08, 0.94],
            ].map(([wx, wy, wz], idx) => (
              <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.31, 0.31, 0.25, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
            ))}
          </group>
        )}

        {/* SIÊU SUV MERCEDES-AMG G63 BRABUS 800 HỘP VUÔNG */}
        {effectiveVehicle === 'gclass' && (
          <group position={[0, 0.2, 0]}>
            {/* Thân xe hộp vuông huyền thoại */}
            <mesh position={[0, 0.38, 0]} castShadow>
              <boxGeometry args={[1.65, 0.62, 2.75]} />
              <meshStandardMaterial
                color={vehicleColor || '#1e293b'}
                roughness={0.22}
                metalness={0.7}
              />
            </mesh>
            {/* Nóc xe vuông cao ráo */}
            <mesh position={[0, 0.78, -0.15]} castShadow>
              <boxGeometry args={[1.58, 0.48, 1.75]} />
              <meshStandardMaterial
                color={vehicleColor || '#1e293b'}
                roughness={0.22}
                metalness={0.7}
              />
            </mesh>
            {/* Lưới tản nhiệt Panamericana AMG sọc dọc mạ chrome */}
            <mesh position={[0, 0.42, 1.39]}>
              <boxGeometry args={[1.1, 0.32, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Đèn pha LED tròn Daylight 2 bên */}
            {[-0.62, 0.62].map((gx, idx) => (
              <mesh key={idx} position={[gx, 0.42, 1.4]}>
                <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.5} />
              </mesh>
            ))}
            {/* Bánh sơ cua dự phòng ốp sau cửa hậu */}
            <mesh position={[0, 0.45, -1.48]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.16, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} />
            </mesh>
            {/* Bánh xe địa hình cỡ lớn */}
            {[
              [-0.88, 0.1, -0.9],
              [0.88, 0.1, -0.9],
              [-0.88, 0.1, 0.9],
              [0.88, 0.1, 0.9],
            ].map(([wx, wy, wz], idx) => (
              <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.32, 0.32, 0.26, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.8} />
              </mesh>
            ))}
          </group>
        )}

        {/* XE SIÊU SANG ROLLS-ROYCE PHANTOM VIII LIMOUSINE */}
        {effectiveVehicle === 'rollsroyce' && (
          <group position={[0, 0.18, 0]}>
            {/* Thân xe siêu sang bề thế, dài 2.95m */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.72, 0.48, 2.95]} />
              <meshStandardMaterial
                color={vehicleColor || '#020617'}
                roughness={0.1}
                metalness={0.85}
              />
            </mesh>
            {/* Nắp capo dài & Mui xe 2 tông màu quý tộc */}
            <mesh position={[0, 0.65, -0.15]} castShadow>
              <boxGeometry args={[1.64, 0.38, 1.85]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
            </mesh>
            {/* Lưới tản nhiệt thác nước Pantheon mạ chrome cao ngạo */}
            <mesh position={[0, 0.38, 1.49]}>
              <boxGeometry args={[0.88, 0.42, 0.08]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.05} />
            </mesh>
            {/* Biểu tượng Nữ Thần Spirit of Ecstasy mạ vàng lấp lánh */}
            <mesh position={[0, 0.62, 1.48]}>
              <coneGeometry args={[0.04, 0.12, 10]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} emissive="#f59e0b" emissiveIntensity={0.8} />
            </mesh>
            {/* Đèn pha Laser LED chữ nhật uy quyền */}
            {[-0.64, 0.64].map((lx, idx) => (
              <mesh key={idx} position={[lx, 0.38, 1.48]}>
                <boxGeometry args={[0.26, 0.12, 0.04]} />
                <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.6} />
              </mesh>
            ))}
            {/* Mâm xe hợp kim đúc đa chấu mạ chrome */}
            {[
              [-0.88, 0.08, -0.95],
              [0.88, 0.08, -0.95],
              [-0.88, 0.08, 0.95],
              [0.88, 0.08, 0.95],
            ].map(([wx, wy, wz], idx) => (
              <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.28, 0.28, 0.22, 18]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
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
