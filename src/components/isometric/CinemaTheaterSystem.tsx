'use client';

import React, { useState } from 'react';
import { Html } from './SafeHtml';
import { KeyPromptBadge } from './KeyPromptBadge';
import { FashionAvatar } from './FashionAvatar';
import useMultiplayerStore from '@/stores/useMultiplayerStore';
import RemotePlayer from './RemotePlayer';

export interface CinemaMovieItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  youtubeId: string;
  badgeColor: string;
  description: string;
}

/**
 * Danh sách Phim Điện Ảnh 3D, Hoạt Hình Luyện Tiếng Anh & Giải Trí chiếu tại GRAND IMAX CINEMA
 * (Người chơi cũng có thể tự dán bất kỳ link YouTube nào để chiếu trực tiếp lên màn hình rạp)
 */
export const CINEMA_YOUTUBE_MOVIES: CinemaMovieItem[] = [
  {
    id: 'movie_spring',
    title: 'Spring — Blender Open Movie (Phim Hoạt Hình 3D Fantasy)',
    category: '🎬 Phim 3D Bom Tấn',
    duration: '08:00',
    youtubeId: 'WhWc3b3KhnY',
    badgeColor: '#e11d48',
    description: 'Siêu phẩm hoạt hình 3D thần thoại về cô gái chăn cừu và linh hồn rừng cổ đại.',
  },
  {
    id: 'movie_wing_it',
    title: 'Wing It! — Blender Studio (Phim Hoạt Hình Hài Hước)',
    category: '🎬 Phim Hoạt Hình',
    duration: '04:00',
    youtubeId: 'u9lj-c29dxI',
    badgeColor: '#f59e0b',
    description: 'Chú mèo kỹ sư tìm mọi cách chế tạo tàu vũ trụ bay lên không trung.',
  },
  {
    id: 'movie_charge',
    title: 'CHARGE — Sci-Fi Action Short Film (Hành Động Viễn Tưởng)',
    category: '⚡ Hành Động Sci-Fi',
    duration: '04:30',
    youtubeId: 'UXqq0ZvbOnk',
    badgeColor: '#0284c7',
    description: 'Phim ngắn hành động Cyberpunk chất lượng điện ảnh IMAX cực mãn nhãn.',
  },
  {
    id: 'movie_sprite_fright',
    title: 'Sprite Fright — English Comedy Animation (Có Phụ Đề Tiếng Anh)',
    category: '🇬🇧 Luyện Nghe Tiếng Anh',
    duration: '10:30',
    youtubeId: '_cMxraX_5RE',
    badgeColor: '#10b981',
    description: 'Nhóm học sinh Anh Quốc cắm trại trong rừng sâu — hội thoại tiếng Anh chuẩn British.',
  },
  {
    id: 'movie_caminandes',
    title: 'Caminandes 3: Llamigos — Pixar-Style 3D Comedy',
    category: '🍿 Hài Gia Đình',
    duration: '02:30',
    youtubeId: 'SkVqJ1SGeL0',
    badgeColor: '#8b5cf6',
    description: 'Cuộc chiến giành những quả dâu đỏ cuối cùng giữa lạc đà Koro và chim cánh cụt.',
  },
  {
    id: 'movie_lofi_cinema',
    title: 'Lofi Hip Hop Radio — Chill Beats to Relax & Study English',
    category: '🎵 Nhạc Chill Rạp Phim',
    duration: 'LIVE',
    youtubeId: 'jfKfPfyJRdk',
    badgeColor: '#ec4899',
    description: 'Không gian âm nhạc Lofi thư giãn cùng bạn bè trong rạp chiếu phim.',
  },
];

