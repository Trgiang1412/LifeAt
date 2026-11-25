'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Chip,
  Paper,
  Tabs,
  Tab,
  Button,
  Badge,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import AspectRatioRoundedIcon from '@mui/icons-material/AspectRatioRounded';
import { RoomParticipant, ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60',
];

// Cấu hình Google STUN & Metered TURN servers chuẩn cho WebRTC Audio & Video P2P xuyên NAT/Firewall
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

interface RemotePeerData {
  socketId: string;
  userId: string;
  userName: string;
  stream: MediaStream;
  micOn?: boolean;
  camOn?: boolean;
}

// Component phát âm thanh của bạn học ra loa/tai nghe mà không gây tiếng hú vọng (echo)
function RemoteAudioOutput({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (el && stream) {
      el.srcObject = stream;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Tự động phát âm thanh ngay khi người dùng tương tác với trang web
          const unlock = () => {
            el.play().catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
        });
      }
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{
        position: 'fixed',
        left: -9999,
        top: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// Component hiển thị video webcam của bạn học
function RemoteVideoOutput({
  stream,
  style,
}: {
  stream: MediaStream;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video playback warning:', err);
        });
      }
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted // BẮT BUỘC có muted để trình duyệt không chặn phát Video webcam
      style={style}
    />
  );
}

