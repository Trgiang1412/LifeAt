'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

export interface FashionAvatarRef {
  leftArm: THREE.Mesh | null;
  rightArm: THREE.Mesh | null;
  leftLeg: THREE.Group | null;
  rightLeg: THREE.Group | null;
  meshGroup: THREE.Group | null;
}

interface FashionAvatarProps {
  outfitColor?: string;
  hatColor?: string;
  scale?: number;
  isNpc?: boolean;
  avatarStyle?: 'streetwear' | 'suit' | 'casual' | 'sporty';
  hairColor?: string;
  accessory?: 'headphones' | 'crossbody_bag' | 'none';
}

/**
 * Avatar 3D phong cách game thời trang cao cấp (Zepeto / Shining Nikki / Fashion Metaverse)
 * Tỉ lệ người mẫu thanh mảnh, trang phục nhiều lớp (Layered fashion), giày sneaker đế dày,
 * tóc layer anime bồng bềnh, mắt long lanh và phụ kiện thời trang tinh tế.
 */
export const FashionAvatar = forwardRef<FashionAvatarRef, FashionAvatarProps>(function FashionAvatar(
  {
    outfitColor = '#38bdf8',
    hatColor = '#f59e0b',
    scale = 1.35,
    isNpc = false,
    avatarStyle = 'streetwear',
    hairColor = '#1e293b',
    accessory = 'headphones',
  },
  ref
) {
  const meshGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({
    get leftArm() {
      return leftArmRef.current;
    },
    get rightArm() {
      return rightArmRef.current;
    },
    get leftLeg() {
      return leftLegRef.current;
    },
    get rightLeg() {
      return rightLegRef.current;
    },
    get meshGroup() {
      return meshGroupRef.current;
    },
  }));

  const primaryColor = outfitColor || '#38bdf8';
  const accentColor = hatColor || '#f59e0b';
  const skinTone = '#ffedd5';

  return (
    <group ref={meshGroupRef} scale={[scale, scale, scale]}>
      {/* 1. BÓNG ĐỔ TRÒN MỊN DƯỚI CHÂN */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 20]} />
        <meshBasicMaterial color="#000000" opacity={0.32} transparent />
      </mesh>

      {/* 2. ĐÔI CHÂN & QUẦN FASHION & GIÀY SNEAKER ĐẾ DÀY */}
      <group position={[0, 0, 0]}>
        {/* CHÂN TRÁI */}
        <group ref={leftLegRef} position={[-0.13, 0.44, 0]}>
          {/* Quần jeans / Cargo pants thanh mảnh */}
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.38, 8, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.65} />
          </mesh>
          {/* Gấu quần bo thời trang */}
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.082, 0.082, 0.05, 14]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Giày Sneaker Designer đế Chunky Platform */}
          <group position={[0, -0.32, 0.05]}>
            {/* Đế giày cao su trắng có gờ rãnh */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <boxGeometry args={[0.16, 0.065, 0.28]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
            </mesh>
            {/* Thân giày da cao cấp phối màu theo outfit */}
            <mesh position={[0, 0.08, -0.01]} castShadow>
              <boxGeometry args={[0.15, 0.075, 0.25]} />
              <meshStandardMaterial color={primaryColor} roughness={0.35} />
            </mesh>
            {/* Mũi giày bọc cao su trắng */}
            <mesh position={[0, 0.06, 0.1]}>
              <cylinderGeometry args={[0.07, 0.075, 0.06, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Dây giày & Lưỡi gà */}
            <mesh position={[0, 0.11, 0.03]} rotation={[-Math.PI / 8, 0, 0]}>
              <boxGeometry args={[0.09, 0.02, 0.12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>

        {/* CHÂN PHẢI */}
        <group ref={rightLegRef} position={[0.13, 0.44, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.38, 8, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.65} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.082, 0.082, 0.05, 14]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <group position={[0, -0.32, 0.05]}>
            <mesh position={[0, 0.02, 0]} castShadow>
              <boxGeometry args={[0.16, 0.065, 0.28]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.08, -0.01]} castShadow>
              <boxGeometry args={[0.15, 0.075, 0.25]} />
              <meshStandardMaterial color={primaryColor} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.06, 0.1]}>
              <cylinderGeometry args={[0.07, 0.075, 0.06, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.11, 0.03]} rotation={[-Math.PI / 8, 0, 0]}>
              <boxGeometry args={[0.09, 0.02, 0.12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>
      </group>

      {/* 3. THÂN TRANG PHỤC NHIỀU LỚP (LAYERED FASHION TORSO) */}
      <group position={[0, 0.78, 0]}>
        {/* Thắt lưng thời trang kèm mặt khóa kim loại */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.185, 0.05, 18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.05, 0.185]}>
          <boxGeometry args={[0.06, 0.04, 0.02]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Áo thun / Top trong cao cấp */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <capsuleGeometry args={[0.185, 0.24, 8, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Áo khoác ngoài Streetwear Jacket / Blazer có cổ & viền sang trọng */}
        <mesh position={[0, 0.13, 0]} castShadow>
          <capsuleGeometry args={[0.205, 0.25, 8, 16]} />
          <meshStandardMaterial color={primaryColor} roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Đường khóa kéo kim loại & nẹp áo trước ngực */}
        <mesh position={[0, 0.12, 0.205]}>
          <boxGeometry args={[0.025, 0.28, 0.02]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Cổ áo bẻ thời trang / Lapels */}
        <mesh position={[-0.07, 0.25, 0.17]} rotation={[0, 0, -Math.PI / 8]}>
          <boxGeometry args={[0.08, 0.12, 0.03]} />
          <meshStandardMaterial color={accentColor} roughness={0.35} />
        </mesh>
        <mesh position={[0.07, 0.25, 0.17]} rotation={[0, 0, Math.PI / 8]}>
          <boxGeometry args={[0.08, 0.12, 0.03]} />
          <meshStandardMaterial color={accentColor} roughness={0.35} />
        </mesh>

        {/* Túi đeo chéo da thời thượng (Designer Crossbody Bag) */}
        <group position={[0.16, 0.02, 0.11]} rotation={[0, Math.PI / 8, -Math.PI / 14]}>
          {/* Dây đeo chéo qua ngực */}
          <mesh position={[-0.15, 0.14, 0]} rotation={[0, 0, Math.PI / 3.8]}>
            <boxGeometry args={[0.025, 0.46, 0.015]} />
            <meshStandardMaterial color="#451a03" roughness={0.4} />
          </mesh>
          {/* Túi xách da nhỏ xinh trên hông */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.15, 0.07]} />
            <meshStandardMaterial color="#78350f" roughness={0.35} />
          </mesh>
          {/* Khóa cài vàng kim loại */}
          <mesh position={[0, 0.02, 0.038]}>
            <boxGeometry args={[0.035, 0.03, 0.01]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* 4. TAY ÁO & ĐỒNG HỒ SMARTWATCH & BÀN TAY THANH THOÁT */}
      {/* TAY TRÁI */}
      <mesh ref={leftArmRef} position={[-0.26, 0.82, 0]} castShadow>
        {/* Tay áo khoác */}
        <capsuleGeometry args={[0.065, 0.26, 8, 14]} />
        <meshStandardMaterial color={primaryColor} roughness={0.3} />
        {/* Bo tay áo */}
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
        {/* Đồng hồ thông minh Smartwatch sang chảnh */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.035, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.15, 0.068]}>
          <boxGeometry args={[0.035, 0.035, 0.01]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>
        {/* Bàn tay */}
        <mesh position={[0, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
      </mesh>

      {/* TAY PHẢI */}
      <mesh ref={rightArmRef} position={[0.26, 0.82, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.26, 8, 14]} />
        <meshStandardMaterial color={primaryColor} roughness={0.3} />
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
      </mesh>

      {/* 5. CỔ & TAI NGHE WIRELESS THỜI THƯỢNG (HEADPHONES AROUND NECK) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 14]} />
        <meshStandardMaterial color={skinTone} roughness={0.4} />
      </mesh>

      {accessory === 'headphones' && (
        <group position={[0, 1.07, 0]}>
          {/* Vòng đệm tai nghe quanh cổ */}
          <mesh rotation={[Math.PI / 10, 0, 0]}>
            <torusGeometry args={[0.135, 0.022, 10, 20, Math.PI * 1.6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* 2 Củ tai nghe ốp kim loại 2 bên */}
          <mesh position={[-0.145, 0.02, 0.05]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 14]} />
            <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0.145, 0.02, 0.05]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 14]} />
            <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      )}

      {/* 6. ĐẦU & KHUÔN MẶT ANIME FASHION & TÓC LAYER BỒNG BỀNH */}
      <group position={[0, 1.25, 0]}>
        {/* Khuôn mặt thanh thoát có cằm nhỏ xinh */}
        <mesh castShadow>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color={skinTone} roughness={0.45} />
        </mesh>

        {/* 2 MẮT ANIME LONG LANH CÓ ĐỒNG TỬ & LONG LANH BẮT SÁNG */}
        {/* Mắt trái */}
        <group position={[-0.085, 0.02, 0.22]}>
          {/* Lòng trắng */}
          <mesh>
            <circleGeometry args={[0.038, 14]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Tròng mắt màu ngọc bích / hổ phách thời thượng */}
          <mesh position={[0, -0.003, 0.002]}>
            <circleGeometry args={[0.027, 14]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          {/* Đồng tử đen */}
          <mesh position={[0, -0.004, 0.004]}>
            <circleGeometry args={[0.016, 12]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          {/* Đốm sáng phản chiếu long lanh lớn */}
          <mesh position={[-0.008, 0.009, 0.006]}>
            <circleGeometry args={[0.009, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Đốm sáng phản chiếu phụ */}
          <mesh position={[0.01, -0.008, 0.006]}>
            <circleGeometry args={[0.005, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Hàng mi trên cong vút thời trang */}
          <mesh position={[0, 0.034, 0.003]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.07, 0.008, 0.002]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Mắt phải */}
        <group position={[0.085, 0.02, 0.22]}>
          <mesh>
            <circleGeometry args={[0.038, 14]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.003, 0.002]}>
            <circleGeometry args={[0.027, 14]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0, -0.004, 0.004]}>
            <circleGeometry args={[0.016, 12]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-0.008, 0.009, 0.006]}>
            <circleGeometry args={[0.009, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.01, -0.008, 0.006]}>
            <circleGeometry args={[0.005, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.034, 0.003]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.07, 0.008, 0.002]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* MÁ HỒNG BLUSH TƯƠI TẮN */}
        <mesh position={[-0.14, -0.04, 0.18]} rotation={[0, -Math.PI / 6, 0]}>
          <circleGeometry args={[0.036, 12]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0.14, -0.04, 0.18]} rotation={[0, Math.PI / 6, 0]}>
          <circleGeometry args={[0.036, 12]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>

        {/* NỤ CƯỜI TƯƠI CÓ ĐỘ BÓNG MÔI NHẸ */}
        <mesh position={[0, -0.065, 0.23]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.026, 0.006, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#be123c" />
        </mesh>

        {/* MÁI TÓC LAYER 3D BỒNG BỀNH (STYLISH LAYERED HAIRSTYLE) */}
        <group position={[0, 0.02, 0]}>
          {/* Khối tóc chính ôm đầu */}
          <mesh position={[0, 0.06, -0.03]} castShadow>
            <sphereGeometry args={[0.26, 18, 18]} />
            <meshStandardMaterial color={hairColor} roughness={0.7} />
          </mesh>
          {/* Mái ngố / Curtain bangs xéo phía trước */}
          <mesh position={[0, 0.17, 0.16]} rotation={[Math.PI / 8, 0, 0]}>
            <boxGeometry args={[0.24, 0.09, 0.1]} />
            <meshStandardMaterial color={hairColor} roughness={0.65} />
          </mesh>
          <mesh position={[-0.14, 0.05, 0.14]} rotation={[0, 0, Math.PI / 10]}>
            <capsuleGeometry args={[0.045, 0.18, 6, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.14, 0.05, 0.14]} rotation={[0, 0, -Math.PI / 10]}>
            <capsuleGeometry args={[0.045, 0.18, 6, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.65} />
          </mesh>
          {/* Lọn tóc sau bồng bềnh */}
          <mesh position={[0, -0.05, -0.16]} rotation={[-Math.PI / 12, 0, 0]}>
            <capsuleGeometry args={[0.13, 0.22, 8, 12]} />
            <meshStandardMaterial color={hairColor} roughness={0.75} />
          </mesh>
        </group>

        {/* MŨ NỒI / MŨ SNAPBACK THỜI TRANG ĐÍNH HUY HIỆU */}
        <group position={[0, 0.18, -0.01]} rotation={[-Math.PI / 16, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.11, 20]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>
          {/* Vành mũ thời thượng */}
          <mesh position={[0, -0.05, 0.18]} rotation={[Math.PI / 10, 0, 0]}>
            <boxGeometry args={[0.26, 0.02, 0.14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} />
          </mesh>
          {/* Huy hiệu kim loại trên mũ */}
          <mesh position={[0, 0.02, 0.23]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