/**
 * Tách YouTube Video ID từ bất kỳ định dạng URL YouTube nào (watch?v=, youtu.be/, shorts/, embed/)
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Nếu người dùng nhập trực tiếp ID 11 ký tự
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').split('/')[0];
      return id && id.length >= 8 ? id : null;
    }
    if (url.hostname.includes('youtube.com')) {
      const vParam = url.searchParams.get('v');
      if (vParam) return vParam;
      const parts = url.pathname.split('/').filter(Boolean);
      if (
        (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') &&
        parts[1]
      ) {
        return parts[1];
      }
    }
  } catch {
    // Fallback regex nếu chuỗi không có https://
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match && match[1]) return match[1];
  }
  return null;
}

// Bố cục ghế sofa nhung đỏ rạp chiếu phim (3 hàng x 3 cụm ghế = 27 ghế VIP hướng lên màn chiếu)
const CINEMA_SEAT_ROWS: Array<{ z: number; yStep: number; rowLabel: string }> = [
  { z: -2.2, yStep: 0.0, rowLabel: 'Hàng A (Gần màn chiếu)' },
  { z: 1.5, yStep: 0.22, rowLabel: 'Hàng B (Trung tâm VIP)' },
  { z: 5.2, yStep: 0.44, rowLabel: 'Hàng C (Sweetbox Đôi)' },
];

/**
 * Không gian 3D bên trong Rạp Chiếu Phim GRAND IMAX CINEMA
 */
