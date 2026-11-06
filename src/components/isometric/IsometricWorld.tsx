'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Paper,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import PhishingRoundedIcon from '@mui/icons-material/PhishingRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import SkateboardingRoundedIcon from '@mui/icons-material/SkateboardingRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import confetti from 'canvas-confetti';

import StreetLamp from './StreetLamp';
import PlayerPhysics from './PlayerPhysics';
import NPC from './NPC';
import RemotePlayer from './RemotePlayer';
import ChatHUD from './ChatHUD';
import CityTraffic from './CityTraffic';
import WalkingNPCs from './WalkingNPC';
import { HtmlOverlayHost } from './SafeHtml';
import InteriorSpaceScene, { type ActiveInteriorSpace } from './InteriorSpaceScene';
import {
  PlayerStarterHouseCap4,
  CentralFountain,
  FishingLakeAndPier,
  PlaySchoolBuilding,
  CityLibraryBuilding,
  PlazaCafe,
  PizzaBurgerDiner,
  FashionBoutiqueBuilding,
  AutoShowroomBuilding,
  SuperMartBuilding,
  CinemaTheaterBuilding,
  SkyscraperTower,
  CozySuburbHouse,
  PlaygroundPark,
  CampingZone,
  TrafficLight,
  ParkBench,
  CartoonTree,
  FlowerBush,
  PlayTogetherGround,
  type HouseFurnitureRenderItem,
} from './PlayTogetherPlaza';
import {
  FishingQuizModal,
  HouseFurnitureModal,
  ShopAndWorkModal,
  StreetNpcDialogueModal,
} from './WorldInteractiveModals';
import {
  CITY_SHOPS_DATA,
  STREET_NPCS_DIALOGUE_DATA,
  type ShopVenueId,
  type FurnitureCatalogItem,
  type ShopProductItem,
  type WorkCustomerScenario,
  type StreetNpcScenario,
} from '@/data/worldGameplayData';
import useDayNightCycle from '@/stores/useDayNightCycle';
import useMultiplayerStore, {
  RemotePlayerData,
  getNearbyStreetNpcId,
} from '@/stores/useMultiplayerStore';
import { useAuth } from '@/context/AuthContext';
import { HOUSE_PLOTS, getPlotByCode, HousePlotConfig } from '@/data/housePlots';

/**
 * Bản đồ phím điều khiển bàn phím (WASD, Space nhảy, Shift ván trượt, E tương tác, F câu cá)
 */
export const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'fish', keys: ['KeyF'] },
];

/**
 * Danh sách các Khu phố cố định trên thanh GPS
 */
const STATIC_CITY_DISTRICTS = [
  { label: '⛲ Quảng Trường Chung', x: 0, z: 5, color: '#38bdf8' },
  { label: '☕ Phố Ẩm Thực', x: 26, z: 25, color: '#f43f5e' },
  { label: '🏫 Học Viện & Thư Viện', x: -26, z: 25, color: '#facc15' },
  { label: '🎬 Siêu Thị & Rạp Phim', x: 26, z: -25, color: '#a855f7' },
  { label: '🎣 Hồ Câu & Trại', x: -30, z: -18, color: '#0284c7' },
  { label: '🏙️ Khu Cao Ốc', x: 0, z: -56, color: '#60a5fa' },
  { label: '🏘️ Đại Lộ Dân Cư Bắc', x: 0, z: 56, color: '#34d399' },
];

/**
 * Bảng màu sơn tường & mái ngói chân thực cho Ngôi Nhà Cấp 4
 */
const WALL_COLOR_PRESETS = [
  { label: 'Vàng Kem Truyền Thống', color: '#f5ebd6' },
  { label: 'Trắng Sứ Hiện Đại', color: '#f8fafc' },
  { label: 'Xanh Ngọc Bắc Âu', color: '#e0f2fe' },
  { label: 'Hồng Phấn Ấm Áp', color: '#fce7f3' },
  { label: 'Xanh Trà Xanh', color: '#dcfce7' },
];

const ROOF_COLOR_PRESETS = [
  { label: 'Ngói Đỏ Đất Nung', color: '#b93829' },
  { label: 'Ngói Xanh Rêu Cổ', color: '#0f766e' },
  { label: 'Ngói Xanh Lam Nhật', color: '#1e3a8a' },
  { label: 'Ngói Nâu Gốm Cổ', color: '#78350f' },
  { label: 'Ngói Đá Đen Tuyền', color: '#334155' },
];

/**
 * Cụm chiếu sáng tự nhiên chân thực toàn thành phố 160x160
 */
function DynamicSunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    const cycle = useDayNightCycle.getState();
    cycle.advanceTime(delta);

    if (lightRef.current) {
      lightRef.current.position.set(cycle.sunPosition[0], cycle.sunPosition[1], cycle.sunPosition[2]);
      lightRef.current.color.copy(cycle.sunColor);
      lightRef.current.intensity = cycle.sunIntensity;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = cycle.ambientIntensity;
    }
  });

  return (
    <>
      <hemisphereLight color="#e0f2fe" groundColor="#4d8b55" intensity={0.5} />
      <ambientLight ref={ambientRef} color="#fffbeb" intensity={0.78} />
      <directionalLight
        ref={lightRef}
        position={[38, 58, 32]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={-120}
        shadow-camera-far={300}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-bias={-0.0005}
      />
    </>
  );
}

/**
 * Danh sách phần thưởng ngẫu nhiên khi câu cá
 */
const FISH_POOL = [
  { name: 'Cá Mập Con Baby Shark', icon: '🦈', exp: 120, coins: 60, rarity: 'Huyền Thoại (Legendary)', color: '#ec4899' },
  { name: 'Cá Vàng Hoàng Kim', icon: '🐠', exp: 80, coins: 40, rarity: 'Hiếm (Rare)', color: '#f59e0b' },
  { name: 'Cá Hề Nemo', icon: '🐟', exp: 40, coins: 20, rarity: 'Phổ biến (Common)', color: '#06b6d4' },
  { name: 'Rùa Biển Tinh Nghịch', icon: '🐢', exp: 90, coins: 45, rarity: 'Quý (Epic)', color: '#10b981' },
  { name: 'Cá Nóc Gai Xinh Xắn', icon: '🐡', exp: 60, coins: 30, rarity: 'Đặc biệt (Special)', color: '#8b5cf6' },
];

function playCelebrationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
    });
  } catch {}
}

/**
 * Quần thể Đại Đô Thị 3D Chân Thực (160m x 160m) + Hệ thống Nhà Cấp 4 Phân Lô Ngẫu Nhiên Đa Người Chơi
 */
