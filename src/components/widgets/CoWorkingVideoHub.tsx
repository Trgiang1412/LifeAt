'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import AspectRatioRoundedIcon from '@mui/icons-material/AspectRatioRounded';

export interface RemotePeerData {
  socketId: string;
  userId: string;
  userName: string;
  stream: MediaStream;
  micOn?: boolean;
  camOn?: boolean;
}

// Component phát âm thanh của bạn học ra loa/tai nghe
export function RemoteAudioOutput({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (el && stream) {
      el.srcObject = stream;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlock = () => {
            el.play().catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
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
export function RemoteVideoOutput({
  stream,
  style,
}: {
  stream: MediaStream;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    el.srcObject = stream;
    const tryPlay = () => {
      el.play().catch((err) => {
        console.warn('Video playback warning:', err);
      });
    };
    tryPlay();

    // Lắng nghe khi track video bắt đầu có tín hiệu hình ảnh thật (unmute / onaddtrack)
    const handleTrackChange = () => {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      tryPlay();
    };

    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener('unmute', handleTrackChange);
    });

    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
      stream.getVideoTracks().forEach((track) => {
        track.removeEventListener('unmute', handleTrackChange);
      });
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        backgroundColor: '#000',
        ...style,
      }}
    />
  );
}

// Component hiển thị video webcam của chính mình
export function LocalVideoOutput({
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

export interface CoWorkingCenterVideoHubProps {
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

// Khung Video Co-working nổi TỰ DO DI CHUYỂN TRÊN MÀN HÌNH
export function CoWorkingCenterVideoHub({
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
    (rp) => rp.stream && rp.stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
  );

  const totalCams = (myCam ? 1 : 0) + activePeersWithVideo.length;

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

  // Giao diện Mini Pill thu nhỏ
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
        borderRadius: 3.5,
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
              borderRadius: 2.5,
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
                  borderRadius: 1.5,
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
                  borderRadius: 1.5,
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
              borderRadius: 2.5,
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              aspectRatio: isCompact ? '16/11' : '16/10',
              border: peer.micOn ? '2px solid #10b981' : '1.5px solid rgba(6, 182, 212, 0.5)',
              boxShadow: peer.micOn ? '0 0 16px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease',
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
                  borderRadius: 1.5,
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
                  borderRadius: 1.5,
                  backgroundColor: peer.micOn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(6, 182, 212, 0.25)',
                  color: peer.micOn ? '#34d399' : '#67e8f9',
                  fontSize: isCompact ? '0.65rem' : '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                }}
              >
                {peer.micOn ? <MicRoundedIcon sx={{ fontSize: 13 }} /> : <VideocamRoundedIcon sx={{ fontSize: 13 }} />}
                {peer.micOn ? 'Đang nói' : 'Live'}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Thanh điều khiển nhanh ở dưới đáy khung video */}
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onToggleMic}
            startIcon={myMic ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
            sx={{
              borderRadius: 2,
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
              borderRadius: 2,
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
