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

export interface FashionAvatarProps {
  outfitColor?: string;
  hatColor?: string;
  pantsColor?: string;
  shoeColor?: string;
  scale?: number;
  isNpc?: boolean;
  avatarStyle?: 'streetwear' | 'suit' | 'hoodie' | 'royal' | 'cyberpunk' | 'casual' | 'sporty';
  hatStyle?: 'snapback' | 'crown' | 'cat_ears' | 'halo' | 'beret' | 'none';
  hairColor?: string;
  accessory?:
    | 'headphones'
    | 'crossbody_bag'
    | 'angel_wings'
    | 'cyber_wings'
    | 'guitar_back'
    | 'sunglasses'
    | 'none';
}

/**
 * Avatar 3D phong cách game thời trang cao cấp (Zepeto / Shining Nikki / Fashion Metaverse)
 * Hỗ trợ Tự Phối Đồ (Mix & Match): Kiểu áo, màu áo, màu quần, màu giày, kiểu mũ (Vương miện, Tai mèo,
 * Vòng hào quang, Mũ nồi Beret, Snapback, Không đội mũ), màu tóc và Phụ kiện (Cánh thiên thần, Cánh Cyber,
 * Đàn Guitar đeo lưng, Kính râm, Tai nghe DJ, Túi đeo chéo).
 */