function PlayTogetherCityScene({
  onInteractNPC,
  isFishing,
  isSkateboarding,
  activeVehicle,
  outfitColor,
  hatColor,
  currentEmote,
  teleportTarget,
  onNearFishingPier,
  onNearPlayerHouse,
  onEnterPlotInterior,
  onNearShopVenue,
  onOpenShopModal,
  onStepHouseDoor,
  onStepShopDoor,
  myPlot,
  ownerName,
  houseTitle,
  houseWallColor,
  houseRoofColor,
  houseFurnitureList,
  insidePlotCode,
  forceCutawayRoof,
  onClickManageHouse,
}: {
  onInteractNPC?: (npcId: string) => void;
  isFishing: boolean;
  isSkateboarding: boolean;
  activeVehicle: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
  outfitColor: string;
  hatColor: string;
  currentEmote: string | null;
  teleportTarget: { x: number; z: number; id: number } | null;
  onNearFishingPier: (near: boolean) => void;
  onNearPlayerHouse: (near: boolean, inside: boolean) => void;
  onEnterPlotInterior: (plotCode: string | null) => void;
  onNearShopVenue: (shopId: ShopVenueId | null) => void;
  onOpenShopModal: (shopId: ShopVenueId) => void;
  onStepHouseDoor: (plotCode: string) => void;
  onStepShopDoor: (shopId: ShopVenueId) => void;
  myPlot: HousePlotConfig;
  ownerName: string;
  houseTitle: string;
  houseWallColor: string;
  houseRoofColor: string;
  houseFurnitureList: HouseFurnitureRenderItem[];
  insidePlotCode: string | null;
  forceCutawayRoof: boolean;
  onClickManageHouse: () => void;
}) {
  const remotePlayers = useMultiplayerStore((state) => state.remotePlayers);
  const skyBgColor = useDayNightCycle((state) => state.skyBgColor);

  const remotePlayerList = useMemo(() => Array.from(remotePlayers.values()), [remotePlayers]);

  // Danh sách các lô đất đang có người chơi khác (Online) sở hữu
  const remoteHouseByPlot = useMemo(() => {
    const map = new Map<string, RemotePlayerData>();
    for (const rp of remotePlayerList) {
      if (rp.maLoDat && rp.maLoDat !== myPlot.maLoDat && !map.has(rp.maLoDat)) {
        map.set(rp.maLoDat, rp);
      }
    }
    return map;
  }, [remotePlayerList, myPlot.maLoDat]);

  return (
    <>
      <DynamicSunLight />
      <color attach="background" args={[skyBgColor || '#60a5fa']} />

      {/* 1. MẶT ĐẤT THẢM CỎ TỰ NHIÊN & HỆ THỐNG ĐẠI LỘ NHỰA ASPHALT (160x160) */}
      <PlayTogetherGround />

      {/* 2. HỆ THỐNG XE CỘ LƯU THÔNG TỰ ĐỘNG TRÊN ĐẠI LỘ */}
      <CityTraffic />

      {/* 3. HỆ THỐNG CƯ DÂN NPC ĐI DẠO & TRÒ CHUYỆN TIẾNG ANH KHẮP THÀNH PHỐ */}
      <WalkingNPCs onInteractNPC={onInteractNPC} />

      {/* ================================================================= */}
      {/* 4. HỆ THỐNG PHÂN LÔ NHÀ CẤP 4 NGẪU NHIÊN CỦA BẠN & NGƯỜI CHƠI KHÁC */}
      {/* ================================================================= */}
      {HOUSE_PLOTS.map((plot) => {
        const isMine = plot.maLoDat === myPlot.maLoDat;
        const neighbor = remoteHouseByPlot.get(plot.maLoDat);

        if (isMine) {
          return (
            <PlayerStarterHouseCap4
              key={plot.maLoDat}
              position={plot.position}
              ownerName={ownerName}
              houseTitle={houseTitle}
              wallColor={houseWallColor}
              roofColor={houseRoofColor}
              showInteriorCutaway={insidePlotCode === plot.maLoDat || forceCutawayRoof}
              isMyHouse={true}
              plotLabel={plot.tenLoDat}
              furnitureList={houseFurnitureList}
              onClickManageHouse={onClickManageHouse}
            />
          );
        }

        if (neighbor) {
          return (
            <PlayerStarterHouseCap4
              key={plot.maLoDat}
              position={plot.position}
              ownerName={neighbor.username}
              houseTitle={neighbor.houseTitle || `Nhà Cấp 4 của ${neighbor.username}`}
              wallColor={neighbor.houseWallColor || plot.defaultWallColor}
              roofColor={neighbor.houseRoofColor || plot.defaultRoofColor}
              showInteriorCutaway={insidePlotCode === plot.maLoDat}
              isMyHouse={false}
              plotLabel={plot.tenLoDat}
              furnitureList={neighbor.houseFurniture}
            />
          );
        }

        // Các lô đất trên Đại Lộ Bắc chưa có người chơi online thì hiển thị nhà ngoại ô mẫu
        if (plot.position[2] >= 60) {
          return (
            <CozySuburbHouse
              key={plot.maLoDat}
              position={plot.position}
              wallColor={plot.defaultWallColor}
              roofColor={plot.defaultRoofColor}
              ownerLabel={`🏘️ ${plot.tenLoDat.split('•')[0].trim()} (Đất Trống)`}
            />
          );
        }

        return null;
      })}

      {/* ================================================================= */}
      {/* KHU VỰC 1: QUẢNG TRƯỜNG TRUNG TÂM (CENTRAL PLAZA)                 */}
      {/* ================================================================= */}
      <CentralFountain position={[0, 0, 0]} />
      <ParkBench position={[-7.5, 0, 0]} rotationY={Math.PI / 2} />
      <ParkBench position={[7.5, 0, 0]} rotationY={-Math.PI / 2} />
      <ParkBench position={[0, 0, -7.5]} rotationY={0} />
      <ParkBench position={[0, 0, 7.5]} rotationY={Math.PI} />

      {/* ================================================================= */}
      {/* KHU VỰC 2: KHU GIÁO DỤC & VĂN HÓA (TÂY BẮC: X < 0, Z > 0)        */}
      {/* ================================================================= */}
      <PlaySchoolBuilding position={[-35, 0, 36]} />
      <CityLibraryBuilding position={[-35, 0, 13]} />

      {/* ================================================================= */}
      {/* KHU VỰC 3: KHU ẨM THỰC & CAFE (ĐÔNG BẮC: X > 0, Z > 0)           */}
      {/* ================================================================= */}
      <PlazaCafe position={[34, 0, 35]} onOpenShop={() => onOpenShopModal('CAFE')} />
      <PizzaBurgerDiner position={[35, 0, 13]} onOpenShop={() => onOpenShopModal('DINER')} />

      {/* ================================================================= */}
      {/* KHU VỰC 4: KHU MUA SẮM, QUẦN ÁO, SHOWROOM XE & GIẢI TRÍ           */}
      {/* ================================================================= */}
      <FashionBoutiqueBuilding
        position={[12, 0, -34]}
        onOpenShop={() => onOpenShopModal('CLOTHING')}
      />
      <AutoShowroomBuilding
        position={[-12, 0, -34]}
        onOpenShop={() => onOpenShopModal('CAR_SHOWROOM')}
      />
      <SuperMartBuilding position={[35, 0, -35]} />
      <CinemaTheaterBuilding position={[35, 0, -13]} />

      {/* ================================================================= */}
      {/* KHU VỰC 5: HỒ CÂU CÁ, CÔNG VIÊN & CẮM TRẠI (TÂY NAM: X < 0, Z < 0)*/}
      {/* ================================================================= */}
      <FishingLakeAndPier position={[-36, 0, -28]} onNearFishingPier={onNearFishingPier} />
      <PlaygroundPark position={[-33, 0, -8]} />
      <CampingZone position={[-42, 0, -43]} />

      {/* ================================================================= */}
      {/* KHU VỰC 6: ĐẠI LỘ CAO ỐC TÀI CHÍNH DOWNTOWN (PHÍA NAM: Z = -65)    */}
      {/* ================================================================= */}
      <SkyscraperTower
        position={[-32, 0, -65]}
        height={18}
        wallColor="#1e3a5f"
        roofColor="#334155"
        title="🏦 LONDON WORLD BANK"
      />
      <SkyscraperTower
        position={[-11, 0, -65]}
        height={22}
        wallColor="#1e293b"
        roofColor="#334155"
        title="🏢 EMPIRE ENGLISH TOWER"
      />
      <SkyscraperTower
        position={[11, 0, -65]}
        height={20}
        wallColor="#312e81"
        roofColor="#1e1b4b"
        title="🏨 GRAND PLAZA HOTEL"
      />
      <SkyscraperTower
        position={[32, 0, -65]}
        height={16}
        wallColor="#0f4c5c"
        roofColor="#1e293b"
        title="💻 SILICON TECH HUB"
      />

      {/* ================================================================= */}
      {/* ĐÈN GIAO THÔNG & ĐÈN ĐƯỜNG ĐÔ THỊ                                */}
      {/* ================================================================= */}
      <TrafficLight position={[-17, 0, -17]} rotationY={0} />
      <TrafficLight position={[17, 0, -17]} rotationY={Math.PI / 2} />
      <TrafficLight position={[17, 0, 17]} rotationY={Math.PI} />
      <TrafficLight position={[-17, 0, 17]} rotationY={-Math.PI / 2} />

      <StreetLamp position={[-10, 0, -10]} rotationY={Math.PI / 4} />
      <StreetLamp position={[10, 0, -10]} rotationY={-Math.PI / 4} />
      <StreetLamp position={[-10, 0, 10]} rotationY={(3 * Math.PI) / 4} />
      <StreetLamp position={[10, 0, 10]} rotationY={(-3 * Math.PI) / 4} />
      <StreetLamp position={[-25, 0, -25]} rotationY={0} />
      <StreetLamp position={[25, 0, -25]} rotationY={0} />
      <StreetLamp position={[-25, 0, 25]} rotationY={0} />
      <StreetLamp position={[25, 0, 25]} rotationY={0} />
      <StreetLamp position={[-48, 0, -48]} rotationY={0} />
      <StreetLamp position={[48, 0, -48]} rotationY={0} />
      <StreetLamp position={[-48, 0, 48]} rotationY={0} />
      <StreetLamp position={[48, 0, 48]} rotationY={0} />

      {/* ================================================================= */}
      {/* CÂY XANH & BỤI HOA TRANG TRÍ KHẮP CÁC ĐẠI LỘ                     */}
      {/* ================================================================= */}
      <CartoonTree position={[-11, 0, -4]} scale={1.1} />
      <CartoonTree position={[11, 0, -4]} scale={1.1} />
      <CartoonTree position={[-11, 0, 4]} scale={1.1} />
      <CartoonTree position={[11, 0, 4]} scale={1.1} />
      <CartoonTree position={[-44, 0, 25]} scale={1.3} />
      <CartoonTree position={[-44, 0, 44]} scale={1.4} />
      <CartoonTree position={[44, 0, 25]} scale={1.3} />
      <CartoonTree position={[44, 0, 44]} scale={1.4} />
      <CartoonTree position={[44, 0, -25]} scale={1.3} />
      <CartoonTree position={[44, 0, -44]} scale={1.4} />
      <CartoonTree position={[-46, 0, -12]} scale={1.3} />
      <CartoonTree position={[-20, 0, 64]} scale={1.15} />
      <CartoonTree position={[0, 0, 64]} scale={1.25} />
      <CartoonTree position={[20, 0, 64]} scale={1.15} />
      <CartoonTree position={[-22, 0, -64]} scale={1.2} />
      <CartoonTree position={[0, 0, -64]} scale={1.3} />
      <CartoonTree position={[22, 0, -64]} scale={1.2} />

      <FlowerBush position={[-5.2, 0, -5.2]} color="#f43f5e" />
      <FlowerBush position={[5.2, 0, -5.2]} color="#ec4899" />
      <FlowerBush position={[-5.2, 0, 5.2]} color="#fbbf24" />
      <FlowerBush position={[5.2, 0, 5.2]} color="#8b5cf6" />
      <FlowerBush position={[28, 0, 28]} color="#f43f5e" />
      <FlowerBush position={[-28, 0, 28]} color="#38bdf8" />
      <FlowerBush position={[28, 0, -28]} color="#a855f7" />

      {/* ================================================================= */}
      {/* NHÂN VẬT NGƯỜI CHƠI CHÍNH & ĐỒNG BỘ MULTIPLAYER REALTIME           */}
      {/* ================================================================= */}
      <PlayerPhysics
        initialPosition={
          teleportTarget
            ? [teleportTarget.x, 1.2, teleportTarget.z]
            : myPlot.spawnPosition
        }
        housePosition={myPlot.position}
        isFishing={isFishing}
        isSkateboarding={isSkateboarding}
        activeVehicle={activeVehicle}
        outfitColor={outfitColor}
        hatColor={hatColor}
        currentEmote={currentEmote}
        teleportTarget={teleportTarget}
        onNearFishingPier={onNearFishingPier}
        onNearPlayerHouse={onNearPlayerHouse}
        onEnterPlotInterior={onEnterPlotInterior}
        onNearShopVenue={onNearShopVenue}
        onStepHouseDoor={onStepHouseDoor}
        onStepShopDoor={onStepShopDoor}
      />

      {remotePlayerList.map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}

      {/* ================================================================= */}
      {/* CÁC NPC NHIỆM VỤ CHÍNH TẠI TỪNG KHU VỰC                          */}
      {/* ================================================================= */}
      <NPC
        id="NPC_EMMA_LONDON_CAFE"
        name="Emma (Barista)"
        role="London Cafe • Tiếng Anh A2"
        position={[29, 0.2, 30]}
        rotationY={-Math.PI / 4}
        badgeColor="#f59e0b"
        onInteract={() => onInteractNPC?.('NPC_EMMA_LONDON_CAFE')}
      />

      <NPC
        id="NPC_LUIGI_DINER"
        name="Chef Luigi"
        role="Burger Diner • Tiếng Anh A2"
        position={[29, 0.2, 13]}
        rotationY={-Math.PI / 3}
        badgeColor="#ea580c"
        onInteract={() => onInteractNPC?.('NPC_EMMA_LONDON_CAFE')}
      />

      <NPC
        id="NPC_ALEX_ACADEMY"
        name="Alex (Teacher)"
        role="Royal Academy • Tiếng Anh B1"
        position={[-29, 0.2, 30]}
        rotationY={Math.PI / 4}
        badgeColor="#34d399"
        onInteract={() => onInteractNPC?.('NPC_ALEX_ACADEMY')}
      />

      <NPC
        id="NPC_SARAH_LIBRARY"
        name="Sarah (Librarian)"
        role="Oxford Library • Tiếng Anh B2"
        position={[-29, 0.2, 13]}
        rotationY={Math.PI / 3}
        badgeColor="#38bdf8"
        onInteract={() => onInteractNPC?.('NPC_ALEX_ACADEMY')}
      />

      <NPC
        id="NPC_FISHERMAN"
        name="Captain Jack"
        role="Bến Câu Cá • Hướng dẫn A1"
        position={[-30, 0.2, -19]}
        rotationY={Math.PI / 4}
        badgeColor="#0284c7"
        onInteract={() => onInteractNPC?.('NPC_EMMA_LONDON_CAFE')}
      />

      <NPC
        id="NPC_OFFICER_TOM"
        name="Officer Tom"
        role="Downtown Guide • Tiếng Anh B1"
        position={[0, 0.2, -56]}
        rotationY={0}
        badgeColor="#60a5fa"
        onInteract={() => onInteractNPC?.('NPC_ALEX_ACADEMY')}
      />
    </>
  );
}

