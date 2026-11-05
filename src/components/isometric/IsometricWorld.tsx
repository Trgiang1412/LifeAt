'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, KeyboardControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Typography, Slider, IconButton, Paper, Tooltip, Chip } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';

import './BuildingFacadeMaterial';
import StreetLamp from './StreetLamp';
import PlayerPhysics from './PlayerPhysics';
import NPC from './NPC';
import RemotePlayer from './RemotePlayer';
import ChatHUD from './ChatHUD';
import useDayNightCycle from '@/stores/useDayNightCycle';
import useMultiplayerStore from '@/stores/useMultiplayerStore';

/**
 * Bản đồ ánh xạ phím điều khiển bàn phím (WASD & Phím Mũi Tên & Phím E)
 */
export const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'interact', keys: ['KeyE'] },
];

/**
 * Khối nhà đơn thể tối ưu hóa tuyệt đối:
 * Toàn bộ cửa sổ được phân chia và chiếu sáng bằng ShaderMaterial trên 1 khối Mesh duy nhất (1 Draw Call).
 * Đồng thời tích hợp RigidBody Fixed để ngăn người chơi đi xuyên qua tường.
 */
function ShaderBuilding({
  position,
  size,
  gridRepeat,
  wallColor = '#1e2230',
  litColor = '#ffaa33',
}: {
  position: [number, number, number];
  size: [number, number, number];
  gridRepeat: [number, number];
  wallColor?: string;
  litColor?: string;
}) {
  const matRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (matRef.current) {
      const nightMix = useDayNightCycle.getState().nightMix;
      matRef.current.uNightMix = nightMix;
      matRef.current.uTime += delta;
    }
  });

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position[0], position[1] + size[1] / 2, position[2]]}
      friction={0}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        {/* Custom Shader Material: 1 Draw Call duy nhất chứa toàn bộ cửa sổ */}
        <buildingFacadeMaterial
          ref={matRef}
          uGridRepeat={new THREE.Vector2(gridRepeat[0], gridRepeat[1])}
          uWindowPadding={new THREE.Vector2(0.2, 0.22)}
          uNightMix={0.0}
          uWallColor={new THREE.Color(wallColor)}
          uWindowDayColor={new THREE.Color('#10121a')}
          uWindowLitColor={new THREE.Color(litColor)}
          uTime={0.0}
          toneMapped={false}
        />
      </mesh>
    </RigidBody>
  );
}

/**
 * Cụm chiếu sáng tự động quay theo quỹ đạo ngày đêm
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
      <ambientLight ref={ambientRef} color="#ffffff" intensity={0.65} />
      <directionalLight
        ref={lightRef}
        position={[20, 30, 20]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={-50}
        shadow-camera-far={120}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
    </>
  );
}

/**
 * Mặt đất & quy hoạch đô thị 2.5D Isometric (Mặt đường, vỉa hè, cây xanh)
 * Tích hợp RigidBody mặt sàn cố định chống xuyên lọt
 */