export const FashionAvatar = forwardRef<FashionAvatarRef, FashionAvatarProps>(function FashionAvatar(
  {
    outfitColor = '#38bdf8',
    hatColor = '#f59e0b',
    pantsColor = '#1e293b',
    shoeColor = '#ffffff',
    scale = 1.35,
    isNpc = false,
    avatarStyle = 'streetwear',
    hatStyle = 'snapback',
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
  const legPantsColor = pantsColor || '#1e293b';
  const sneakerColor = shoeColor || primaryColor;
  const skinTone = '#ffedd5';
  const isMetallicOutfit = avatarStyle === 'royal' || avatarStyle === 'cyberpunk';

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
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.38, 8, 14]} />
            <meshStandardMaterial color={legPantsColor} roughness={0.6} />
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
              <meshStandardMaterial color={sneakerColor} roughness={0.3} metalness={0.15} />
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

        {/* CHÂN PHẢI */}
        <group ref={rightLegRef} position={[0.13, 0.44, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.38, 8, 14]} />
            <meshStandardMaterial color={legPantsColor} roughness={0.6} />
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
              <meshStandardMaterial color={sneakerColor} roughness={0.3} metalness={0.15} />
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

        {/* Áo sơ mi / thun bên trong */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <capsuleGeometry args={[0.185, 0.24, 8, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Áo khoác ngoài theo kiểu dáng (Streetwear / Suit / Hoodie / Royal / Cyberpunk) */}
        <mesh position={[0, 0.13, 0]} castShadow>
          <capsuleGeometry args={[0.205, 0.25, 8, 16]} />
          <meshStandardMaterial
            color={primaryColor}
            roughness={isMetallicOutfit ? 0.18 : 0.32}
            metalness={isMetallicOutfit ? 0.65 : 0.12}
          />
        </mesh>

        {/* Nếu là kiểu Suit / Học viện: Thêm Cà vạt lụa sang trọng trước ngực */}
        {avatarStyle === 'suit' && (
          <mesh position={[0, 0.14, 0.21]}>
            <boxGeometry args={[0.042, 0.22, 0.015]} />
            <meshStandardMaterial color={accentColor} roughness={0.3} />
          </mesh>
        )}

        {/* Nếu là kiểu Cyberpunk: Dải đèn LED Neon phát sáng dọc thân áo */}
        {avatarStyle === 'cyberpunk' && (
          <>
            <mesh position={[-0.09, 0.13, 0.19]}>
              <boxGeometry args={[0.018, 0.26, 0.018]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0.09, 0.13, 0.19]}>
              <boxGeometry args={[0.018, 0.26, 0.018]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.5} />
            </mesh>
          </>
        )}

        {/* Nếu là kiểu Hoàng Gia (Royal): Cầu vai tua rua vàng kim + Áo choàng lụa đỏ phía sau */}
        {avatarStyle === 'royal' && (
          <>
            <mesh position={[-0.22, 0.26, 0]}>
              <boxGeometry args={[0.11, 0.05, 0.14]} />
              <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0.22, 0.26, 0]}>
              <boxGeometry args={[0.11, 0.05, 0.14]} />
              <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.02, -0.19]} rotation={[0.12, 0, 0]} castShadow>
              <boxGeometry args={[0.38, 0.56, 0.025]} />
              <meshStandardMaterial color="#be123c" roughness={0.45} />
            </mesh>
          </>
        )}

        {/* Đường khóa kéo kim loại & cổ áo bẻ */}
        {avatarStyle !== 'suit' && (
          <mesh position={[0, 0.12, 0.205]}>
            <boxGeometry args={[0.025, 0.28, 0.02]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
          </mesh>
        )}
        <mesh position={[-0.07, 0.25, 0.17]} rotation={[0, 0, -Math.PI / 8]}>
          <boxGeometry args={[0.08, 0.12, 0.03]} />
          <meshStandardMaterial color={accentColor} roughness={0.35} />
        </mesh>
        <mesh position={[0.07, 0.25, 0.17]} rotation={[0, 0, Math.PI / 8]}>
          <boxGeometry args={[0.08, 0.12, 0.03]} />
          <meshStandardMaterial color={accentColor} roughness={0.35} />
        </mesh>

        {/* PHỤ KIỆN 1: Túi đeo chéo da thời thượng (crossbody_bag hoặc mặc định streetwear) */}
        {(accessory === 'crossbody_bag' || accessory === 'headphones') && (
          <group position={[0.16, 0.02, 0.11]} rotation={[0, Math.PI / 8, -Math.PI / 14]}>
            <mesh position={[-0.15, 0.14, 0]} rotation={[0, 0, Math.PI / 3.8]}>
              <boxGeometry args={[0.025, 0.46, 0.015]} />
              <meshStandardMaterial color="#451a03" roughness={0.4} />
            </mesh>
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.15, 0.07]} />
              <meshStandardMaterial color="#78350f" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.02, 0.038]}>
              <boxGeometry args={[0.035, 0.03, 0.01]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        )}

        {/* PHỤ KIỆN 2: ĐÔI CÁNH THIÊN THẦN LÔNG VŨ TRẮNG (angel_wings) */}
        {accessory === 'angel_wings' && (
          <group position={[0, 0.2, -0.18]}>
            {[-1, 1].map((dir) => (
              <group
                key={dir}
                position={[dir * 0.14, 0.05, 0]}
                rotation={[0, -dir * 0.35, dir * 0.28]}
              >
                <mesh position={[dir * 0.18, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.18, 0.035]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#fef08a"
                    emissiveIntensity={0.25}
                    roughness={0.3}
                  />
                </mesh>
                <mesh position={[dir * 0.14, -0.02, 0]} castShadow>
                  <boxGeometry args={[0.28, 0.14, 0.03]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
                <mesh position={[dir * 0.08, -0.14, 0]} castShadow>
                  <boxGeometry args={[0.18, 0.12, 0.025]} />
                  <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* PHỤ KIỆN 3: ĐÔI CÁNH CƠ GIỚI CYBER NEON (cyber_wings) */}
        {accessory === 'cyber_wings' && (
          <group position={[0, 0.22, -0.19]}>
            {[-1, 1].map((dir) => (
              <group
                key={dir}
                position={[dir * 0.12, 0.04, 0]}
                rotation={[0, -dir * 0.3, dir * 0.35]}
              >
                <mesh position={[dir * 0.22, 0.1, 0]}>
                  <boxGeometry args={[0.44, 0.07, 0.025]} />
                  <meshStandardMaterial
                    color="#06b6d4"
                    emissive="#06b6d4"
                    emissiveIntensity={1.4}
                  />
                </mesh>
                <mesh position={[dir * 0.18, -0.03, 0]}>
                  <boxGeometry args={[0.34, 0.06, 0.025]} />
                  <meshStandardMaterial
                    color="#ec4899"
                    emissive="#ec4899"
                    emissiveIntensity={1.4}
                  />
                </mesh>
                <mesh position={[dir * 0.12, -0.14, 0]}>
                  <boxGeometry args={[0.24, 0.05, 0.025]} />
                  <meshStandardMaterial
                    color="#a855f7"
                    emissive="#a855f7"
                    emissiveIntensity={1.3}
                  />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* PHỤ KIỆN 4: ĐÀN GUITAR GỖ ĐEO SAU LƯNG (guitar_back) */}
        {accessory === 'guitar_back' && (
          <group position={[0.02, 0.15, -0.22]} rotation={[0, 0, -Math.PI / 5]}>
            {/* Thùng đàn Guitar gỗ */}
            <mesh position={[0, -0.08, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.18, 0.07, 16]} />
              <meshStandardMaterial color="#b45309" roughness={0.4} />
            </mesh>
            {/* Lỗ thoát âm */}
            <mesh position={[0, -0.08, -0.038]}>
              <cylinderGeometry args={[0.05, 0.05, 0.01, 12]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Cần đàn Guitar */}
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.045, 0.42, 0.03]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          </group>
        )}
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

        {/* KÍNH RÂM THỜI THƯỢNG (sunglasses) */}
        {accessory === 'sunglasses' && (
          <group position={[0, 0.025, 0.235]}>
            <mesh position={[-0.085, 0, 0]}>
              <boxGeometry args={[0.095, 0.055, 0.015]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.1} />
            </mesh>
            <mesh position={[0.085, 0, 0]}>
              <boxGeometry args={[0.095, 0.055, 0.015]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.06, 0.012, 0.015]} />
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </mesh>
          </group>
        )}

        {/* MŨ / NÓN / VƯƠNG MIỆN / TAI MÈO / VÒNG HÀO QUANG (MIX & MATCH HEADWEAR) */}
        {hatStyle === 'snapback' && (
          <group position={[0, 0.18, -0.01]} rotation={[-Math.PI / 16, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.11, 20]} />
              <meshStandardMaterial color={accentColor} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={accentColor} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.05, 0.18]} rotation={[Math.PI / 10, 0, 0]}>
              <boxGeometry args={[0.26, 0.02, 0.14]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.02, 0.23]}>
              <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {hatStyle === 'beret' && (
          <group position={[0.03, 0.21, -0.02]} rotation={[0.1, 0, -0.18]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.22, 0.09, 20]} />
              <meshStandardMaterial color={accentColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        )}

        {hatStyle === 'crown' && (
          <group position={[0, 0.24, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.17, 0.15, 0.11, 16]} />
              <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i * Math.PI) / 3;
              return (
                <mesh
                  key={i}
                  position={[Math.sin(ang) * 0.15, 0.09, Math.cos(ang) * 0.15]}
                >
                  <coneGeometry args={[0.035, 0.08, 6]} />
                  <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.15} />
                </mesh>
              );
            })}
            <mesh position={[0, 0, 0.16]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {hatStyle === 'cat_ears' && (
          <group position={[0, 0.22, 0.02]}>
            {[-0.14, 0.14].map((x, idx) => (
              <group key={idx} position={[x, 0.04, 0]} rotation={[0, 0, idx === 0 ? 0.32 : -0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.08, 0.16, 4]} />
                  <meshStandardMaterial color={accentColor} roughness={0.35} />
                </mesh>
                <mesh position={[0, -0.01, 0.035]}>
                  <coneGeometry args={[0.045, 0.11, 4]} />
                  <meshStandardMaterial
                    color="#fbcfe8"
                    emissive="#f472b6"
                    emissiveIntensity={0.6}
                  />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {hatStyle === 'halo' && (
          <group position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.19, 0.024, 12, 28]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={1.6}
              />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
});