export function Cinema3DScene({
  isLightsDimmed,
  hasTicket,
  onOpenTicketBox,
}: {
  isLightsDimmed: boolean;
  hasTicket: boolean;
  onOpenTicketBox: () => void;
}) {
  const remotePlayers = useMultiplayerStore((state) => state.remotePlayers);
  const remotePlayerList = Array.from(remotePlayers.values());

  return (
    <group>
      {/* 1. SÀN THẢM NHUNG TỐI RẠP PHIM & THẢM ĐỎ LỐI ĐI CÓ ĐÈN LED DẪN ĐƯỜNG */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31.6, 25.6]} />
        <meshStandardMaterial color="#090d16" roughness={0.85} />
      </mesh>

      {/* Thảm đỏ trung tâm dẫn từ cửa vào thẳng sân khấu màn chiếu */}
      <mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 21.0]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.75} />
      </mesh>

      {/* Dải đèn LED vàng dẫn lối hai bên thảm đỏ rạp chiếu phim */}
      {[-1.75, 1.75].map((lx, idx) => (
        <mesh
          key={idx}
          position={[lx, 0.03, 1.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.08, 21.0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={isLightsDimmed ? 0.6 : 1.3}
          />
        </mesh>
      ))}

      {/* Ánh sáng hắt từ màn chiếu IMAX xuống khán phòng */}
      <pointLight
        position={[0, 5.2, -7.5]}
        intensity={hasTicket ? 2.6 : 1.2}
        distance={28}
        color={hasTicket ? '#60a5fa' : '#fef08a'}
      />

      {/* 2. SÂN KHẤU & KHUNG MÀN CHIẾU ĐẠI RẠP IMAX TRÊN TƯỜNG BẮC */}
      <group position={[0, 0, -9.8]}>
        {/* Bục sân khấu rạp phim */}
        <mesh position={[0, 0.25, 0.5]} receiveShadow castShadow>
          <boxGeometry args={[22.0, 0.5, 3.2]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Dải đèn LED viền sân khấu */}
        <mesh position={[0, 0.48, 2.08]}>
          <boxGeometry args={[21.8, 0.06, 0.08]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={1.4}
          />
        </mesh>

        {/* Rèm nhung đỏ hai bên cánh gà sân khấu IMAX */}
        {[-10.2, 10.2].map((cx, i) => (
          <mesh key={i} position={[cx, 3.4, -1.8]} castShadow>
            <boxGeometry args={[2.2, 6.4, 0.45]} />
            <meshStandardMaterial color="#991b1b" roughness={0.7} />
          </mesh>
        ))}

        {/* Khung màn ảnh rộng IMAX 3D (Nền đỡ cho màn chiếu YouTube) */}
        <group position={[0, 3.7, -2.2]}>
          <mesh castShadow>
            <boxGeometry args={[17.6, 5.6, 0.28]} />
            <meshStandardMaterial color="#09090b" metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <planeGeometry args={[16.8, 5.0]} />
            <meshStandardMaterial
              color={hasTicket ? '#020617' : '#1e1b4b'}
              emissive={hasTicket ? '#1d4ed8' : '#312e81'}
              emissiveIntensity={0.45}
            />
          </mesh>
        </group>

        {/* 2 Tháp Loa Dolby Atmos IMAX hai bên màn chiếu */}
        {[-9.8, 9.8].map((sx, i) => (
          <group key={i} position={[sx, 2.2, -1.1]}>
            <mesh castShadow>
              <boxGeometry args={[1.1, 3.4, 0.9]} />
              <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
            </mesh>
            {[-0.9, 0, 0.9].map((sy, j) => (
              <mesh key={j} position={[0, sy, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 0.06, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 3. QUẦY BÁN VÉ XEM PHIM & BẮP RANG BƠ (Bên trái sảnh rạp) */}
      <group position={[-11.8, 0, 8.2]} rotation={[0, Math.PI / 6, 0]}>
        <mesh
          position={[0, 0.65, 0]}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onOpenTicketBox();
          }}
        >
          <boxGeometry args={[4.2, 1.3, 1.5]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.34, 0]}>
          <boxGeometry args={[4.4, 0.1, 1.7]} />
          <meshStandardMaterial color="#fef08a" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Máy nổ bắp rang bơ kính trong suốt */}
        <mesh position={[-1.1, 1.9, 0]} castShadow>
          <boxGeometry args={[0.9, 1.0, 0.8]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Nhân viên bán vé & bắp nước */}
        <group position={[0.4, 0, -1.2]}>
          <FashionAvatar
            outfitColor="#dc2626"
            hatColor="#fbbf24"
            pantsColor="#0f172a"
            scale={1.32}
            isNpc={true}
            avatarStyle="suit"
            hatStyle="beret"
          />
          <KeyPromptBadge
            keyLabel="E"
            position={[0, 2.35, 0]}
            color="#f59e0b"
            onClick={onOpenTicketBox}
          />
        </group>
      </group>

      {/* 4. HỆ THỐNG GHẾ SOFA NHUNG ĐỎ RẠP CHIẾU PHIM (3 HÀNG GHẾ VIP) */}
      {CINEMA_SEAT_ROWS.map((row, rIdx) => (
        <group key={rIdx} position={[0, row.yStep, row.z]}>
          {/* Bục nâng bậc thang cho hàng ghế sau cao hơn hàng ghế trước */}
          {row.yStep > 0 && (
            <mesh position={[0, -row.yStep / 2, 0]} receiveShadow>
              <boxGeometry args={[22.0, row.yStep, 2.6]} />
              <meshStandardMaterial color="#111827" roughness={0.8} />
            </mesh>
          )}

          {/* 3 Cụm ghế (Trái - Giữa - Phải), mỗi cụm 3 ghế đôi */}
          {[-7.2, 0, 7.2].map((clusterX, cIdx) => (
            <group key={cIdx} position={[clusterX, 0, 0]}>
              {[-1.5, 0, 1.5].map((seatX, sIdx) => (
                <group
                  key={sIdx}
                  position={[seatX, 0, 0]}
                  rotation={[0, Math.PI, 0]}
                >
                  {/* Đệm ngồi nhung đỏ */}
                  <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.15, 0.28, 0.95]} />
                    <meshStandardMaterial color="#b91c1c" roughness={0.55} />
                  </mesh>
                  {/* Tựa lưng ghế cao êm ái */}
                  <mesh position={[0, 0.92, -0.38]} castShadow>
                    <boxGeometry args={[1.12, 0.95, 0.22]} />
                    <meshStandardMaterial color="#991b1b" roughness={0.5} />
                  </mesh>
                  {/* Tay vịn 2 bên có khay để ly nước */}
                  {[-0.58, 0.58].map((ax, aIdx) => (
                    <mesh key={aIdx} position={[ax, 0.62, 0]} castShadow>
                      <boxGeometry args={[0.12, 0.35, 0.9]} />
                      <meshStandardMaterial color="#1e293b" roughness={0.4} />
                    </mesh>
                  ))}
                </group>
              ))}
            </group>
          ))}
        </group>
      ))}

      {/* 5. ĐÈN HẮT TƯỜNG TRANG TRÍ RẠP CHIẾU PHIM HAI BÊN TƯỜNG TÂY & ĐÔNG */}
      {[-7, -1, 5].map((wz, idx) => (
        <group key={idx}>
          <mesh position={[-15.5, 3.2, wz]}>
            <boxGeometry args={[0.15, 0.9, 0.35]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={isLightsDimmed ? 0.35 : 1.2}
            />
          </mesh>
          <mesh position={[15.5, 3.2, wz]}>
            <boxGeometry args={[0.15, 0.9, 0.35]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={isLightsDimmed ? 0.35 : 1.2}
            />
          </mesh>
        </group>
      ))}

      {/* 6. HIỂN THỊ CÁC NGƯỜI CHƠI ONLINE CÙNG VÀO RẠP XEM PHIM */}
      {remotePlayerList.map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}
    </group>
  );
}

/**
 * Giao diện HUD Màn Chiếu Rạp Phim YouTube & Quầy Mua Vé Bằng Xu
 */
export function CinemaLiveHud({
  playerCoins,
  hasTicket,
  activeMovie,
  customYoutubeUrl,
  isLightsDimmed,
  isScreenExpanded,
  onSelectMovie,
  onCustomUrlChange,
  onApplyCustomYoutubeUrl,
  onBuyTicket,
  onToggleLights,
  onToggleExpandScreen,
  onExit,
}: {
  playerCoins: number;
  hasTicket: boolean;
  activeMovie: CinemaMovieItem;
  customYoutubeUrl: string;
  isLightsDimmed: boolean;
  isScreenExpanded: boolean;
  onSelectMovie: (movie: CinemaMovieItem) => void;
  onCustomUrlChange: (val: string) => void;
  onApplyCustomYoutubeUrl: () => void;
  onBuyTicket: (ticketPrice: number, expBonus: number, comboName: string) => void;
  onToggleLights: () => void;
  onToggleExpandScreen: () => void;
  onExit: () => void;
}) {
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      onApplyCustomYoutubeUrl();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 58,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '54px 16px 12px',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: isLightsDimmed ? 'rgba(2, 6, 23, 0.45)' : 'transparent',
        transition: 'background-color 0.4s ease',
      }}
    >
      {/* ================================================================= */}
      {/* PHẦN TRÊN: MÀN CHIẾU ĐẠI RẠP IMAX (CHIẾU VIDEO YOUTUBE TRỰC TIẾP) */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '14px',
          width: '100%',
          maxWidth: '1320px',
          margin: '0 auto',
        }}
      >
        {/* BẢNG TRÁI: QUẦY VÉ & COMBO BẮP NƯỚC */}
        {!isScreenExpanded && (
          <div
            style={{
              pointerEvents: 'auto',
              width: '235px',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #f59e0b',
              borderRadius: '14px',
              padding: '12px',
              boxShadow: '0 10px 28px rgba(0,0,0,0.65)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                color: '#fef08a',
                fontWeight: 900,
                fontSize: '12px',
                borderBottom: '1px solid rgba(254, 240, 138, 0.25)',
                paddingBottom: '6px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>🎟️ QUẦY VÉ IMAX</span>
              <span style={{ color: '#fbbf24' }}>🪙 {playerCoins} Xu</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  backgroundColor: hasTicket
                    ? 'rgba(22, 163, 74, 0.22)'
                    : 'rgba(239, 68, 68, 0.18)',
                  border: `1.5px solid ${hasTicket ? '#4ade80' : '#f87171'}`,
                  borderRadius: '10px',
                  padding: '8px 10px',
                  fontSize: '11.5px',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontWeight: 900, color: hasTicket ? '#4ade80' : '#fca5a5' }}>
                  {hasTicket ? '✅ ĐÃ CÓ VÉ XEM PHIM' : '🔒 CHƯA MUA VÉ VÀO RẠP'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '3px' }}>
                  {hasTicket
                    ? 'Bạn có thể tự do chọn phim hoặc dán link YouTube bất kỳ để chiếu lên màn hình rạp!'
                    : 'Hãy dùng Xu mua vé xem phim bên dưới để bật máy chiếu IMAX YouTube!'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBuyTicket(50, 30, 'Vé Xem Phim IMAX 2D/3D')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0f172a',
                  border: '1.5px solid #fef08a',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  fontWeight: 900,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>🎟️ {hasTicket ? 'Mua thêm Vé Bạn Bè' : 'Mua Vé Xem Phim'}</span>
                <span
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#fef08a',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '10.5px',
                  }}
                >
                  50 Xu
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onBuyTicket(80, 65, 'Combo VIP: Vé IMAX + Bắp Phô Mai & Pepsi')
                }
                style={{
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  color: '#ffffff',
                  border: '1.5px solid #fda4af',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  fontWeight: 900,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>🍿 Combo Vé + Bắp Nước</span>
                <span
                  style={{
                    backgroundColor: '#fef08a',
                    color: '#881337',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '10.5px',
                  }}
                >
                  80 Xu
                </span>
              </button>
            </div>
          </div>
        )}

        {/* MÀN CHIẾU CHÍNH GIỮA RẠP: HIỂN THỊ VIDEO YOUTUBE NHƯ MÀN CHIẾU THẬT */}
        <div
          style={{
            pointerEvents: 'auto',
            width: isScreenExpanded ? '860px' : '640px',
            maxWidth: '92vw',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '5px solid #18181b',
            boxShadow: isLightsDimmed
              ? '0 0 65px rgba(59, 130, 246, 0.55), 0 18px 45px rgba(0,0,0,0.9)'
              : '0 14px 36px rgba(0,0,0,0.75)',
            backgroundColor: '#000000',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Thanh viền trên màn chiếu IMAX */}
          <div
            style={{
              background: 'linear-gradient(90deg, #7f1d1d, #dc2626, #7f1d1d)',
              color: '#ffffff',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 900,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎬 MÀN CHIẾU GRAND IMAX:</span>
              <span style={{ color: '#fef08a' }}>{activeMovie.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={onToggleLights}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  color: '#fef08a',
                  border: '1px solid rgba(254, 240, 138, 0.4)',
                  borderRadius: '999px',
                  padding: '2px 9px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isLightsDimmed ? '💡 Bật Đèn Rạp' : '🌙 Tắt Đèn Rạp'}
              </button>
              <button
                type="button"
                onClick={onToggleExpandScreen}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  color: '#bae6fd',
                  border: '1px solid rgba(186, 230, 253, 0.4)',
                  borderRadius: '999px',
                  padding: '2px 9px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isScreenExpanded ? '🗕 Thu Gọn Màn Chiếu' : '🔎 Phóng To Màn Chiếu'}
              </button>
            </div>
          </div>

          {/* Khung chiếu YouTube 16:9 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: isScreenExpanded ? '440px' : '295px',
              backgroundColor: '#020617',
            }}
          >
            {hasTicket ? (
              <iframe
                key={activeMovie.youtubeId}
                src={`https://www.youtube.com/embed/${activeMovie.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={activeMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
              />
            ) : (
              /* Màn hình chờ khi người chơi chưa lấy tiền mua vé */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  background:
                    'radial-gradient(circle at center, rgba(153, 27, 27, 0.45), rgba(2, 6, 23, 0.96))',
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎟️🍿</div>
                <div
                  style={{
                    color: '#fef08a',
                    fontWeight: 900,
                    fontSize: '17px',
                    marginBottom: '6px',
                  }}
                >
                  CHÀO MỪNG ĐẾN RẠP CHIẾU PHIM GRAND IMAX!
                </div>
                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: '12.5px',
                    maxWidth: '460px',
                    marginBottom: '14px',
                    lineHeight: 1.45,
                  }}
                >
                  Hãy mua vé xem phim bằng Xu (chỉ <b>50 Xu</b>) để bật máy chiếu IMAX thưởng thức các bộ phim trên YouTube hoặc tự chiếu video YouTube yêu thích của bạn lên màn ảnh rộng!
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onBuyTicket(50, 30, 'Vé Xem Phim IMAX 2D/3D')}
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      color: '#0f172a',
                      border: '2px solid #fef08a',
                      borderRadius: '999px',
                      padding: '9px 22px',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                    }}
                  >
                    🎟️ Mua Vé Xem Ngay (50 Xu • +30 EXP)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onBuyTicket(80, 65, 'Combo VIP: Vé IMAX + Bắp Phô Mai & Pepsi')
                    }
                    style={{
                      background: 'linear-gradient(135deg, #e11d48, #be123c)',
                      color: '#ffffff',
                      border: '2px solid #fda4af',
                      borderRadius: '999px',
                      padding: '9px 20px',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(225, 29, 72, 0.5)',
                    }}
                  >
                    🍿 Mua Combo VIP + Bắp Nước (80 Xu • +65 EXP)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BẢNG PHẢI: NÚT RỜI RẠP & HƯỚNG DẪN NGỒI GHẾ */}
        {!isScreenExpanded && (
          <div
            style={{
              pointerEvents: 'auto',
              width: '215px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(10px)',
                border: '2px solid #38bdf8',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '0 10px 28px rgba(0,0,0,0.65)',
                fontSize: '11.5px',
                color: '#e2e8f0',
              }}
            >
              <div
                style={{
                  color: '#38bdf8',
                  fontWeight: 900,
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                🍿 TRẢI NGHIỆM RẠP IMAX
              </div>
              <div style={{ lineHeight: 1.45, color: '#cbd5e1' }}>
                • Di chuyển nhân vật bằng <b>WASD</b> lại ngồi vào các hàng ghế sofa nhung đỏ.<br />
                • Chọn phim có sẵn hoặc <b>dán link YouTube bất kỳ</b> ở thanh bên dưới để chiếu lên màn hình rạp!
              </div>
            </div>

            <button
              type="button"
              onClick={onExit}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#ffffff',
                border: '1.5px solid #fef08a',
                borderRadius: '12px',
                padding: '9px 14px',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.5)',
              }}
            >
              🚪 Bước Ra Sảnh Thành Phố
            </button>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* PHẦN DƯỚI: CHỌN PHIM ĐANG CHIẾU HOẶC DÁN LINK YOUTUBE TỰ CHỌN      */}
      {/* ================================================================= */}
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: '880px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(251, 191, 36, 0.5)',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
        }}
      >
        {/* Danh sách các suất phim chọn nhanh */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {CINEMA_YOUTUBE_MOVIES.map((movie) => {
            const isSelected = activeMovie.youtubeId === movie.youtubeId;
            return (
              <button
                key={movie.id}
                type="button"
                onClick={() => onSelectMovie(movie)}
                style={{
                  backgroundColor: isSelected
                    ? movie.badgeColor
                    : 'rgba(30, 41, 59, 0.9)',
                  color: '#ffffff',
                  border: isSelected
                    ? '1.5px solid #fef08a'
                    : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {movie.category.split(' ')[0]} {movie.title.split('—')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Ô nhập Link YouTube bất kỳ để chiếu lên màn chiếu rạp */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔗 Dán link video/phim YouTube bất kỳ (VD: https://www.youtube.com/watch?v=...) để chiếu lên rạp..."
            value={customYoutubeUrl}
            onChange={(e) => onCustomUrlChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              border: '1.5px solid rgba(254, 240, 138, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              color: '#fef08a',
              fontSize: '12.5px',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onApplyCustomYoutubeUrl}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: '1.5px solid #93c5fd',
              borderRadius: '999px',
              padding: '8px 18px',
              fontWeight: 900,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📽️ Chiếu Link YouTube Này
          </button>
        </div>
      </div>
    </div>
  );
}