interface IsometricWorldProps {
  onOpenDialogue?: (npcId: string) => void;
}

/**
 * Component chính IsometricWorld Metropolis + Phân lô Nhà Cấp 4 Ngẫu Nhiên Đa Người Chơi
 */
export default function IsometricWorld({ onOpenDialogue }: IsometricWorldProps) {
  const { user, token, refreshUser } = useAuth();
  const { gameTime, isNight } = useDayNightCycle();

  // Luôn đồng bộ Giờ Thế Giới cố định ngay cả khi đang ở trong không gian nội thất
  useEffect(() => {
    useDayNightCycle.getState().advanceTime(0);
    const timer = setInterval(() => {
      useDayNightCycle.getState().advanceTime(0.5);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const connect = useMultiplayerStore((state) => state.connect);
  const updateProfile = useMultiplayerStore((state) => state.updateProfile);
  const randomizeMyPlot = useMultiplayerStore((state) => state.randomizeMyPlot);
  const disconnect = useMultiplayerStore((state) => state.disconnect);
  const myPlotCode = useMultiplayerStore((state) => state.myPlotCode);
  const remotePlayers = useMultiplayerStore((state) => state.remotePlayers);

  // Trạng thái gameplay
  const [cameraZoom, setCameraZoom] = useState<number>(26);
  const [isNearFishingPier, setIsNearFishingPier] = useState(false);
  const [isNearPlayerHouse, setIsNearPlayerHouse] = useState(false);
  const [isInsidePlayerHouse, setIsInsidePlayerHouse] = useState(false);
  const [insidePlotCode, setInsidePlotCode] = useState<string | null>(null);
  const [forceCutawayRoof, setForceCutawayRoof] = useState(false);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [activeStreetNpcId, setActiveStreetNpcId] = useState<string | null>(null);

  // Trạng thái 4 Quán (Cafe, Quán Ăn, Quần Áo, Xe) & Không Gian Nội Thất 3D
  const [nearShopVenue, setNearShopVenue] = useState<ShopVenueId | null>(null);
  const [activeShopModal, setActiveShopModal] = useState<ShopVenueId | null>(null);
  const [shopModalInitialTab, setShopModalInitialTab] = useState<'buy' | 'work'>('buy');
  const [activeInteriorSpace, setActiveInteriorSpace] = useState<ActiveInteriorSpace | null>(null);
  const [interiorZone, setInteriorZone] = useState<'BUY' | 'WORK' | null>(null);
  const [isWorkingAsStaff, setIsWorkingAsStaff] = useState<boolean>(false);
  const [selectedFurnitureIndex, setSelectedFurnitureIndex] = useState<number | null>(null);
  const [workScenarioIndex, setWorkScenarioIndex] = useState<number>(0);

  // Trang phục & Phương tiện người chơi đang sử dụng
  const [outfitColor, setOutfitColor] = useState<string>('#38bdf8');
  const [hatColor, setHatColor] = useState<string>('#f59e0b');
  const [activeVehicle, setActiveVehicle] = useState<
    'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar'
  >('none');

  // Tùy chỉnh Ngôi Nhà Cấp 4 & Nội thất 3D của người chơi
  const ownerName = user?.tenDangNhap || 'Cư dân';
  const [houseTitle, setHouseTitle] = useState<string>(
    user?.nhaNguoiChoi?.tenNha || `Nhà Cấp 4 của ${ownerName}`
  );
  const [houseWallColor, setHouseWallColor] = useState<string>(
    user?.nhaNguoiChoi?.mauTuong || '#f5ebd6'
  );
  const [houseRoofColor, setHouseRoofColor] = useState<string>(
    user?.nhaNguoiChoi?.mauMai || '#b93829'
  );
  const [houseFurnitureList, setHouseFurnitureList] = useState<HouseFurnitureRenderItem[]>(
    () =>
      user?.nhaNguoiChoi?.danhSachNoiThat || [
        { maVatPham: 'GIUONG_GO_DON', toaDoLuoiX: 8, toaDoLuoiZ: 7, gocXoayDo: 0 },
        { maVatPham: 'BAN_HOC_DEN_LED', toaDoLuoiX: 8, toaDoLuoiZ: 2, gocXoayDo: 0 },
        { maVatPham: 'KE_SACH_OXFORD', toaDoLuoiX: 9, toaDoLuoiZ: 2, gocXoayDo: 0 },
        { maVatPham: 'SOFA_GO_PHONG_KHACH', toaDoLuoiX: 2, toaDoLuoiZ: 5, gocXoayDo: 0 },
        { maVatPham: 'KE_TIVI_CO_DIEN', toaDoLuoiX: 2, toaDoLuoiZ: 8, gocXoayDo: 0 },
        { maVatPham: 'THAM_DET_THO_CAM', toaDoLuoiX: 3, toaDoLuoiZ: 5, gocXoayDo: 0 },
      ]
  );
  const [ownedItemCodes, setOwnedItemCodes] = useState<string[]>(() => {
    const codes = new Set<string>(['SKATEBOARD_STARTER']);
    user?.tuiDo?.forEach((i) => codes.add(i.maVatPham));
    user?.nhaNguoiChoi?.danhSachPhuongTienSoHuu?.forEach((v) => codes.add(v));
    return Array.from(codes);
  });

  const [isFishing, setIsFishing] = useState(false);
  const [isSkateboarding, setIsSkateboarding] = useState(false);
  const [fishBiting, setFishBiting] = useState(false);
  const [pendingQuizFish, setPendingQuizFish] = useState<(typeof FISH_POOL)[0] | null>(null);
  const [caughtFish, setCaughtFish] = useState<(typeof FISH_POOL)[0] | null>(null);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<{ x: number; z: number; id: number } | null>(
    null
  );

  const biteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSpawnedPlotRef = useRef<string>('');

  // Lô đất hiện tại của người chơi (được random không trùng với người chơi khác)
  const activePlotCode = myPlotCode || user?.nhaNguoiChoi?.maLoDat || 'PLOT_CAP4_01';
  const myPlot = useMemo(() => getPlotByCode(activePlotCode), [activePlotCode]);
  const onlinePlayersList = useMemo(() => Array.from(remotePlayers.values()), [remotePlayers]);

  // Kết nối Multiplayer & Đồng bộ thông tin Nhà Cấp 4 ngay khi vào thế giới
  useEffect(() => {
    connect({
      userId: user?.id,
      username: user?.tenDangNhap || 'Cư dân',
      maLoDat: user?.nhaNguoiChoi?.maLoDat || '',
      houseTitle: user?.nhaNguoiChoi?.tenNha || `Nhà Cấp 4 của ${user?.tenDangNhap || 'Cư dân'}`,
      houseWallColor: user?.nhaNguoiChoi?.mauTuong || '#f5ebd6',
      houseRoofColor: user?.nhaNguoiChoi?.mauMai || '#b93829',
      houseFurniture: houseFurnitureList,
    });
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cập nhật profile khi thông tin user hoặc thiết kế nhà thay đổi
  useEffect(() => {
    if (user) {
      const nextTitle = user.nhaNguoiChoi?.tenNha || `Nhà Cấp 4 của ${user.tenDangNhap}`;
      const nextWall = user.nhaNguoiChoi?.mauTuong || '#f5ebd6';
      const nextRoof = user.nhaNguoiChoi?.mauMai || '#b93829';
      setHouseTitle(nextTitle);
      setHouseWallColor(nextWall);
      setHouseRoofColor(nextRoof);
      if (user.nhaNguoiChoi?.danhSachNoiThat && user.nhaNguoiChoi.danhSachNoiThat.length > 0) {
        setHouseFurnitureList(user.nhaNguoiChoi.danhSachNoiThat);
      }
      const nextCodes = new Set<string>(['SKATEBOARD_STARTER']);
      user.tuiDo?.forEach((i) => nextCodes.add(i.maVatPham));
      user.nhaNguoiChoi?.danhSachPhuongTienSoHuu?.forEach((v) => nextCodes.add(v));
      setOwnedItemCodes(Array.from(nextCodes));

      updateProfile({
        userId: user.id,
        username: user.tenDangNhap,
        maLoDat: myPlotCode || user.nhaNguoiChoi?.maLoDat || '',
        houseTitle: nextTitle,
        houseWallColor: nextWall,
        houseRoofColor: nextRoof,
        houseFurniture: user.nhaNguoiChoi?.danhSachNoiThat || houseFurnitureList,
      });
    }
  }, [user?.id, user?.tenDangNhap, updateProfile]);

  // Tự động đưa nhân vật tới trước cổng Lô Đất Nhà Cấp 4 được cấp ngẫu nhiên khi mới vào
  useEffect(() => {
    if (myPlotCode && initialSpawnedPlotRef.current !== myPlotCode) {
      initialSpawnedPlotRef.current = myPlotCode;
      const assignedPlot = getPlotByCode(myPlotCode);
      setTeleportTarget({
        x: assignedPlot.spawnPosition[0],
        z: assignedPlot.spawnPosition[2],
        id: Date.now(),
      });
      setToastMessage(
        `🏡 Bạn đang ở Ngôi Nhà Cấp 4 tại [${assignedPlot.tenLoDat}]!`
      );
    }
  }, [myPlotCode]);

  // 1. Mua nội thất mới bằng Xu trong Nhà Cấp 4
  const handleBuyFurniture = async (item: FurnitureCatalogItem) => {
    if (!token) {
      setToastMessage('⚠️ Vui lòng đăng nhập để mua nội thất.');
      return;
    }
    try {
      const res = await fetch('/api/world/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'buy_furniture',
          maVatPham: item.maVatPham,
          tenVatPham: item.tenVatPham,
          price: item.giaXu,
          toaDoLuoiX: item.defaultX,
          toaDoLuoiZ: item.defaultZ,
          gocXoayDo: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanhCong) {
        setToastMessage(data.message || 'Không thể mua nội thất.');
        return;
      }
      if (Array.isArray(data.danhSachNoiThat)) {
        setHouseFurnitureList(data.danhSachNoiThat);
        updateProfile({ houseFurniture: data.danhSachNoiThat });
      }
      await refreshUser();
      setToastMessage(`🛋️ Đã mua "${item.tenVatPham}" (-${item.giaXu} Xu) và đặt vào trong nhà!`);
    } catch {
      setToastMessage('Lỗi kết nối khi mua nội thất.');
    }
  };

  // 2. Cập nhật vị trí / góc xoay / cất nội thất trên lưới 10x10 trong nhà
  const handleUpdateFurnitureList = async (newList: HouseFurnitureRenderItem[]) => {
    setHouseFurnitureList(newList);
    updateProfile({ houseFurniture: newList });
    if (!token) return;
    try {
      await fetch('/api/world/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_furniture',
          danhSachNoiThat: newList,
        }),
      });
      await refreshUser();
    } catch {}
  };

  // 3. Lưu thay đổi màu sơn / tên Ngôi Nhà Cấp 4
  const handleUpdateExterior = async (nextTitle: string, nextWall: string, nextRoof: string) => {
    setHouseTitle(nextTitle);
    setHouseWallColor(nextWall);
    setHouseRoofColor(nextRoof);
    updateProfile({
      houseTitle: nextTitle,
      houseWallColor: nextWall,
      houseRoofColor: nextRoof,
    });
    setToastMessage('🏡 Đã cập nhật thiết kế Ngôi Nhà Cấp 4 của bạn!');
    if (!token) return;
    try {
      await fetch('/api/house', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenNha: nextTitle,
          mauTuong: nextWall,
          mauMai: nextRoof,
        }),
      });
      await refreshUser();
    } catch {}
  };

  // 4. Mua đồ ăn uống, quần áo, xe cộ tại 4 Quán (Cafe, Diner, Clothing, Car Showroom)
  const handleBuyShopItem = async (item: ShopProductItem) => {
    if (!token) {
      setToastMessage('⚠️ Vui lòng đăng nhập để mua vật phẩm.');
      return;
    }
    try {
      const res = await fetch('/api/world/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'buy_shop_item',
          code: item.id,
          price: item.priceCoins,
          category: item.category,
          expReward: item.expReward,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanhCong) {
        setToastMessage(data.message || 'Không thể mua mặt hàng này.');
        return;
      }
      setOwnedItemCodes((prev) => Array.from(new Set([...prev, item.id])));
      if (item.category === 'clothing' && item.outfitColor) {
        setOutfitColor(item.outfitColor);
        if (item.hatColor) setHatColor(item.hatColor);
      }
      if (item.category === 'vehicle' && item.vehicleType) {
        setActiveVehicle(item.vehicleType);
        setIsSkateboarding(item.vehicleType === 'skateboard');
      }
      await refreshUser();
      playCelebrationChime();
      setToastMessage(
        `🛍️ Đã mua "${item.name}" (-${item.priceCoins} Xu, +${item.expReward} EXP)!`
      );
    } catch {
      setToastMessage('Lỗi kết nối khi mua hàng.');
    }
  };

  // 5. Hoàn thành phục vụ khách NPC trong ca làm việc tại Quán
  const handleCompleteWorkScenario = async (scenario: WorkCustomerScenario) => {
    setWorkScenarioIndex((prev) => prev + 1);
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.6 },
    });
    playCelebrationChime();
    if (!token) return;
    try {
      await fetch('/api/world/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reward',
          coins: scenario.rewardCoins,
          exp: scenario.rewardExp,
        }),
      });
      await refreshUser();
      setToastMessage(
        `💼 Phục vụ khách thành công! +${scenario.rewardCoins} Xu & +${scenario.rewardExp} EXP!`
      );
    } catch {}
  };

  // 5B. Khi trả lời sai câu hỏi của khách NPC trong ca làm việc -> Khách không mua nữa và bỏ đi, gọi khách tiếp theo
  const handleFailWorkScenario = (scenario: WorkCustomerScenario) => {
    setWorkScenarioIndex((prev) => prev + 1);
    setToastMessage(
      `😞 Trả lời sai! Khách hàng ${scenario.customerName} không mua nữa và đã rời quầy.`
    );
  };

  // 5C. Hoàn thành câu hỏi giao tiếp Tiếng Anh với NPC trên đường phố
  const handleCompleteStreetNpcScenario = async (scenario: StreetNpcScenario) => {
    confetti({
      particleCount: 45,
      spread: 55,
      origin: { y: 0.6 },
    });
    playCelebrationChime();
    if (!token) return;
    try {
      await fetch('/api/world/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reward',
          coins: scenario.rewardCoins,
          exp: scenario.rewardExp,
        }),
      });
      await refreshUser();
      setToastMessage(
        `💬 Giao tiếp Tiếng Anh thành công! +${scenario.rewardCoins} Xu & +${scenario.rewardExp} EXP!`
      );
    } catch {}
  };

  // Bước vào Không Gian Nội Thất 3D của Ngôi Nhà Cấp 4 (Nhà mình hoặc Nhà bạn bè đang Online)
  const handleEnterHouseSpace = useCallback(
    (plotCode: string) => {
      const plotCfg = getPlotByCode(plotCode);
      const isMine = plotCode === myPlot.maLoDat;
      const neighbor = onlinePlayersList.find((rp) => rp.maLoDat === plotCode);

      if (!isMine && !neighbor) {
        return;
      }

      const returnCoords: [number, number, number] = [
        plotCfg.position[0],
        1.2,
        plotCfg.position[2] - 5.8,
      ];
      setIsFishing(false);
      setSelectedFurnitureIndex(null);
      setInteriorZone(null);
      setIsWorkingAsStaff(false);
      setTeleportTarget({
        x: returnCoords[0],
        z: returnCoords[2],
        id: Date.now(),
      });
      setActiveInteriorSpace({
        kind: 'HOUSE',
        plotCode,
        ownerName: isMine ? ownerName : neighbor?.username || 'Bạn bè',
        houseTitle: isMine
          ? houseTitle
          : neighbor?.houseTitle || `Nhà Cấp 4 của ${neighbor?.username || 'Bạn bè'}`,
        plotLabel: plotCfg.tenLoDat,
        isMyHouse: isMine,
        wallColor: isMine ? houseWallColor : neighbor?.houseWallColor || plotCfg.defaultWallColor,
        roofColor: isMine ? houseRoofColor : neighbor?.houseRoofColor || plotCfg.defaultRoofColor,
        returnPosition: returnCoords,
      });
      setToastMessage(
        isMine
          ? `🏠 Đã bước vào bên trong Không Gian ${houseTitle}!`
          : `🏘️ Đang vào thăm Không Gian Nhà của ${neighbor?.username}!`
      );
    },
    [myPlot.maLoDat, onlinePlayersList, ownerName, houseTitle, houseWallColor, houseRoofColor]
  );

  // Bước vào Không Gian Nội Thất 3D của 1 trong 4 Quán (Cafe, Quán Ăn, Quần Áo, Showroom Xe)
  const handleEnterShopSpace = useCallback((shopId: ShopVenueId) => {
    const returnMap: Record<ShopVenueId, [number, number, number]> = {
      CAFE: [34, 1.2, 42.5],
      DINER: [35, 1.2, 20.5],
      CLOTHING: [12, 1.2, -26.5],
      CAR_SHOWROOM: [-12, 1.2, -26.0],
    };
    const returnCoords = returnMap[shopId];
    setIsFishing(false);
    setSelectedFurnitureIndex(null);
    setInteriorZone(null);
    setIsWorkingAsStaff(false);
    setTeleportTarget({
      x: returnCoords[0],
      z: returnCoords[2],
      id: Date.now(),
    });
    setActiveInteriorSpace({
      kind: 'SHOP',
      shopId,
      returnPosition: returnCoords,
    });
    setToastMessage(
      `🚪 Đã bước vào ${CITY_SHOPS_DATA[shopId].title} với tư cách Khách Hàng mua sắm!`
    );
  }, []);

  // Bước từ Cửa Thoát trong phòng ra lại đúng vị trí trước cửa Quán / Nhà vừa vào
  const handleExitInteriorSpace = useCallback(() => {
    if (!activeInteriorSpace) return;
    const ret = activeInteriorSpace.returnPosition;
    const exitLabel =
      activeInteriorSpace.kind === 'SHOP'
        ? `🚶 Đã bước ra trước cửa ${CITY_SHOPS_DATA[activeInteriorSpace.shopId].title}!`
        : `🚶 Đã bước ra trước cổng ${activeInteriorSpace.houseTitle}!`;

    setTeleportTarget({
      x: ret[0],
      z: ret[2],
      id: Date.now(),
    });
    setActiveInteriorSpace(null);
    setSelectedFurnitureIndex(null);
    setInteriorZone(null);
    setIsWorkingAsStaff(false);
    setActiveShopModal(null);
    setIsHouseModalOpen(false);
    setToastMessage(exitLabel);
  }, [activeInteriorSpace]);

  // Danh sách nội thất đang hiển thị trong phòng (nhà mình hoặc nhà bạn bè đang online)
  const activeInteriorFurnitureList = useMemo(() => {
    if (!activeInteriorSpace || activeInteriorSpace.kind !== 'HOUSE') {
      return houseFurnitureList;
    }
    if (activeInteriorSpace.isMyHouse) {
      return houseFurnitureList;
    }
    const neighbor = onlinePlayersList.find((rp) => rp.maLoDat === activeInteriorSpace.plotCode);
    return neighbor?.houseFurniture && neighbor.houseFurniture.length > 0
      ? neighbor.houseFurniture
      : houseFurnitureList;
  }, [activeInteriorSpace, houseFurnitureList, onlinePlayersList]);

  // Khách hàng NPC đang vào hỏi mua đồ trong Quán
  const activeShopWorkScenario = useMemo(() => {
    if (!activeInteriorSpace || activeInteriorSpace.kind !== 'SHOP') return null;
    const list = CITY_SHOPS_DATA[activeInteriorSpace.shopId].workScenarios;
    return list[workScenarioIndex % list.length] || list[0] || null;
  }, [activeInteriorSpace, workScenarioIndex]);

  // Xử lý bắt đầu hoặc dừng câu cá
  const toggleFishing = useCallback(() => {
    if (!isFishing) {
      if (!isNearFishingPier) {
        setToastMessage(
          '🎣 Hãy chạy ra Bến Cảng Hồ Câu (phía Tây Nam) để thả cần câu cá nhé!'
        );
        return;
      }
      setIsFishing(true);
      setIsSkateboarding(false);
      setActiveVehicle('none');
      setFishBiting(false);
      setToastMessage('🎣 Đang thả câu xuống hồ... Hãy chú ý khi cá cắn câu!');

      const waitTime = 2600 + Math.random() * 2200;
      if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
      biteTimerRef.current = setTimeout(() => {
        setFishBiting(true);
      }, waitTime);
    } else {
      setIsFishing(false);
      setFishBiting(false);
      if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
    }
  }, [isFishing, isNearFishingPier]);

  // Lắng nghe phím F để câu cá & phím E để bước vào cửa Nhà/Quán hoặc tương tác quầy bên trong
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyF' && !activeInteriorSpace) {
        e.preventDefault();
        toggleFishing();
      } else if (e.code === 'KeyE') {
        if (activeInteriorSpace) {
          if (activeInteriorSpace.kind === 'SHOP' && !activeShopModal) {
            e.preventDefault();
            setShopModalInitialTab(
              interiorZone === 'WORK' && isWorkingAsStaff ? 'work' : 'buy'
            );
            setActiveShopModal(activeInteriorSpace.shopId);
          } else if (
            activeInteriorSpace.kind === 'HOUSE' &&
            activeInteriorSpace.isMyHouse &&
            !isHouseModalOpen
          ) {
            e.preventDefault();
            setIsHouseModalOpen(true);
          }
        } else {
          // Ưu tiên số 1 khi ở ngoài đường phố: Nếu đang đứng gần bất kỳ NPC nào (cư dân đi bộ hoặc NPC cố định) -> Mở hội thoại Tiếng Anh ngay
          const nearbyNpcId = getNearbyStreetNpcId();
          if (nearbyNpcId) {
            e.preventDefault();
            setActiveStreetNpcId(nearbyNpcId);
          } else if (nearShopVenue) {
            e.preventDefault();
            handleEnterShopSpace(nearShopVenue);
          } else if (insidePlotCode) {
            e.preventDefault();
            handleEnterHouseSpace(insidePlotCode);
          } else if (isNearPlayerHouse) {
            e.preventDefault();
            handleEnterHouseSpace(myPlot.maLoDat);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    toggleFishing,
    activeInteriorSpace,
    activeShopModal,
    interiorZone,
    isWorkingAsStaff,
    isHouseModalOpen,
    nearShopVenue,
    insidePlotCode,
    isNearPlayerHouse,
    myPlot.maLoDat,
    handleEnterShopSpace,
    handleEnterHouseSpace,
  ]);

  // Khi cá cắn câu và bấm "GIẬT CẦN NGAY!" -> Mở thử thách câu hỏi Tiếng Anh trước khi câu lên thành công!
  const handleReelIn = () => {
    if (!fishBiting) return;
    setFishBiting(false);
    setIsFishing(false);

    const randomFish = FISH_POOL[Math.floor(Math.random() * FISH_POOL.length)];
    setPendingQuizFish(randomFish);
  };

  // Khi trả lời ĐÚNG câu hỏi Tiếng Anh -> Kéo cá lên thành công và cộng thưởng Xu + EXP
  const handleFishingQuizSuccess = async () => {
    if (!pendingQuizFish) return;
    const fish = pendingQuizFish;
    setPendingQuizFish(null);
    setCaughtFish(fish);

    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
    });
    playCelebrationChime();

    if (token) {
      try {
        await fetch('/api/world/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'reward',
            coins: fish.coins,
            exp: fish.exp,
          }),
        });
        await refreshUser();
      } catch {}
    }
  };

  // Kích hoạt Emote
  const triggerEmote = (emoteName: string) => {
    if (currentEmote === emoteName) {
      setCurrentEmote(null);
    } else {
      setCurrentEmote(emoteName);
      setTimeout(() => {
        setCurrentEmote((prev) => (prev === emoteName ? null : prev));
      }, 4000);
    }
  };

  // Dịch chuyển nhanh tới khu phố
  const handleTeleport = (label: string, x: number, z: number) => {
    setIsFishing(false);
    setTeleportTarget({ x, z, id: Date.now() });
    setToastMessage(`🚀 Đã dịch chuyển tới: ${label}`);
  };

  // Định dạng hiển thị giờ: HH:MM
  const hours = Math.floor(gameTime);
  const minutes = Math.floor((gameTime - hours) * 60);
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <Box
      onWheel={(e) => {
        setCameraZoom((prev) => Math.max(14, Math.min(45, prev - e.deltaY * 0.015)));
      }}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '620px',
        overflow: 'hidden',
      }}
    >
      {/* ================================================================= */}
      {/* 1. HƯỚNG DẪN THAO TÁC GAMEPLAY HUD Ở GÓC TRÊN TRÁI                */}
      {/* ================================================================= */}
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          p: '7px 14px',
          borderRadius: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <SportsEsportsRoundedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
        <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
          <strong>WASD</strong>: Di chuyển • <strong>Shift</strong>: Ván trượt 🛹 • <strong>Space</strong>: Nhảy • <strong>[E]</strong>: Hội thoại • <strong>Con lăn</strong>: Thu/Phóng
        </Typography>
      </Box>

      {/* ================================================================= */}
      {/* 2. DANH SÁCH NGƯỜI CHƠI ĐANG ONLINE & GẶP NHAU TỨC THÌ           */}
      {/* ================================================================= */}
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.8,
          p: '6px 12px',
          borderRadius: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
          maxWidth: { xs: '95%', lg: '65%' },
        }}
      >
        <GroupsRoundedIcon sx={{ color: '#34d399', fontSize: 19 }} />
        <Typography variant="caption" sx={{ color: '#a7f3d0', fontWeight: 800, mr: 0.5 }}>
          Đang Online ({onlinePlayersList.length + 1}):
        </Typography>

        <Chip
          label={`🟢 Bạn (${ownerName})`}
          size="small"
          onClick={() =>
            handleTeleport(
              `🏡 ${houseTitle}`,
              myPlot.spawnPosition[0],
              myPlot.spawnPosition[2]
            )
          }
          sx={{
            height: 23,
            fontSize: '0.68rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
            color: '#e0f2fe',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.35)' },
          }}
        />

        {onlinePlayersList.length === 0 ? (
          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', ml: 0.5 }}>
            Mở thêm tab/trình duyệt khác đăng nhập để gặp nhau & thăm nhà hàng xóm!
          </Typography>
        ) : (
          onlinePlayersList.map((rp) => {
            const rpPlot = getPlotByCode(rp.maLoDat);
            return (
              <Box
                key={rp.id}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.7rem' }}>
                  🟢 {rp.username}
                </Typography>
                <Tooltip title={`Dịch chuyển đến gặp trực tiếp ${rp.username}`}>
                  <Chip
                    icon={<PersonPinCircleRoundedIcon sx={{ fontSize: '13px !important', color: '#0f172a !important' }} />}
                    label="Gặp ngay"
                    size="small"
                    onClick={() =>
                      handleTeleport(`Vị trí của ${rp.username}`, rp.x + 1.5, rp.z + 1.5)
                    }
                    sx={{
                      height: 19,
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      backgroundColor: '#34d399',
                      color: '#0f172a',
                      '&:hover': { backgroundColor: '#6ee7b7' },
                    }}
                  />
                </Tooltip>
                <Tooltip title={`Đến thăm Ngôi Nhà Cấp 4 của ${rp.username} (${rpPlot.tenLoDat})`}>
                  <Chip
                    label={`🏘️ Thăm nhà (${rpPlot.tenLoDat.split('•')[0].trim()})`}
                    size="small"
                    onClick={() =>
                      handleTeleport(
                        `🏘️ Nhà Cấp 4 của ${rp.username}`,
                        rpPlot.spawnPosition[0],
                        rpPlot.spawnPosition[2]
                      )
                    }
                    sx={{
                      height: 19,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(56, 189, 248, 0.25)',
                      color: '#bae6fd',
                      '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.45)' },
                    }}
                  />
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>

      {/* ================================================================= */}
      {/* 2C. BANNER KHÔNG GIAN BÊN TRONG NHÀ / QUÁN HOẶC HƯỚNG DẪN VÀO CỬA */}
      {/* ================================================================= */}
      {activeInteriorSpace ? (
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            left: 14,
            zIndex: 28,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.2,
            p: '8px 16px',
            borderRadius: 3.5,
            background:
              activeInteriorSpace.kind === 'HOUSE'
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(180, 83, 9, 0.92))'
                : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.92))',
            border: '2px solid #fbbf24',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <HomeWorkRoundedIcon sx={{ color: '#fef08a', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 900 }}>
            {activeInteriorSpace.kind === 'HOUSE'
              ? `🏠 Không Gian Trong Nhà: ${activeInteriorSpace.houseTitle} (${activeInteriorSpace.plotLabel})`
              : `${CITY_SHOPS_DATA[activeInteriorSpace.shopId].title} • Không Gian Trong Quán`}
          </Typography>

          {/* KHI ĐANG Ở BÊN TRONG NHÀ CỦA MÌNH: HIỆN ICON NHỎ ĐỂ MUA NỘI THẤT BẰNG XU & TỰ DO TRANG TRÍ */}
          {activeInteriorSpace.kind === 'HOUSE' && activeInteriorSpace.isMyHouse && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<PaletteRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setIsHouseModalOpen(true)}
                sx={{
                  height: 28,
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  textTransform: 'none',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.5)',
                  '&:hover': { background: '#fde047' },
                }}
              >
                🛋️ Mua Nội Thất Bằng Xu & Trang Trí ({houseFurnitureList.length})
              </Button>

              {selectedFurnitureIndex !== null && houseFurnitureList[selectedFurnitureIndex] && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                  <Chip
                    label="💡 Click sàn phòng 3D để đổi vị trí"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(56, 189, 248, 0.25)',
                      color: '#bae6fd',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      const next = houseFurnitureList.map((it, idx) =>
                        idx === selectedFurnitureIndex
                          ? { ...it, gocXoayDo: ((it.gocXoayDo || 0) + 90) % 360 }
                          : it
                      );
                      handleUpdateFurnitureList(next);
                    }}
                    sx={{
                      height: 25,
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      textTransform: 'none',
                      backgroundColor: '#38bdf8',
                      color: '#0f172a',
                    }}
                  >
                    🔄 Xoay 90°
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      const next = houseFurnitureList.filter((_, idx) => idx !== selectedFurnitureIndex);
                      setSelectedFurnitureIndex(null);
                      handleUpdateFurnitureList(next);
                    }}
                    sx={{
                      height: 25,
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      textTransform: 'none',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                    }}
                  >
                    🗑️ Cất món này
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* KHI ĐANG Ở BÊN TRONG 4 QUÁN: MẶC ĐỊNH LÀ KHÁCH MUA HÀNG, NẾU MUỐN LÀM NHÂN VIÊN THÌ CHỌN */}
          {activeInteriorSpace.kind === 'SHOP' && (
            <>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setShopModalInitialTab('buy');
                  setActiveShopModal(activeInteriorSpace.shopId);
                }}
                sx={{
                  height: 27,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  textTransform: 'none',
                  borderRadius: 2,
                  backgroundColor: interiorZone === 'BUY' ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)',
                  color: interiorZone === 'BUY' ? '#0f172a' : '#e0f2fe',
                  border: '1px solid #38bdf8',
                }}
              >
                🛒 Mua Sắm Hàng Hóa {interiorZone === 'BUY' ? '[Đang đứng gần - Bấm E]' : ''}
              </Button>

              {isWorkingAsStaff ? (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setShopModalInitialTab('work');
                      setActiveShopModal(activeInteriorSpace.shopId);
                    }}
                    sx={{
                      height: 27,
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      textTransform: 'none',
                      borderRadius: 2,
                      backgroundColor: '#fbbf24',
                      color: '#0f172a',
                      border: '1px solid #fbbf24',
                    }}
                  >
                    👨‍🍳 Tiếp Khách Hàng NPC {interiorZone === 'WORK' ? '[Bấm E]' : ''}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setIsWorkingAsStaff(false);
                      setToastMessage('🛒 Bạn đã nghỉ ca làm và trở lại làm khách mua hàng bình thường.');
                    }}
                    sx={{
                      height: 27,
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      textTransform: 'none',
                      borderRadius: 2,
                      borderColor: '#f87171',
                      color: '#fca5a5',
                      backgroundColor: 'rgba(239, 68, 68, 0.16)',
                    }}
                  >
                    🛑 Nghỉ làm (Trở lại làm khách)
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setIsWorkingAsStaff(true);
                    setToastMessage(
                      `👨‍🍳 Bạn đã bắt đầu ca làm ${CITY_SHOPS_DATA[activeInteriorSpace.shopId].jobTitle}! Khách NPC sẽ bước vào quầy bên phải.`
                    );
                  }}
                  sx={{
                    height: 27,
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderColor: '#fbbf24',
                    color: '#fef08a',
                    backgroundColor: 'rgba(251, 191, 36, 0.14)',
                  }}
                >
                  💼 Xin làm nhân viên ca này
                </Button>
              )}
            </>
          )}

          <Button
            size="small"
            variant="outlined"
            onClick={handleExitInteriorSpace}
            sx={{
              height: 27,
              fontSize: '0.72rem',
              fontWeight: 900,
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#34d399',
              color: '#a7f3d0',
              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
            }}
          >
            🚪 Bước Ra Ngoài Thành Phố
          </Button>
        </Box>
      ) : (
        <>
          {/* KHI ĐANG ĐỨNG TRƯỚC CỬA NHÀ NGOÀI THÀNH PHỐ: BƯỚC VÀO CỬA ĐỂ ĐI VÀO KHÔNG GIAN NHÀ */}
          {(isNearPlayerHouse || insidePlotCode) && !isFishing && (
            <Box
              sx={{
                position: 'absolute',
                top: 60,
                left: 14,
                zIndex: 25,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                p: '8px 14px',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.92), rgba(234, 88, 12, 0.92))',
                border: '1.5px solid #fef08a',
                boxShadow: '0 8px 28px rgba(185, 28, 28, 0.45)',
              }}
            >
              <HomeWorkRoundedIcon sx={{ color: '#fef08a', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>
                🏡 Đang đứng trước cổng {houseTitle} ({myPlot.tenLoDat}) — Hãy đi bộ vào cửa chính!
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleEnterHouseSpace(insidePlotCode || myPlot.maLoDat)}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'none',
                  backgroundColor: '#fef08a',
                  color: '#7c2d12',
                  '&:hover': { backgroundColor: '#fde047' },
                }}
              >
                🚪 Bước Vào Không Gian Nhà [Phím E]
              </Button>
            </Box>
          )}

          {/* KHI ĐANG ĐỨNG TRƯỚC CỬA 1 TRONG 4 QUÁN NGOÀI ĐƯỜNG: BƯỚC VÀO CỬA ĐỂ ĐI VÀO KHÔNG GIAN QUÁN */}
          {nearShopVenue && !isFishing && (
            <Box
              sx={{
                position: 'absolute',
                top: 62,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: '8px 18px',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.94))',
                border: '2px solid #fbbf24',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#fef08a', fontWeight: 900 }}>
                {CITY_SHOPS_DATA[nearShopVenue].title}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleEnterShopSpace(nearShopVenue)}
                sx={{
                  backgroundColor: '#fbbf24',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#fde047' },
                }}
              >
                🚪 Bước Vào Không Gian Quán [Đi vào cửa / Phím E]
              </Button>
            </Box>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* 3. PROMPT THÔNG BÁO BẾN CÂU CÁ (KHI ĐỨNG GẦN HỒ)                  */}
      {/* ================================================================= */}
      {isNearFishingPier && !isFishing && (
        <Box
          sx={{
            position: 'absolute',
            top: 108,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: '10px 20px',
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(14, 165, 233, 0.95))',
            boxShadow: '0 8px 30px rgba(2, 132, 199, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 800 }}>
            🎣 Bạn đang ở Bến Câu Cá! Bấm [F] hoặc nhấn nút để thả cần câu
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={toggleFishing}
            sx={{
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.78rem',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            Bắt đầu câu
          </Button>
        </Box>
      )}

      {/* ================================================================= */}
      {/* 4. MINIGAME CÂU CÁ: NÚT GIẬT CẦN NẢY LÊN KHI CÁ CẮN CÂU           */}
      {/* ================================================================= */}
      {isFishing && (
        <Box
          sx={{
            position: 'absolute',
            top: 108,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {fishBiting ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleReelIn}
              sx={{
                p: '14px 32px',
                fontSize: '1.1rem',
                fontWeight: 900,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: '#ffffff',
                boxShadow: '0 0 35px #ef4444',
                border: '3px solid #ffffff',
                animation: 'bounce 0.6s infinite alternate',
                '@keyframes bounce': {
                  '0%': { transform: 'scale(1) rotate(-3deg)' },
                  '100%': { transform: 'scale(1.15) rotate(3deg)' },
                },
              }}
            >
              ❗ CÁ ĐÃ CẮN CÂU! GIẬT CẦN NGAY!
            </Button>
          ) : (
            <Paper
              elevation={8}
              sx={{
                p: '10px 24px',
                borderRadius: 4,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <PhishingRoundedIcon sx={{ color: '#38bdf8', fontSize: 24 }} />
              <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                Đang thả câu... Hãy chú ý phao câu khi cá cắn!
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleFishing}
                sx={{
                  ml: 1,
                  color: '#94a3b8',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '0.72rem',
                  textTransform: 'none',
                }}
              >
                Thu cần
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* ================================================================= */}
      {/* 5. THANH HÀNH ĐỘNG, NHÀ CẤP 4, VÁN TRƯỢT & ZOOM CAMERA            */}
      {/* ================================================================= */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 90,
          right: 20,
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1.2,
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Tooltip
          title={
            activeInteriorSpace?.kind === 'HOUSE' && activeInteriorSpace.isMyHouse
              ? 'Mua & Trang trí Nội Thất trong nhà'
              : 'Về trước cửa Ngôi Nhà Cấp 4 của tôi'
          }
          placement="left"
        >
          <IconButton
            onClick={() => {
              if (activeInteriorSpace?.kind === 'HOUSE' && activeInteriorSpace.isMyHouse) {
                setIsHouseModalOpen(true);
              } else {
                if (activeInteriorSpace) {
                  setActiveInteriorSpace(null);
                }
                handleTeleport(
                  `🏡 ${houseTitle}`,
                  myPlot.spawnPosition[0],
                  myPlot.spawnPosition[2]
                );
              }
            }}
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              '&:hover': { backgroundColor: '#ef4444', color: '#ffffff' },
            }}
          >
            <HomeWorkRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Lướt Ván Trượt tốc độ cao (Hoặc giữ phím Shift)" placement="left">
          <IconButton
            onClick={() => setIsSkateboarding((prev) => !prev)}
            sx={{
              backgroundColor: isSkateboarding ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
              color: isSkateboarding ? '#0f172a' : '#fbbf24',
              '&:hover': { backgroundColor: isSkateboarding ? '#d97706' : 'rgba(245, 158, 11, 0.2)' },
            }}
          >
            <SkateboardingRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Câu cá (Phím F)" placement="left">
          <IconButton
            onClick={toggleFishing}
            sx={{
              backgroundColor: isFishing ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
              color: isFishing ? '#ffffff' : '#38bdf8',
              '&:hover': { backgroundColor: isFishing ? '#0369a1' : 'rgba(56, 189, 248, 0.2)' },
            }}
          >
            <PhishingRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Nhảy múa (Dance)" placement="left">
          <IconButton
            onClick={() => triggerEmote('dance')}
            sx={{
              backgroundColor: currentEmote === 'dance' ? '#ec4899' : 'rgba(255, 255, 255, 0.08)',
              color: currentEmote === 'dance' ? '#ffffff' : '#f472b6',
              '&:hover': { backgroundColor: currentEmote === 'dance' ? '#db2777' : 'rgba(236, 72, 153, 0.2)' },
            }}
          >
            <MusicNoteRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Vẫy tay chào (Wave)" placement="left">
          <IconButton
            onClick={() => triggerEmote('wave')}
            sx={{
              backgroundColor: currentEmote === 'wave' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
              color: currentEmote === 'wave' ? '#ffffff' : '#fbbf24',
              '&:hover': { backgroundColor: currentEmote === 'wave' ? '#d97706' : 'rgba(245, 158, 11, 0.2)' },
            }}
          >
            <WavingHandRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Thả tim (Heart)" placement="left">
          <IconButton
            onClick={() => triggerEmote('heart')}
            sx={{
              backgroundColor: currentEmote === 'heart' ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
              color: currentEmote === 'heart' ? '#ffffff' : '#f87171',
              '&:hover': { backgroundColor: currentEmote === 'heart' ? '#dc2626' : 'rgba(239, 68, 68, 0.2)' },
            }}
          >
            <FavoriteRoundedIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', my: 0.2 }} />

        <Tooltip title="Phóng to góc nhìn (Zoom In)" placement="left">
          <IconButton
            size="small"
            onClick={() => setCameraZoom((z) => Math.min(45, z + 4))}
            sx={{ color: '#cbd5e1', '&:hover': { color: '#38bdf8' } }}
          >
            <ZoomInRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Thu nhỏ toàn cảnh thành phố (Zoom Out)" placement="left">
          <IconButton
            size="small"
            onClick={() => setCameraZoom((z) => Math.max(14, z - 4))}
            sx={{ color: '#cbd5e1', '&:hover': { color: '#38bdf8' } }}
          >
            <ZoomOutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ================================================================= */}
      {/* 6. 3D WEBGL CANVAS: REALISTIC METROPOLIS & INTERIOR 3D SPACES     */}
      {/* ================================================================= */}
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          <OrthographicCamera
            makeDefault
            position={[22, 22, 22]}
            zoom={activeInteriorSpace ? Math.max(22, cameraZoom) : cameraZoom}
            near={-150}
            far={600}
          />

          <Physics gravity={[0, -22.0, 0]}>
            {activeInteriorSpace ? (
              <InteriorSpaceScene
                interior={activeInteriorSpace}
                houseFurnitureList={activeInteriorFurnitureList}
                selectedFurnitureIndex={selectedFurnitureIndex}
                onSelectFurnitureIndex={setSelectedFurnitureIndex}
                onMoveSelectedFurnitureToGrid={(gx, gz) => {
                  if (selectedFurnitureIndex === null) return;
                  const next = houseFurnitureList.map((it, idx) =>
                    idx === selectedFurnitureIndex
                      ? { ...it, toaDoLuoiX: gx, toaDoLuoiZ: gz }
                      : it
                  );
                  handleUpdateFurnitureList(next);
                }}
                onOpenHouseShopModal={() => setIsHouseModalOpen(true)}
                onOpenShopBuyModal={() => {
                  if (activeInteriorSpace.kind === 'SHOP') {
                    setShopModalInitialTab('buy');
                    setActiveShopModal(activeInteriorSpace.shopId);
                  }
                }}
                onOpenShopWorkModal={() => {
                  if (activeInteriorSpace.kind === 'SHOP') {
                    setShopModalInitialTab('work');
                    setActiveShopModal(activeInteriorSpace.shopId);
                  }
                }}
                isWorkingAsStaff={isWorkingAsStaff}
                onToggleWorkingAsStaff={(working) => {
                  setIsWorkingAsStaff(working);
                  if (activeInteriorSpace.kind === 'SHOP') {
                    setToastMessage(
                      working
                        ? `👨‍🍳 Đã nhận ca làm ${CITY_SHOPS_DATA[activeInteriorSpace.shopId].jobTitle}! Khách NPC đang bước vào quầy.`
                        : '🛒 Đã nghỉ ca làm — Bạn đang là khách mua hàng bình thường.'
                    );
                  }
                }}
                activeWorkScenario={activeShopWorkScenario}
                onExitInterior={handleExitInteriorSpace}
                onInteriorZoneChange={setInteriorZone}
                outfitColor={outfitColor}
                hatColor={hatColor}
                currentEmote={currentEmote}
                teleportTarget={teleportTarget}
              />
            ) : (
              <PlayTogetherCityScene
                onInteractNPC={(npcId) => {
                  setActiveStreetNpcId(npcId);
                }}
                isFishing={isFishing}
                isSkateboarding={isSkateboarding}
                activeVehicle={activeVehicle}
                outfitColor={outfitColor}
                hatColor={hatColor}
                currentEmote={currentEmote}
                teleportTarget={teleportTarget}
                onNearFishingPier={setIsNearFishingPier}
                onNearPlayerHouse={(near, inside) => {
                  setIsNearPlayerHouse(near);
                  setIsInsidePlayerHouse(inside);
                }}
                onEnterPlotInterior={setInsidePlotCode}
                onNearShopVenue={setNearShopVenue}
                onOpenShopModal={(shopId) => handleEnterShopSpace(shopId)}
                onStepHouseDoor={handleEnterHouseSpace}
                onStepShopDoor={handleEnterShopSpace}
                myPlot={myPlot}
                ownerName={ownerName}
                houseTitle={houseTitle}
                houseWallColor={houseWallColor}
                houseRoofColor={houseRoofColor}
                houseFurnitureList={houseFurnitureList}
                insidePlotCode={insidePlotCode}
                forceCutawayRoof={isInsidePlayerHouse || forceCutawayRoof}
                onClickManageHouse={() => handleEnterHouseSpace(myPlot.maLoDat)}
              />
            )}
          </Physics>
        </Canvas>
      </KeyboardControls>

      {/* LỚP PHỦ NHÃN 3D DÙNG CHUNG 1 REACT ROOT (KHÔNG BAO GIỜ GỌI root.unmount) */}
      <HtmlOverlayHost />

      {/* ================================================================= */}
      {/* 6B. MODAL MUA NỘI THẤT BẰNG XU & TỰ DO TRANG TRÍ NHÀ CẤP 4         */}
      {/* ================================================================= */}
      <HouseFurnitureModal
        isOpen={isHouseModalOpen}
        userCoins={user?.tien ?? 100}
        furnitureList={houseFurnitureList}
        houseTitle={houseTitle}
        houseWallColor={houseWallColor}
        houseRoofColor={houseRoofColor}
        myPlotLabel={myPlot.tenLoDat}
        onClose={() => setIsHouseModalOpen(false)}
        onBuyFurniture={handleBuyFurniture}
        onUpdateFurnitureList={handleUpdateFurnitureList}
        onUpdateExterior={handleUpdateExterior}
      />

      {/* ================================================================= */}
      {/* 6C. MODAL CÂU HỎI TIẾNG ANH TRƯỚC KHI CÂU CÁ LÊN THÀNH CÔNG        */}
      {/* ================================================================= */}
      <FishingQuizModal
        isOpen={Boolean(pendingQuizFish)}
        pendingFish={pendingQuizFish}
        onSuccess={handleFishingQuizSuccess}
        onCancel={() => setPendingQuizFish(null)}
      />

      {/* ================================================================= */}
      {/* 6D. MODAL 4 QUÁN (CAFE, QUÁN ĂN, QUẦN ÁO, XE) & LÀM VIỆC KIẾM TIỀN */}
      {/* ================================================================= */}
      <ShopAndWorkModal
        shopId={activeShopModal}
        initialTab={shopModalInitialTab}
        isWorkingAsStaff={isWorkingAsStaff}
        onToggleWorkingAsStaff={(working) => {
          setIsWorkingAsStaff(working);
          if (activeShopModal) {
            setToastMessage(
              working
                ? `👨‍🍳 Đã nhận ca làm ${CITY_SHOPS_DATA[activeShopModal].jobTitle}!`
                : '🛒 Đã nghỉ ca làm — Bạn đang là khách mua hàng bình thường.'
            );
          }
        }}
        userCoins={user?.tien ?? 100}
        ownedItemCodes={ownedItemCodes}
        activeOutfitColor={outfitColor}
        activeVehicle={activeVehicle}
        onClose={() => setActiveShopModal(null)}
        onBuyShopItem={handleBuyShopItem}
        onEquipOutfit={(nextOutfit, nextHat, name) => {
          setOutfitColor(nextOutfit);
          setHatColor(nextHat);
          setToastMessage(`👕 Đã mặc trang phục "${name}"!`);
        }}
        onEquipVehicle={(vType, name) => {
          setActiveVehicle(vType);
          setIsSkateboarding(vType === 'skateboard');
          setToastMessage(
            vType === 'none' ? '🚶 Đã xuống xe.' : `🔑 Đang lái "${name}" tốc độ cao!`
          );
        }}
        onCompleteWorkScenario={handleCompleteWorkScenario}
        onFailWorkScenario={handleFailWorkScenario}
      />

      {/* ================================================================= */}
      {/* 6E. MODAL TRÒ CHUYỆN & LUYỆN TIẾNG ANH CÙNG NPC ĐƯỜNG PHỐ (PHÍM E) */}
      {/* ================================================================= */}
      <StreetNpcDialogueModal
        npcId={activeStreetNpcId}
        onClose={() => setActiveStreetNpcId(null)}
        onCompleteScenario={handleCompleteStreetNpcScenario}
      />

      {/* ================================================================= */}
      {/* 7. MODAL CHÚC MỪNG CÂU ĐƯỢC CÁ (REWARD POPUP)                    */}
      {/* ================================================================= */}
      <Dialog
        open={Boolean(caughtFish)}
        onClose={() => setCaughtFish(null)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            p: 2,
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
            maxWidth: 380,
          },
        }}
      >
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <CelebrationRoundedIcon sx={{ fontSize: 48, color: '#fbbf24' }} />
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#f8fafc' }}>
            BẠN ĐÃ CÂU ĐƯỢC!
          </Typography>

          {caughtFish && (
            <Box
              sx={{
                my: 1,
                p: 3,
                width: '100%',
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${caughtFish.color}`,
              }}
            >
              <Typography sx={{ fontSize: '4.5rem', lineHeight: 1, mb: 1 }}>
                {caughtFish.icon}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
                {caughtFish.name}
              </Typography>
              <Chip
                label={caughtFish.rarity}
                size="small"
                sx={{
                  mt: 0.5,
                  fontWeight: 800,
                  backgroundColor: `${caughtFish.color}25`,
                  color: caughtFish.color,
                  border: `1px solid ${caughtFish.color}`,
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2.5 }}>
                <Chip
                  label={`+${caughtFish.exp} EXP`}
                  sx={{
                    fontWeight: 800,
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                  }}
                />
                <Chip
                  label={`+${caughtFish.coins} Xu`}
                  sx={{
                    fontWeight: 800,
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    color: '#fde68a',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setCaughtFish(null);
              toggleFishing();
            }}
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 800,
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              '&:hover': { backgroundColor: '#7dd3fc' },
            }}
          >
            Tiếp tục câu 🎣
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCaughtFish(null)}
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 700,
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================= */}
      {/* 8. TOAST THÔNG BÁO TIỆN ÍCH GAMEPLAY                              */}
      {/* ================================================================= */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4200}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="info"
          sx={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            '& .MuiAlert-icon': { color: '#38bdf8' },
          }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* ================================================================= */}
      {/* 9. ĐỒNG HỒ GIỜ CỐ ĐỊNH TOÀN THẾ GIỚI (GLOBAL WORLD CLOCK HUD)     */}
      {/* ================================================================= */}
      <Paper
        elevation={12}
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          px: 3,
          py: 1.2,
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          minWidth: { xs: 300, sm: 400 },
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 135 }}>
          {isNight ? (
            <DarkModeRoundedIcon sx={{ color: '#818cf8', fontSize: 20 }} />
          ) : (
            <WbSunnyRoundedIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
          )}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: 0.5 }}>
              {timeFormatted}
            </Typography>
            <Typography variant="caption" sx={{ color: isNight ? '#a5b4fc' : '#fde047', fontSize: '0.68rem', display: 'block' }}>
              {isNight ? '🌙 Ban đêm (City Lights)' : '☀️ Ban ngày (Sunny City)'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
          <Slider
            size="small"
            value={gameTime}
            min={0}
            max={24}
            step={0.1}
            sx={{
              pointerEvents: 'none',
              color: isNight ? '#818cf8' : '#fbbf24',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
            }}
          />
        </Box>
      </Paper>

      <ChatHUD />
    </Box>
  );
}