function CityGround() {
  return (
    <group position={[0, 0, 0]}>
      {/* Sàn vật lý chính (Chống rơi xuyên đất) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]} friction={0}>
        <mesh receiveShadow>
          <boxGeometry args={[60, 0.5, 60]} />
          <meshStandardMaterial color="#1a1d29" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Lòng đường nhựa Asphalt (Trục X) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 4.2]} />
        <meshStandardMaterial color="#222530" roughness={0.7} />
      </mesh>

      {/* Vạch kẻ đường đứt nét ban đêm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[60, 0.15]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} />
      </mesh>

      {/* Lòng đường giao cắt (Trục Z) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[4.2, 60]} />
        <meshStandardMaterial color="#222530" roughness={0.7} />
      </mesh>

      {/* Vỉa hè khu phố A */}
      <mesh position={[-6.5, 0.1, -6.5]} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color="#2f3447" roughness={0.8} />
      </mesh>

      {/* Vỉa hè khu phố B (Khu tài chính cao ốc) */}
      <mesh position={[6.5, 0.1, -6.5]} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color="#2f3447" roughness={0.8} />
      </mesh>

      {/* Vỉa hè khu phố C (Khu nhà ở ngoại ô) */}
      <mesh position={[-6.5, 0.1, 6.5]} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color="#2f3447" roughness={0.8} />
      </mesh>

      {/* Vỉa hè khu phố D (Khu cafe & công viên) */}
      <mesh position={[6.5, 0.1, 6.5]} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color="#2f3447" roughness={0.8} />
      </mesh>

      {/* Thảm cỏ công viên góc D */}
      <mesh position={[6.5, 0.21, 6.5]} receiveShadow>
        <boxGeometry args={[7.8, 0.05, 7.8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>

      {/* Tường biên vô hình giữ người chơi trong bản đồ */}
      <RigidBody type="fixed" colliders={false} position={[0, 2, -28]}>
        <CuboidCollider args={[30, 4, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 2, 28]}>
        <CuboidCollider args={[30, 4, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[-28, 2, 0]}>
        <CuboidCollider args={[1, 4, 30]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[28, 2, 0]}>
        <CuboidCollider args={[1, 4, 30]} />
      </RigidBody>
    </group>
  );
}

/**
 * Cây cối Low-poly trang trí
 */
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.0, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <dodecahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Toàn bộ quần thể thành phố Isometric 2.5D
 */
function CityScene({ onInteractNPC }: { onInteractNPC?: (npcId: string) => void }) {
  const remotePlayers = useMultiplayerStore((state) => state.remotePlayers);

  return (
    <>
      <DynamicSunLight />
      <CityGround />

      {/* ============================================================== */}
      {/* CÁC TÒA NHÀ KHU CAO ỐC - 100% ShaderFacade (1 Draw Call/khối) */}
      {/* ============================================================== */}
      {/* Tòa tháp trung tâm 1 (London Tower) */}
      <ShaderBuilding
        position={[-6.5, 0.2, -6.5]}
        size={[4.5, 12.0, 4.5]}
        gridRepeat={[4, 12]}
        wallColor="#1c2130"
        litColor="#ffaa33"
      />

      {/* Tòa cao ốc kính tài chính 2 */}
      <ShaderBuilding
        position={[6.5, 0.2, -7.5]}
        size={[4.0, 9.5, 3.8]}
        gridRepeat={[4, 9]}
        wallColor="#242b3d"
        litColor="#38bdf8"
      />

      {/* Tòa nhà chung cư 3 */}
      <ShaderBuilding
        position={[6.5, 0.2, -3.5]}
        size={[3.8, 6.0, 3.2]}
        gridRepeat={[3, 6]}
        wallColor="#2d3748"
        litColor="#f59e0b"
      />

      {/* London Focus Cafe (Khu phố D) */}
      <ShaderBuilding
        position={[4.0, 0.2, 5.0]}
        size={[2.8, 3.2, 3.0]}
        gridRepeat={[3, 3]}
        wallColor="#3b2d20"
        litColor="#ffedd5"
      />

      {/* Oxford English Academy (Khu phố C) */}
      <ShaderBuilding
        position={[-6.5, 0.2, 6.5]}
        size={[5.0, 4.5, 4.5]}
        gridRepeat={[5, 4]}
        wallColor="#1e293b"
        litColor="#ec4899"
      />

      {/* ============================================================== */}
      {/* HỆ THỐNG ĐÈN ĐƯỜNG EMISSIVE + POINTLIGHT BAN ĐÊM               */}
      {/* ============================================================== */}
      <StreetLamp position={[-2.4, 0.2, -2.5]} rotationY={0} />
      <StreetLamp position={[-2.4, 0.2, 2.5]} rotationY={0} />
      <StreetLamp position={[2.4, 0.2, -2.5]} rotationY={Math.PI} />
      <StreetLamp position={[2.4, 0.2, 2.5]} rotationY={Math.PI} />
      <StreetLamp position={[-6.5, 0.2, -2.4]} rotationY={Math.PI / 2} />
      <StreetLamp position={[6.5, 0.2, -2.4]} rotationY={Math.PI / 2} />
      <StreetLamp position={[-6.5, 0.2, 2.4]} rotationY={-Math.PI / 2} />
      <StreetLamp position={[6.5, 0.2, 2.4]} rotationY={-Math.PI / 2} />

      {/* Cây xanh công viên */}
      <Tree position={[8.5, 0.2, 8.5]} />
      <Tree position={[5.0, 0.2, 8.5]} />
      <Tree position={[8.5, 0.2, 5.0]} />
      <Tree position={[-3.5, 0.2, 8.5]} />

      {/* ============================================================== */}
      {/* GAMEPLAY: NGƯỜI CHƠI VẬT LÝ & NPC HỘI THOẠI                    */}
      {/* ============================================================== */}
      {/* Người chơi di chuyển WASD, góc xoay 45 độ, camera follow */}
      <PlayerPhysics initialPosition={[0, 1.0, 0]} />

      {/* ============================================================== */}
      {/* MULTIPLAYER: DANH SÁCH NGƯỜI CHƠI KHÁC TRONG THẾ GIỚI         */}
      {/* ============================================================== */}
      {Array.from(remotePlayers.values()).map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}

      {/* NPC Emma (Barista quán Cafe London) */}
      <NPC
        id="NPC_EMMA_LONDON_CAFE"
        name="Emma"
        role="London Cafe Barista (CEFR A2)"
        position={[2.4, 0.2, 3.2]}
        rotationY={-Math.PI / 4}
        badgeColor="#f59e0b"
        onInteract={() => onInteractNPC?.('NPC_EMMA_LONDON_CAFE')}
      />

      {/* NPC Alex (Giám khảo Oxford Academy) */}
      <NPC
        id="NPC_ALEX_ACADEMY"
        name="Alex"
        role="Oxford Examiner (CEFR B1)"
        position={[-3.6, 0.2, 4.2]}
        rotationY={Math.PI / 3}
        badgeColor="#34d399"
        onInteract={() => onInteractNPC?.('NPC_ALEX_ACADEMY')}
      />
    </>
  );
}

interface IsometricWorldProps {
  onOpenDialogue?: (npcId: string) => void;
}

/**
 * Component chính IsometricWorld hoàn chỉnh tích hợp Rapier Physics & Gameplay
 */
export default function IsometricWorld({ onOpenDialogue }: IsometricWorldProps) {
  const { gameTime, isNight, isPlaying, setTime, togglePlayPause } = useDayNightCycle();
  const connect = useMultiplayerStore((state) => state.connect);
  const disconnect = useMultiplayerStore((state) => state.disconnect);

  // Kết nối Socket.io khi mount và cleanup khi unmount để chống rò rỉ socket connection
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Định dạng hiển thị giờ: HH:MM
  const hours = Math.floor(gameTime);
  const minutes = Math.floor((gameTime - hours) * 60);
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: '620px', overflow: 'hidden' }}>
      {/* Hướng dẫn thao tác Gameplay HUD ở góc trên */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: '8px 16px',
          borderRadius: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <SportsEsportsRoundedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
        <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
          Phím <strong>W / A / S / D</strong> di chuyển • Đến gần NPC ấn <strong>[E]</strong> để trò chuyện
        </Typography>
        <Chip
          label="Rapier Physics"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.62rem',
            fontWeight: 700,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        />
      </Box>

      {/* Bao bọc KeyboardControls từ @react-three/drei để PlayerPhysics đọc phím */}
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          {/* Camera: OrthographicCamera góc chuẩn Isometric 2.5D */}
          <OrthographicCamera
            makeDefault
            position={[20, 20, 20]}
            zoom={45}
            near={-100}
            far={500}
          />

          {/* Hệ thống vật lý Rapier 3D */}
          <Physics gravity={[0, -22.0, 0]}>
            <CityScene onInteractNPC={onOpenDialogue} />
          </Physics>

          {/* Hậu kỳ EffectComposer với Bloom */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.85}
              luminanceSmoothing={0.15}
              intensity={1.2}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </KeyboardControls>

      {/* Bảng điều khiển chu kỳ ngày đêm (Day/Night Scrubber HUD Overlay) */}
      <Paper
        elevation={12}
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          px: 3,
          py: 1.5,
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          minWidth: { xs: 320, sm: 460 },
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Nút Play/Pause chu kỳ */}
        <Tooltip title={isPlaying ? 'Tạm dừng chu kỳ ngày đêm' : 'Tiếp tục chu kỳ ngày đêm'}>
          <IconButton
            size="small"
            onClick={togglePlayPause}
            sx={{
              backgroundColor: isPlaying ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: isPlaying ? '#38bdf8' : '#cbd5e1',
              '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.35)' },
            }}
          >
            {isPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </IconButton>
        </Tooltip>

        {/* Hiển thị giờ & Biểu tượng Ngày / Đêm */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 130 }}>
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
              {isNight ? '🌙 Ban đêm (Bloom)' : '☀️ Ban ngày'}
            </Typography>
          </Box>
        </Box>

        {/* Thanh trượt Scrubber điều chỉnh giờ game từ 0.0 đến 24.0 */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
          <Slider
            size="small"
            value={gameTime}
            min={0}
            max={24}
            step={0.1}
            onChange={(_, val) => setTime(Array.isArray(val) ? val[0] : val)}
            sx={{
              color: isNight ? '#818cf8' : '#fbbf24',
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
              },
            }}
          />
        </Box>
      </Paper>

      {/* 
        Thanh nhập Chat HUD cố định ở góc dưới màn hình
        Cho phép người chơi giao tiếp tiếng Anh trực tuyến và hiển thị bong bóng thoại 3D
      */}
      <ChatHUD />
    </Box>
  );
}
