'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Button,
  Tooltip,
  Snackbar,
} from '@mui/material';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import SparklesIcon from '@mui/icons-material/AutoAwesomeRounded';
import RoomInfo from '@/components/layout/RoomInfo';
import UserMenu from '@/components/layout/UserMenu';
import RoomInviteModal from '@/components/widgets/RoomInviteModal';
import { soundEngine } from '@/services/soundEngine';

interface TopBarProps {
  roomHost: string;
  roomCode: string;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onOpenSpaces: () => void;
  isHost?: boolean;
  onLeaveRoom?: () => void;
  participantCount?: number;
}

export default function TopBar({
  roomHost,
  roomCode,
  isZenMode,
  onToggleZenMode,
  onOpenSpaces,
  isHost = true,
  onLeaveRoom,
  participantCount = 1,
}: TopBarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const toggleMuteAll = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.toggleMute(nextMuted);
  };

  const openInviteModal = () => {
    setIsInviteOpen(true);
  };

  if (isZenMode) return null;

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 16,
        left: 20,
        right: 20,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      {/* Decoupled Left: Room Info & Host Component */}
      <RoomInfo
        roomHost={roomHost}
        roomCode={roomCode}
        onCopyRoomLink={openInviteModal}
        isHost={isHost}
        onLeaveRoom={onLeaveRoom}
        participantCount={participantCount}
      />

      {/* Right: Controls & Decoupled User Menu */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pointerEvents: 'auto',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 4,
          px: 1.2,
          py: 0.8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Tooltip title="Đổi không gian (Spaces)">
          <Button
            size="small"
            onClick={onOpenSpaces}
            startIcon={<SparklesIcon sx={{ color: '#818cf8', fontSize: '1rem !important' }} />}
            sx={{
              color: '#f8fafc',
              fontSize: '0.78rem',
              px: 1.5,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
            }}
          >
            Spaces
          </Button>
        </Tooltip>

        <Tooltip title="Zen Mode (Ẩn toàn bộ UI - Phím tắt Z)">
          <IconButton size="small" onClick={onToggleZenMode} sx={{ color: '#cbd5e1' }}>
            <VisibilityOffRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
          <IconButton size="small" onClick={toggleMuteAll} sx={{ color: isMuted ? '#f87171' : '#cbd5e1' }}>
            {isMuted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F)'}>
          <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#cbd5e1' }}>
            {isFullscreen ? <FullscreenExitRoundedIcon fontSize="small" /> : <FullscreenRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Decoupled User Menu (Avatar / Balance / Logout) */}
        <UserMenu />
      </Box>

      {/* Modal Mời bạn bè & Vào phòng bằng link */}
      <RoomInviteModal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomHost={roomHost}
        roomCode={roomCode}
      />

      <Snackbar
        open={shareToast}
        autoHideDuration={2500}
        onClose={() => setShareToast(false)}
        message="Đã sao chép liên kết phòng vào clipboard!"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
}