// Component hiển thị video webcam của chính mình
function LocalVideoOutput({
  stream,
  style,
}: {
  stream: MediaStream | null;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted style={style} />;
}

interface CoWorkingCenterVideoHubProps {
  myCam: boolean;
  myMic: boolean;
  isSpeaking: boolean;
  localStream: MediaStream | null;
  userName: string;
  remotePeers: Record<string, RemotePeerData>;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onClose: () => void;
}

// Khung Video Co-working nổi ở CHÍNH GIỮA MÀN HÌNH (Center Video Hub)
function CoWorkingCenterVideoHub({
  myCam,
  myMic,
  isSpeaking,
  localStream,
  userName,
  remotePeers,
  onToggleMic,
  onToggleCam,
  onClose,
}: CoWorkingCenterVideoHubProps) {
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePeersWithVideo = Object.values(remotePeers).filter(
    (rp) =>
      rp.camOn !== false &&
      rp.stream &&
      rp.stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
  );

  const totalCams = (myCam ? 1 : 0) + activePeersWithVideo.length;

  // Tính toán kích thước modal theo chế độ chuẩn hoặc thu nhỏ gọn gàng
  const modalWidth = isCompact
    ? (totalCams === 1 ? 340 : 490)
    : (totalCams === 1 ? 440 : totalCams === 2 ? 680 : 640);
  const modalHeight = isCompact ? 270 : (totalCams <= 2 ? 340 : 480);

  // Căn giữa lần đầu tiên khi mở
  useEffect(() => {
    if (typeof window !== 'undefined' && position === null) {
      const centerX = Math.max(10, Math.round((window.innerWidth - modalWidth) / 2));
      const centerY = Math.max(50, Math.round((window.innerHeight - modalHeight) / 2));
      setPosition({ x: centerX, y: centerY });
    }
  }, [modalWidth, modalHeight, position]);

  const handleResetToCenter = () => {
    if (typeof window !== 'undefined') {
      const rect = modalRef.current?.getBoundingClientRect();
      const currentW = rect?.width || modalWidth;
      const currentH = rect?.height || modalHeight;
      const centerX = Math.max(10, Math.round((window.innerWidth - currentW) / 2));
      const centerY = Math.max(50, Math.round((window.innerHeight - currentH) / 2));
      setPosition({ x: centerX, y: centerY });
    }
  };

  // Bắt đầu kéo thả tự do
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ngăn chặn nổi bọt sự kiện lên DraggableWidgetWrapper của Study Room
    e.stopPropagation();
    try {
      e.nativeEvent?.stopImmediatePropagation?.();
    } catch {}

    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, [role="button"], .MuiIconButton-root, .MuiChip-root')) return;

    isDraggingRef.current = true;
    setIsDragging(true);

    const currentTarget = e.currentTarget;
    try {
      currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const curPos = position || {
      x: Math.max(10, Math.round((window.innerWidth - modalWidth) / 2)),
      y: Math.max(50, Math.round((window.innerHeight - modalHeight) / 2)),
    };

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: curPos.x,
      posY: curPos.y,
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEv.clientX - dragStartRef.current.startX;
      const dy = moveEv.clientY - dragStartRef.current.startY;

      const rect = modalRef.current?.getBoundingClientRect();
      const currentW = rect?.width || modalWidth;
      const currentH = rect?.height || modalHeight;

      // Cho phép kéo thả tự do ra bất kỳ vị trí mép nào trên màn hình không bị giới hạn
      const minX = 0;
      const minY = 0;
      const maxX = Math.max(0, window.innerWidth - currentW);
      const maxY = Math.max(0, window.innerHeight - currentH);

      setPosition({
        x: Math.max(minX, Math.min(maxX, dragStartRef.current.posX + dx)),
        y: Math.max(minY, Math.min(maxY, dragStartRef.current.posY + dy)),
      });
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);

      try {
        currentTarget.releasePointerCapture(upEv.pointerId);
      } catch {}

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  if (!mounted || typeof document === 'undefined') return null;

  // Tọa độ render thực tế
  const currentX =
    position?.x ??
    (typeof window !== 'undefined'
      ? Math.max(10, Math.round((window.innerWidth - modalWidth) / 2))
      : 200);
  const currentY =
    position?.y ??
    (typeof window !== 'undefined'
      ? Math.max(50, Math.round((window.innerHeight - modalHeight) / 2))
      : 120);

  // Giao diện khi người dùng bấm Thu nhỏ (chế độ Mini Pill)
  if (isMinimized) {
    return createPortal(
      <Paper
        data-coworking-hub="true"
        elevation={16}
        onPointerDown={(e) => {
          e.stopPropagation();
          handlePointerDown(e);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'fixed',
          left: `${currentX}px`,
          top: `${currentY}px`,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          px: 2,
          py: 0.9,
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(24px)',
          border: isSpeaking ? '2px solid #10b981' : '1.5px solid rgba(6, 182, 212, 0.6)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <DragIndicatorRoundedIcon sx={{ color: '#06b6d4', fontSize: 16 }} />
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
          📹 Video Co-Working ({totalCams})
        </Typography>
        <Tooltip title="Mở rộng khung video">
          <IconButton size="small" onClick={() => setIsMinimized(false)} sx={{ color: '#06b6d4', p: 0.4 }}>
            <OpenInFullRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ẩn khung video">
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.4, '&:hover': { color: '#fff' } }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Paper>,
      document.body
    );
  }

  // Giao diện chính: KHUNG VIDEO TỰ DO DI CHUYỂN TRÊN MÀN HÌNH
  return createPortal(
    <Paper
      data-coworking-hub="true"
      ref={modalRef}
      elevation={24}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'fixed',
        left: `${currentX}px`,
        top: `${currentY}px`,
        width: `${modalWidth}px`,
        maxWidth: '98vw',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(28px)',
        border: isSpeaking
          ? '2px solid #10b981'
          : isDragging
          ? '2px solid #38bdf8'
          : '1.5px solid rgba(6, 182, 212, 0.5)',
        boxShadow: isDragging
          ? '0 0 35px rgba(6, 182, 212, 0.7), 0 25px 60px rgba(0,0,0,0.85)'
          : isSpeaking
          ? '0 0 25px rgba(16, 185, 129, 0.4), 0 20px 50px rgba(0,0,0,0.7)'
          : '0 20px 50px rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        userSelect: isDragging ? 'none' : 'auto',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'border 0.25s ease, box-shadow 0.25s ease, width 0.2s ease',
      }}
    >
      {/* Header kéo thả & Điều khiển */}
      <Box
        onPointerDown={handlePointerDown}
        sx={{
          p: 1.2,
          px: 1.8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, rgba(6, 182, 212, 0.18), rgba(15, 23, 42, 0.85))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicatorRoundedIcon sx={{ color: '#06b6d4', fontSize: 19, cursor: isDragging ? 'grabbing' : 'grab' }} />
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <Typography sx={{ fontWeight: 800, fontSize: isCompact ? '0.78rem' : '0.85rem', color: '#f8fafc', letterSpacing: 0.5 }}>
            PHÒNG HỌC CO-WORKING LIVE
          </Typography>
          <Chip
            label={`${totalCams} Cam`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              color: '#67e8f9',
              border: '1px solid rgba(6, 182, 212, 0.35)',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={isCompact ? "Phóng to kích thước chuẩn" : "Thu nhỏ gọn góc màn hình"}>
            <IconButton size="small" onClick={() => setIsCompact(!isCompact)} sx={{ color: isCompact ? '#38bdf8' : 'rgba(255,255,255,0.7)', p: 0.5 }}>
              <AspectRatioRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Đưa khung video về chính giữa màn hình">
            <IconButton size="small" onClick={handleResetToCenter} sx={{ color: '#06b6d4', p: 0.5 }}>
              <CenterFocusStrongRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thu nhỏ thành thanh nổi mini">
            <IconButton size="small" onClick={() => setIsMinimized(true)} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
              <RemoveRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Đóng khung video">
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5, '&:hover': { color: '#f87171' } }}>
              <CloseRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Grid chứa các khung Video Camera */}
      <Box
        sx={{
          p: isCompact ? 1 : 1.5,
          display: 'grid',
          gridTemplateColumns: totalCams === 1 ? '1fr' : totalCams === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: isCompact ? 1 : 1.5,
          backgroundColor: '#020617',
        }}
      >
        {/* 1. Video của chính mình (Local Webcam) */}
        {myCam && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              aspectRatio: isCompact ? '16/11' : '16/10',
              border: isSpeaking ? '2.5px solid #10b981' : '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: isSpeaking ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <LocalVideoOutput
              stream={localStream}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />

            {/* Header trên video */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.35,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <Typography sx={{ fontSize: isCompact ? '0.7rem' : '0.74rem', fontWeight: 700, color: '#f8fafc' }}>
                  {userName} (Bạn)
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 0.8,
                  py: 0.35,
                  borderRadius: '6px',
                  backgroundColor: myMic ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)',
                  color: myMic ? '#34d399' : '#fca5a5',
                  fontSize: isCompact ? '0.65rem' : '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                }}
              >
                {myMic ? <MicRoundedIcon sx={{ fontSize: 13 }} /> : <MicOffRoundedIcon sx={{ fontSize: 13 }} />}
                {myMic ? (isSpeaking ? 'Đang nói' : 'Bật mic') : 'Đã tắt mic'}
              </Box>
            </Box>
          </Box>
        )}

        {/* 2. Video của bạn học trong phòng (Remote Peers) */}
        {activePeersWithVideo.map((peer) => (
          <Box
            key={peer.socketId}
            sx={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              aspectRatio: isCompact ? '16/11' : '16/10',
              border: '1.5px solid rgba(6, 182, 212, 0.5)',
              transition: 'border 0.2s ease',
            }}
          >
            <RemoteVideoOutput
              stream={peer.stream}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Header trên video bạn học */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.35,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#06b6d4' }} />
                <Typography sx={{ fontSize: isCompact ? '0.7rem' : '0.74rem', fontWeight: 700, color: '#f8fafc' }}>
                  {peer.userName}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 0.8,
                  py: 0.35,
                  borderRadius: '6px',
                  backgroundColor: peer.micOn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)',
                  color: peer.micOn ? '#34d399' : '#fca5a5',
                  fontSize: isCompact ? '0.65rem' : '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                }}
              >
                {peer.micOn ? <MicRoundedIcon sx={{ fontSize: 13 }} /> : <MicOffRoundedIcon sx={{ fontSize: 13 }} />}
                {peer.micOn ? 'Bật mic' : 'Đã tắt mic'}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Thanh điều khiển nhanh ở dưới đáy khung video (Cũng hỗ trợ kéo thả) */}
      <Box
        onPointerDown={handlePointerDown}
        sx={{
          p: 1.2,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <DragIndicatorRoundedIcon sx={{ color: '#64748b', fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.74rem' }}>
            💡 Kéo thanh này để di chuyển tự do khắp màn hình
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onToggleMic}
            startIcon={myMic ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
            sx={{
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'none',
              backgroundColor: myMic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: myMic ? '#34d399' : '#f87171',
              border: myMic ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: myMic ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                boxShadow: 'none',
              },
            }}
          >
            {myMic ? 'Mic: Đang bật' : 'Mic: Đã tắt'}
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={onToggleCam}
            startIcon={myCam ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
            sx={{
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'none',
              backgroundColor: myCam ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: myCam ? '#67e8f9' : '#f87171',
              border: myCam ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: myCam ? 'rgba(6, 182, 212, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                boxShadow: 'none',
              },
            }}
          >
            {myCam ? 'Tắt Camera' : 'Bật Camera'}
          </Button>
        </Box>
      </Box>
    </Paper>,
    document.body
  );
}

interface RoomChatWidgetProps {
  onClose: () => void;
  hostName: string;
  roomCode: string;
  isHost?: boolean;
  onLeaveRoom?: () => void;
  participantsList?: any[];
}

export default function RoomChatWidget({
  onClose,
  hostName,
  roomCode,
  isHost = true,
  onLeaveRoom,
  participantsList,
}: RoomChatWidgetProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
  const [myMic, setMyMic] = useState(false);
  const [myCam, setMyCam] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFloatingCam, setShowFloatingCam] = useState(true);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteMediaMap, setRemoteMediaMap] = useState<Record<string, { micOn: boolean; camOn: boolean }>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputMsg, setInputMsg] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatListContainerRef = useRef<HTMLDivElement | null>(null);

  // Quản lý các kết nối WebRTC Peer-to-Peer để nghe và nhìn thấy nhau thật sự
  const [remotePeers, setRemotePeers] = useState<Record<string, RemotePeerData>>({});
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const knownPeersRef = useRef<Map<string, { socketId: string; userId: string; userName: string; isHost?: boolean }>>(new Map());

  // Refs điều khiển luồng Camera & Microphone WebRTC cục bộ
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const floatingVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const myMicRef = useRef(false);
  const myCamRef = useRef(false);
  const remoteMediaBySocketRef = useRef<Record<string, { micOn: boolean; camOn: boolean }>>({});
  myMicRef.current = myMic;
  myCamRef.current = myCam;

  // Cập nhật State Remote Peer với MediaStream mới nhất (đảm bảo React re-render nhận track)
  const updateRemotePeerState = useCallback((targetSocketId: string, peerInfo?: { userId?: string; userName?: string }) => {
    const remoteStream = remoteStreamsRef.current.get(targetSocketId);
    if (!remoteStream) return;

    const freshStream = new MediaStream(remoteStream.getTracks());
    const mediaOverride = remoteMediaBySocketRef.current[targetSocketId];
    const hasAudio = mediaOverride ? mediaOverride.micOn : freshStream.getAudioTracks().some((t) => t.enabled);
    const hasVideo = mediaOverride ? mediaOverride.camOn : freshStream.getVideoTracks().some((t) => t.enabled);

    setRemotePeers((prev) => ({
      ...prev,
      [targetSocketId]: {
        socketId: targetSocketId,
        userId: peerInfo?.userId || targetSocketId,
        userName: peerInfo?.userName || knownPeersRef.current.get(targetSocketId)?.userName || 'Bạn học',
        stream: freshStream,
        micOn: hasAudio,
        camOn: hasVideo,
      },
    }));

    // Tự động mở khung Video Co-Working nếu đối phương mở camera
    if (hasVideo) {
      setShowFloatingCam(true);
    }
  }, []);

  // Tạo hoặc lấy kết nối WebRTC PeerConnection tới một bạn học trong phòng
  const getOrCreatePeerConnection = useCallback((targetSocketId: string, peerInfo?: { userId?: string; userName?: string }) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Khi nhận được luồng Audio hoặc Video từ bạn học truyền qua
    pc.ontrack = (event) => {
      let remoteStream = remoteStreamsRef.current.get(targetSocketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, remoteStream);
      }

      // Xóa track cũ cùng kind nếu có rồi thêm track mới
      const existing = remoteStream.getTracks().find((t) => t.id === event.track.id || t.kind === event.track.kind);
      if (existing) {
        remoteStream.removeTrack(existing);
      }
      remoteStream.addTrack(event.track);

      event.track.onunmute = () => {
        updateRemotePeerState(targetSocketId, peerInfo);
      };

      event.track.onended = () => {
        updateRemotePeerState(targetSocketId, peerInfo);
      };

      updateRemotePeerState(targetSocketId, peerInfo);
    };

    // Trao đổi ứng viên kết nối mạng ICE Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit('webrtc_signal', {
          roomCode,
          toSocketId: targetSocketId,
          type: 'candidate',
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    // Nếu máy mình đang có sẵn Audio hoặc Video, gửi ngay sang cho bạn học
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        remoteStreamsRef.current.delete(targetSocketId);
        pendingCandidatesRef.current.delete(targetSocketId);
        setRemotePeers((prev) => {
          const copy = { ...prev };
          delete copy[targetSocketId];
          return copy;
        });
      }
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, [roomCode, updateRemotePeerState]);

  // Phát sóng luồng Mic/Cam của mình tới tất cả bạn học trong phòng
  const broadcastLocalTracksToAllPeers = useCallback(async (stream: MediaStream) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    const targets = Array.from(knownPeersRef.current.keys());
    for (const targetId of targets) {
      try {
        const pc = getOrCreatePeerConnection(targetId, knownPeersRef.current.get(targetId));
        const senders = pc.getSenders();

        stream.getTracks().forEach((track) => {
          const existingSender = senders.find((s: any) => s.track && s.track.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
          continue;
        }

        await pc.setLocalDescription(offer);

        socket.emit('webrtc_signal', {
          roomCode,
          toSocketId: targetId,
          type: 'offer',
          sdp: {
            type: offer.type,
            sdp: offer.sdp,
          },
          userName: user?.tenDangNhap || hostName || 'Bạn',
          userId: user?.id || 'me',
        });
      } catch (err) {
        console.warn(`[WebRTC] Lỗi gửi luồng tới bạn học ${targetId}:`, err);
      }
    }
  }, [getOrCreatePeerConnection, hostName, roomCode, user]);

  // Danh sách thành viên hiển thị chính xác theo số người thực tế trong phòng
  const participants = React.useMemo<RoomParticipant[]>(() => {
    // 1. Khi có danh sách đồng bộ từ server
    if (participantsList && participantsList.length > 0) {
      return participantsList.map((p, idx) => {
        const isCurrentAuthUser =
          (user?.id && p.userId === user.id) ||
          (user?.tenDangNhap && p.name === user.tenDangNhap) ||
          (isHost && p.isHost);

        let displayName = p.name;
        if (!displayName) {
          displayName = p.isHost ? (hostName || 'Chủ phòng') : `Thành viên ${idx + 1}`;
        }
        if (isCurrentAuthUser && !displayName.includes('(You)')) {
          displayName = `${displayName} (You)`;
        }

        const remoteMedia =
          (p.userId && remoteMediaMap[p.userId]) ||
          (p.socketId && remoteMediaMap[p.socketId]) ||
          (p.name && remoteMediaMap[p.name]) ||
          (p.isHost && remoteMediaMap['host']) ||
          undefined;
        return {
          id: p.userId || `p-${idx}`,
          name: displayName,
          avatar: p.avatar || AVATAR_POOL[idx % AVATAR_POOL.length],
          status: 'Focusing',
          isHost: Boolean(p.isHost),
          micOn: isCurrentAuthUser ? myMic : Boolean(remoteMedia?.micOn),
          camOn: isCurrentAuthUser ? myCam : Boolean(remoteMedia?.camOn),
        };
      });
    }

    // 2. Fallback: Nếu là chủ phòng ở 1 mình thì chỉ hiển thị đúng 1 mình chủ phòng
    if (isHost) {
      const currentHostDisplayName = user?.tenDangNhap || hostName?.replace("'s Room", "") || 'Chủ phòng';
      return [
        {
          id: user?.id || 'host',
          name: `${currentHostDisplayName} (You)`,
          avatar: AVATAR_POOL[0],
          status: 'Focusing',
          isHost: true,
          micOn: myMic,
          camOn: myCam,
        },
      ];
    } else {
      // Khách ghé thăm phòng
      const hostDisplayName = hostName || 'Chủ phòng';
      const myDisplayName = user?.tenDangNhap ? `${user.tenDangNhap} (You)` : 'Bạn (You)';
      const hostMedia = remoteMediaMap['host'];
      return [
        {
          id: 'host',
          name: hostDisplayName,
          avatar: AVATAR_POOL[0],
          status: 'Focusing',
          isHost: true,
          micOn: Boolean(hostMedia?.micOn),
          camOn: Boolean(hostMedia?.camOn),
        },
        {
          id: user?.id || 'me',
          name: myDisplayName,
          avatar: AVATAR_POOL[1],
          status: 'Focusing',
          isHost: false,
          micOn: myMic,
          camOn: myCam,
        },
      ];
    }
  }, [participantsList, user, hostName, isHost, myMic, myCam, remoteMediaMap]);

  // Bật / Tắt Microphone thật sự qua Web Audio API
  const handleToggleMic = async () => {
    try {
      setMediaError(null);
      if (!myMic) {
        let stream = localStreamRef.current;
        const existingAudio = stream?.getAudioTracks()[0];

        if (existingAudio) {
          existingAudio.enabled = true;
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          const newAudioTrack = audioStream.getAudioTracks()[0];
          if (stream) {
            stream.addTrack(newAudioTrack);
          } else {
            localStreamRef.current = audioStream;
            stream = audioStream;
          }
        }

        // Tạo bộ phân tích biên độ âm thanh để phát hiện khi người dùng đang nói
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx && stream) {
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              setIsSpeaking(average > 15);
              animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch {}

        setLocalStreamState(stream);
        setMyMic(true);

        socketRef.current?.emit('roomMediaToggle', {
          roomCode,
          userId: user?.id || (isHost ? 'host' : 'me'),
          userName: user?.tenDangNhap || hostName || 'Bạn',
          isHost,
          micOn: true,
          camOn: myCamRef.current,
        });

        // Phát sóng luồng Mic tới tất cả các bạn học trong phòng
        if (stream) {
          broadcastLocalTracksToAllPeers(stream);
        }
      } else {
        const stream = localStreamRef.current;
        if (stream) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        setIsSpeaking(false);
        setLocalStreamState(stream);
        setMyMic(false);

        socketRef.current?.emit('roomMediaToggle', {
          roomCode,
          userId: user?.id || (isHost ? 'host' : 'me'),
          userName: user?.tenDangNhap || hostName || 'Bạn',
          isHost,
          micOn: false,
          camOn: myCamRef.current,
        });
      }
    } catch (err: any) {
      console.warn('Lỗi quyền Microphone:', err);
      setMediaError('Vui lòng cấp quyền Microphone trên trình duyệt để bật mic trò chuyện!');
    }
  };

  // Bật / Tắt Camera / Webcam thật sự qua WebRTC MediaStream
  const handleToggleCam = async () => {
    try {
      setMediaError(null);
      if (!myCam) {
        let stream = localStreamRef.current;
        const existingVideo = stream?.getVideoTracks()[0];

        if (existingVideo) {
          existingVideo.enabled = true;
        } else {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
          });
          const newVideoTrack = videoStream.getVideoTracks()[0];
          if (stream) {
            stream.addTrack(newVideoTrack);
          } else {
            localStreamRef.current = videoStream;
            stream = videoStream;
          }
        }

        localStreamRef.current = stream;
        setLocalStreamState(stream);
        setMyCam(true);
        setShowFloatingCam(true);

        setTimeout(() => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          if (floatingVideoRef.current && localStreamRef.current) {
            floatingVideoRef.current.srcObject = localStreamRef.current;
          }
        }, 120);

        socketRef.current?.emit('roomMediaToggle', {
          roomCode,
          userId: user?.id || (isHost ? 'host' : 'me'),
          userName: user?.tenDangNhap || hostName || 'Bạn',
          isHost,
          micOn: myMicRef.current,
          camOn: true,
        });

        // Phát sóng luồng Camera tới tất cả các bạn học trong phòng
        if (stream) {
          broadcastLocalTracksToAllPeers(stream);
        }
      } else {
        const stream = localStreamRef.current;
        if (stream) {
          stream.getVideoTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
            stream.removeTrack(track);
          });
        }
        // Gỡ track video khỏi tất cả sender trên PeerConnections
        peerConnectionsRef.current.forEach((pc) => {
          pc.getSenders().forEach((s) => {
            if (s.track && s.track.kind === 'video') {
              s.replaceTrack(null).catch(() => {});
            }
          });
        });
        setLocalStreamState(stream ? new MediaStream(stream.getTracks()) : null);
        setMyCam(false);
        setShowFloatingCam(false);

        socketRef.current?.emit('roomMediaToggle', {
          roomCode,
          userId: user?.id || (isHost ? 'host' : 'me'),
          userName: user?.tenDangNhap || hostName || 'Bạn',
          isHost,
          micOn: myMicRef.current,
          camOn: false,
        });
      }
    } catch (err: any) {
      console.warn('Lỗi quyền Camera:', err);
      setMediaError('Vui lòng cấp quyền Camera/Webcam trên trình duyệt để bật video!');
    }
  };

  // Đồng bộ luồng stream vào video elements khi trạng thái camera thay đổi
  useEffect(() => {
    if (myCam && localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (floatingVideoRef.current) {
        floatingVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [myCam, showFloatingCam]);

  // Giải phóng phần cứng khi unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollToBottom = () => {
    if (chatListContainerRef.current) {
      chatListContainerRef.current.scrollTop = chatListContainerRef.current.scrollHeight;
    }
  };

  // 1. Đồng bộ tin nhắn liên tục từ Database (Live Sync Polling)
  const syncChatFromDb = React.useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/room/chat?roomCode=${encodeURIComponent(roomCode)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.messages && Array.isArray(data.messages)) {
        setMessages((prev) => {
          if (prev.length === 0) {
            if (data.messages.length > 0) return data.messages;
            return [
              {
                id: 'welcome-1',
                senderId: 'host',
                senderName: hostName || 'Trường',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
                text: 'Chào mọi người! Cùng hoàn thành các pomodoros hôm nay nhé 🚀',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ];
          }

          // Kiểm tra và gộp tin nhắn mới từ người khác
          const existingIds = new Set(prev.map((m: any) => m.clientMsgId || m.id));
          const newMsgs = data.messages.filter(
            (m: any) => !existingIds.has(m.clientMsgId || m.id) && !existingIds.has(m.id)
          );

          if (newMsgs.length === 0) return prev;

          setTimeout(scrollToBottom, 60);
          return [...prev, ...newMsgs];
        });
      }
    } catch {
      // Bỏ qua lỗi mạng nền
    }
  }, [roomCode, hostName]);

  // Polling chu kỳ 1.2s đảm bảo tin nhắn luôn luôn nhảy realtime ngay cả khi Socket ngắt kết nối
  useEffect(() => {
    if (!roomCode) return;

    syncChatFromDb();
    const interval = setInterval(syncChatFromDb, 1200);

    return () => clearInterval(interval);
  }, [roomCode, syncChatFromDb]);

  // 2. Kết nối Socket.io để nhận và broadcast tin nhắn tức thì (sub-50ms)
  useEffect(() => {
    if (!roomCode) return;

    let socket: Socket | null = null;
    try {
      socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      const sendJoinRoom = () => {
        socket?.emit('joinRoom', {
          roomCode,
          userId: user?.id || 'me',
          userName: user?.tenDangNhap || hostName || 'Bạn',
          isHost,
          isWebRtcClient: true,
        });
      };

      socket.on('connect', sendJoinRoom);
      if (socket.connected) {
        sendJoinRoom();
      }

      // 1. Nhận danh sách các bạn học đang có sẵn trong phòng học
      socket.on('roomPeerList', async (peers: any[]) => {
        if (Array.isArray(peers)) {
          peers.forEach((p) => {
            if (p.socketId && p.socketId !== socket?.id) {
              knownPeersRef.current.set(p.socketId, p);
            }
          });
          // Nếu mình đang bật Mic hoặc Cam, phát sóng ngay cho các bạn học & đồng bộ trạng thái media
          if (localStreamRef.current) {
            broadcastLocalTracksToAllPeers(localStreamRef.current);
          }
          if (myMicRef.current || myCamRef.current) {
            socket?.emit('roomMediaToggle', {
              roomCode,
              userId: user?.id || (isHost ? 'host' : 'me'),
              userName: user?.tenDangNhap || hostName || 'Bạn',
              isHost,
              micOn: myMicRef.current,
              camOn: myCamRef.current,
            });
          }
        }
      });

      // 2. Khi có bạn học mới vào phòng
      socket.on('peerJoined', async (data: any) => {
        if (data && data.socketId && data.socketId !== socket?.id) {
          knownPeersRef.current.set(data.socketId, data);
          if (localStreamRef.current) {
            broadcastLocalTracksToAllPeers(localStreamRef.current);
          }
          if (myMicRef.current || myCamRef.current) {
            socket?.emit('roomMediaToggle', {
              roomCode,
              userId: user?.id || (isHost ? 'host' : 'me'),
              userName: user?.tenDangNhap || hostName || 'Bạn',
              isHost,
              micOn: myMicRef.current,
              camOn: myCamRef.current,
            });
          }
        }
      });

      // 3. Khi bạn học rời phòng
      socket.on('peerLeft', (data: any) => {
        if (data?.socketId) {
          knownPeersRef.current.delete(data.socketId);
          const pc = peerConnectionsRef.current.get(data.socketId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(data.socketId);
          }
          setRemotePeers((prev) => {
            const copy = { ...prev };
            delete copy[data.socketId];
            return copy;
          });
        }
      });

      // 4. Xử lý gói tin WebRTC truyền Audio & Video thật giữa các thành viên (Perfect Negotiation W3C Standard)
      socket.on('webrtc_signal', async (data: any) => {
        if (!data || !data.fromSocketId || data.fromSocketId === socket?.id) return;
        const fromId = data.fromSocketId;

        try {
          if (data.type === 'offer' && data.sdp) {
            const pc = getOrCreatePeerConnection(fromId, {
              userId: data.userId,
              userName: data.userName,
            });

            // Perfect Negotiation: Xử lý va chạm Offer (Glare) giữa 2 bên
            const isPolite = (socket?.id || '').localeCompare(fromId) > 0;
            const offerCollision = pc.signalingState !== 'stable';

            if (offerCollision) {
              if (!isPolite) {
                // Impolite peer: Bỏ qua offer đến và giữ offer của mình
                return;
              }
              // Polite peer: Rollback offer cục bộ để nhận offer của đối phương
              await pc.setLocalDescription({ type: 'rollback' });
            }

            // Nếu máy mình đang có local stream, thêm tracks vào pc để đối phương cũng nhận được
            if (localStreamRef.current) {
              const senders = pc.getSenders();
              localStreamRef.current.getTracks().forEach((track) => {
                const sender = senders.find((s: any) => s.track && s.track.kind === track.kind);
                if (sender) {
                  sender.replaceTrack(track).catch(() => {});
                } else {
                  try {
                    pc.addTrack(track, localStreamRef.current!);
                  } catch {}
                }
              });
            }

            // Set Remote Description từ Offer của đối phương
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            // Xử lý các ICE Candidate đến sớm đang nằm trong hàng đợi
            const pending = pendingCandidatesRef.current.get(fromId) || [];
            while (pending.length > 0) {
              const cand = pending.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
            }

            // Tạo Answer phản hồi với yêu cầu nhận cả Audio và Video
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket?.emit('webrtc_signal', {
              roomCode,
              toSocketId: fromId,
              type: 'answer',
              sdp: {
                type: answer.type,
                sdp: answer.sdp,
              },
              userName: user?.tenDangNhap || hostName || 'Bạn',
              userId: user?.id || 'me',
            });
          } else if (data.type === 'answer' && data.sdp) {
            const pc = peerConnectionsRef.current.get(fromId);
            if (pc && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

              // Xử lý các ICE Candidate đến sớm
              const pending = pendingCandidatesRef.current.get(fromId) || [];
              while (pending.length > 0) {
                const cand = pending.shift();
                if (cand) {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }
            }
          } else if (data.type === 'candidate' && data.candidate) {
            const pc = peerConnectionsRef.current.get(fromId);
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
            } else {
              // Lưu vào hàng đợi nếu remoteDescription chưa sẵn sàng
              if (!pendingCandidatesRef.current.has(fromId)) {
                pendingCandidatesRef.current.set(fromId, []);
              }
              pendingCandidatesRef.current.get(fromId)!.push(data.candidate);
            }
          }
        } catch (err) {
          console.warn('[WebRTC] Lỗi xử lý WebRTC Signal:', err);
        }
      });

      const handleIncomingMessage = (msg: any) => {
        if (!msg) return;
        if (msg.roomCode && msg.roomCode !== roomCode) return;

        setMessages((prev) => {
          const matchId = msg.clientMsgId || msg.id;
          if (prev.some((m: any) => (m.clientMsgId && m.clientMsgId === matchId) || m.id === matchId)) {
            return prev;
          }
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      };

      socket.on('roomChatMessage', handleIncomingMessage);
      socket.on(`roomChatMessage_${roomCode}`, handleIncomingMessage);

      // Lắng nghe cập nhật trạng thái Mic & Camera của các thành viên khác trong phòng
      const handleMediaChanged = (data: any) => {
        if (!data || data.roomCode !== roomCode) return;
        if (data.fromSocketId && data.fromSocketId === socket?.id) return;

        const nextMicOn = Boolean(data.micOn);
        const nextCamOn = Boolean(data.camOn);
        const mediaState = { micOn: nextMicOn, camOn: nextCamOn };

        if (data.fromSocketId) {
          remoteMediaBySocketRef.current[data.fromSocketId] = mediaState;
          setRemotePeers((prev) => {
            const existing = prev[data.fromSocketId];
            if (!existing) return prev;
            return {
              ...prev,
              [data.fromSocketId]: {
                ...existing,
                micOn: nextMicOn,
                camOn: nextCamOn,
              },
            };
          });
        }

        if (nextCamOn) {
          setShowFloatingCam(true);
        }

        setRemoteMediaMap((prev) => {
          const updated = { ...prev };
          if (data.userId) updated[data.userId] = mediaState;
          if (data.fromSocketId) updated[data.fromSocketId] = mediaState;
          if (data.userName) updated[data.userName] = mediaState;
          if (data.isHost) updated['host'] = mediaState;
          return updated;
        });
      };

      socket.on('roomMediaChanged', handleMediaChanged);
      socket.on(`roomMediaChanged_${roomCode}`, handleMediaChanged);
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    return () => {
      if (socket) {
        socket.off('roomChatMessage');
        socket.off(`roomChatMessage_${roomCode}`);
        socket.off('roomMediaChanged');
        socket.off(`roomMediaChanged_${roomCode}`);
        socket.off('roomPeerList');
        socket.off('peerJoined');
        socket.off('peerLeft');
        socket.off('webrtc_signal');
        socket.disconnect();
      }
    };
  }, [roomCode]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages.length, activeTab]);

  // Gửi tin nhắn chat
  const sendMessage = async () => {
    if (!inputMsg.trim() || !roomCode) return;
    const textToSend = inputMsg.trim();
    setInputMsg('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mySenderId = user?.id || 'me';
    const mySenderName = user?.tenDangNhap || 'Bạn';
    const myAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';
    const msgId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: mySenderId,
      senderName: mySenderName,
      avatar: myAvatar,
      text: textToSend,
      timestamp: timeStr,
    };

    // Cập nhật ngay tức thì trên giao diện
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(scrollToBottom, 50);

    // Phát sóng real-time qua Socket.io
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendRoomChat', {
        id: msgId,
        clientMsgId: msgId,
        roomCode,
        senderId: mySenderId,
        senderName: mySenderName,
        avatar: myAvatar,
        text: textToSend,
        timestamp: timeStr,
      });
    }

    // Lưu vào database
    try {
      await fetch('/api/room/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientMsgId: msgId,
          roomCode,
          senderId: mySenderId,
          senderName: mySenderName,
          avatar: myAvatar,
          text: textToSend,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi lưu tin nhắn:', err);
    }
  };

  // Gửi biểu tượng cảm xúc nhanh
  const sendReaction = async (emoji: string) => {
    if (!roomCode) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mySenderId = user?.id || 'me';
    const mySenderName = user?.tenDangNhap || 'Bạn';
    const myAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';
    const msgId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: mySenderId,
      senderName: mySenderName,
      avatar: myAvatar,
      text: emoji,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTimeout(scrollToBottom, 50);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendRoomChat', {
        id: msgId,
        clientMsgId: msgId,
        roomCode,
        senderId: mySenderId,
        senderName: mySenderName,
        avatar: myAvatar,
        text: emoji,
        timestamp: timeStr,
      });
    }

    try {
      await fetch('/api/room/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientMsgId: msgId,
          roomCode,
          senderId: mySenderId,
          senderName: mySenderName,
          avatar: myAvatar,
          text: emoji,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi gửi reaction:', err);
    }
  };

  const copyRoomCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(roomCode || 'M7KQ-ILKC');
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        width: 360,
        height: 520,
        maxHeight: 520,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupRoundedIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            STUDY ROOM
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Room Code Banner - Bỏ nút mời bạn, chỉ hiển thị mã & icon copy */}
      <Box
        sx={{
          mx: 2,
          mb: 1.5,
          p: 1.2,
          flexShrink: 0,
          borderRadius: 2.5,
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#67e8f9', display: 'block', fontSize: '0.68rem' }}>
            MÃ PHÒNG (SPACE CODE)
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
            {roomCode || 'M7KQ-ILKC'}
          </Typography>
        </Box>
        <Tooltip title={copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã phòng'}>
          <IconButton
            size="small"
            onClick={copyRoomCode}
            sx={{
              color: copiedCode ? '#34d399' : '#67e8f9',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 2,
              p: 0.8,
              '&:hover': { backgroundColor: 'rgba(6, 182, 212, 0.3)' },
            }}
          >
            {copiedCode ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Banner khi Camera đang bật nhưng khung hình đang ẩn */}
      {myCam && !showFloatingCam && (
        <Box
          sx={{
            mx: 2,
            mb: 1,
            p: 1,
            flexShrink: 0,
            borderRadius: 2,
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#67e8f9', fontWeight: 600, fontSize: '0.72rem' }}>
            📹 Webcam đang bật (Khung video đang ẩn)
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowFloatingCam(true)}
            sx={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', py: 0.2 }}
          >
            Hiện ra giữa
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          zIndex: 10,
          '& .MuiTab-root': {
            minHeight: 38,
            py: 0.5,
            fontSize: '0.78rem',
            color: '#94a3b8',
            '&.Mui-selected': { color: '#06b6d4', fontWeight: 700 },
          },
          '& .MuiTabs-indicator': { backgroundColor: '#06b6d4', height: 2.5 },
        }}
      >
        <Tab label={`Thành viên (${participants.length})`} value="members" />
        <Tab label="Trò chuyện" value="chat" />
      </Tabs>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <Box sx={{ flex: 1, minHeight: 0, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Thông báo lỗi thiết bị / quyền nếu có */}
          {mediaError && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.74rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>⚠️ {mediaError}</span>
              <IconButton size="small" onClick={() => setMediaError(null)} sx={{ color: '#fca5a5', p: 0.3 }}>
                <CloseRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}

          {participants.map((userItem) => {
            const isSelf =
              userItem.id === 'me' ||
              userItem.id === user?.id ||
              userItem.name.includes('(You)');

            // Tìm luồng WebRTC của bạn học nếu có
            const peerMatch = !isSelf
              ? Object.values(remotePeers).find(
                  (rp) =>
                    rp.userId === userItem.id ||
                    rp.socketId === userItem.id ||
                    (userItem.name && rp.userName && userItem.name.includes(rp.userName))
                )
              : undefined;

            const hasRemoteVideo = Boolean(
              peerMatch &&
                peerMatch.stream &&
                peerMatch.stream.getVideoTracks().some((t) => t.enabled)
            );

            return (
              <Box
                key={userItem.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.2,
                  borderRadius: 2.5,
                  backgroundColor: isSelf ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelf ? '1.5px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.25s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  {/* Avatar hoặc Live Video Webcam của thành viên */}
                  {isSelf && myCam ? (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        border: isSpeaking ? '2.5px solid #10b981' : '2px solid #06b6d4',
                        boxShadow: isSpeaking ? '0 0 12px #10b981' : '0 0 6px rgba(6, 182, 212, 0.5)',
                        flexShrink: 0,
                      }}
                    >
                      <LocalVideoOutput
                        stream={localStreamState || localStreamRef.current}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                        }}
                      />
                    </Box>
                  ) : hasRemoteVideo && peerMatch ? (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '2px solid #06b6d4',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
                        flexShrink: 0,
                      }}
                    >
                      <RemoteVideoOutput
                        stream={peerMatch.stream}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  ) : (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: userItem.status === 'Focusing' ? '#10b981' : '#f59e0b',
                          color: userItem.status === 'Focusing' ? '#10b981' : '#f59e0b',
                        },
                      }}
                    >
                      <Avatar
                        src={userItem.avatar}
                        sx={{
                          width: 34,
                          height: 34,
                          border: isSelf && isSpeaking ? '2.5px solid #10b981' : 'none',
                          boxShadow: isSelf && isSpeaking ? '0 0 12px #10b981' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </Badge>
                  )}

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                        {userItem.name}
                      </Typography>
                      {userItem.isHost && (
                        <Chip
                          label="Host"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.62rem',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      {userItem.status === 'Focusing' ? '🎯 Đang tập trung' : '☕ Đang nghỉ ngơi'}
                    </Typography>
                  </Box>
                </Box>

                {/* Điều khiển Mic & Camera */}
                {isSelf ? (
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                    <Tooltip title={myMic ? 'Tắt Microphone' : 'Bật Microphone'}>
                      <IconButton
                        size="small"
                        onClick={handleToggleMic}
                        sx={{
                          color: myMic ? '#10b981' : '#64748b',
                          backgroundColor: myMic ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                          border: myMic ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
                          p: 0.7,
                          borderRadius: 2,
                          boxShadow: isSpeaking ? '0 0 10px #10b981' : 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: myMic ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.12)',
                          },
                        }}
                      >
                        {myMic ? <MicRoundedIcon sx={{ fontSize: 19 }} /> : <MicOffRoundedIcon sx={{ fontSize: 19 }} />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={myCam ? 'Tắt Camera Webcam' : 'Bật Camera Webcam'}>
                      <IconButton
                        size="small"
                        onClick={handleToggleCam}
                        sx={{
                          color: myCam ? '#06b6d4' : '#64748b',
                          backgroundColor: myCam ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                          border: myCam ? '1.5px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                          p: 0.7,
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: myCam ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.12)',
                          },
                        }}
                      >
                        {myCam ? <VideocamRoundedIcon sx={{ fontSize: 19 }} /> : <VideocamOffRoundedIcon sx={{ fontSize: 19 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                    <Box
                      sx={{
                        p: 0.6,
                        borderRadius: 2,
                        backgroundColor: (userItem.micOn || Boolean(peerMatch?.micOn)) ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: (userItem.micOn || Boolean(peerMatch?.micOn)) ? '#10b981' : '#64748b',
                      }}
                    >
                      {(userItem.micOn || Boolean(peerMatch?.micOn)) ? <MicRoundedIcon sx={{ fontSize: 18 }} /> : <MicOffRoundedIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box
                      sx={{
                        p: 0.6,
                        borderRadius: 2,
                        backgroundColor: (userItem.camOn || hasRemoteVideo) ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: (userItem.camOn || hasRemoteVideo) ? '#06b6d4' : '#64748b',
                      }}
                    >
                      {(userItem.camOn || hasRemoteVideo) ? <VideocamRoundedIcon sx={{ fontSize: 18 }} /> : <VideocamOffRoundedIcon sx={{ fontSize: 18 }} />}
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Nút rời phòng nếu là khách */}
          {!isHost && onLeaveRoom && (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={onLeaveRoom}
              startIcon={<ExitToAppRoundedIcon />}
              sx={{
                mt: 1,
                py: 0.8,
                borderRadius: 2.5,
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                '&:hover': {
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                },
              }}
            >
              🚪 Rời phòng học
            </Button>
          )}
        </Box>
      )}

      {/* Chat Tab - Dùng Socket.io Realtime */}
      {activeTab === 'chat' && (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Reaction Emojis */}
          <Box sx={{ px: 2, py: 1, flexShrink: 0, display: 'flex', gap: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            {['🔥', '☕', '👏', '💡', '🚀', '💯'].map((emoji) => (
              <Chip
                key={emoji}
                label={emoji}
                size="small"
                clickable
                onClick={() => sendReaction(emoji)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  fontSize: '0.85rem',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                }}
              />
            ))}
          </Box>

          {/* Messages list */}
          <Box
            ref={chatListContainerRef}
            sx={{ flex: 1, minHeight: 0, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {messages.map((msg) => {
              const isMe =
                msg.senderId === 'me' ||
                (user?.id && msg.senderId === user.id) ||
                (user?.tenDangNhap && msg.senderName === user.tenDangNhap);

              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    gap: 1.2,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  {!isMe && <Avatar src={msg.avatar} sx={{ width: 28, height: 28, mt: 0.5 }} />}
                  <Box>
                    {!isMe && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', mb: 0.2 }}>
                        {msg.senderName}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2.5,
                        backgroundColor: isMe ? 'rgba(6, 182, 212, 0.85)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', wordBreak: 'break-word' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.65rem',
                        display: 'block',
                        mt: 0.2,
                        textAlign: isMe ? 'right' : 'left',
                      }}
                    >
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input field */}
          <Box sx={{ p: 1.5, flexShrink: 0, display: 'flex', gap: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Gửi lời động viên..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2.5,
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: '#06b6d4' },
                  '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                },
                '& input': { color: '#f8fafc', py: 0.8 },
              }}
            />
            <IconButton
              onClick={sendMessage}
              sx={{
                backgroundColor: 'rgba(6, 182, 212, 0.85)',
                color: '#fff',
                borderRadius: 2.5,
                '&:hover': { backgroundColor: '#0891b2' },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Tự động phát âm thanh Mic của tất cả các bạn học trong phòng ra loa / tai nghe */}
      {Object.values(remotePeers).map((rp) => (
        <RemoteAudioOutput key={rp.socketId} stream={rp.stream} />
      ))}

      {/* KHUNG VIDEO CO-WORKING NỔI Ở CHÍNH GIỮA MÀN HÌNH (Portaled ra document.body) */}
      {((myCam && showFloatingCam) || Object.values(remotePeers).some((rp) => rp.stream && rp.stream.getVideoTracks().some((t) => t.enabled))) && (
        <CoWorkingCenterVideoHub
          myCam={myCam}
          myMic={myMic}
          isSpeaking={isSpeaking}
          localStream={localStreamState || localStreamRef.current}
          userName={user?.tenDangNhap || hostName || 'Bạn'}
          remotePeers={remotePeers}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onClose={() => setShowFloatingCam(false)}
        />
      )}
    </Paper>
  );
}
