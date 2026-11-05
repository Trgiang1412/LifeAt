'use client';

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  AvatarGroup,
  Avatar,
  Tooltip,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { useAuth } from '@/context/AuthContext';

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

interface RoomInfoProps {
  roomHost: string;
  roomCode: string;
  onCopyRoomLink: () => void;
  isHost?: boolean;
  onLeaveRoom?: () => void;
  participantCount?: number;
}

export default function RoomInfo({
  roomHost,
  roomCode,
  onCopyRoomLink,
  isHost = true,
  onLeaveRoom,
  participantCount = 1,
}: RoomInfoProps) {
  const { user } = useAuth();

  const currentHostName = roomHost || (user ? `${user.tenDangNhap}'s Room` : "Trường's Room");
  const currentRoomCode = roomCode || user?.roomId || 'M7KQ-ILKC';

  // Số lượng và danh sách avatar hiển thị chính xác theo số người đang học
  const count = Math.max(1, participantCount || 1);
  const maxVisible = Math.min(3, count);
  const displayedAvatars = React.useMemo(() => {
    return AVATAR_POOL.slice(0, maxVisible);
  }, [maxVisible]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 4,
        px: 2,
        py: 1,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 10px #10b981',
          }}
        />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: '#f8fafc',
            fontSize: '0.95rem',
            letterSpacing: '-0.01em',
          }}
        >
          {currentHostName}
        </Typography>

        {/* Badge vai trò */}
        {!isHost ? (
          <Chip
            size="small"
            label="Khách"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 800,
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
            }}
          />
        ) : (
          <Chip
            size="small"
            label="Chủ phòng"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 800,
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
            }}
          />
        )}
      </Box>

      {/* Space Code Pill */}
      <Tooltip title="Mã phòng hiện tại">
        <Chip
          size="small"
          icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: '#818cf8 !important' }} />}
          label={currentRoomCode}
          onClick={onCopyRoomLink}
          sx={{
            backgroundColor: 'rgba(99, 102, 241, 0.18)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            fontWeight: 600,
            fontSize: '0.72rem',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.35)',
            },
          }}
        />
      </Tooltip>

      {/* Nút Mời bạn bè */}
      <Tooltip title="Mời bạn bè hoặc dán link vào phòng">
        <Chip
          size="small"
          icon={<PersonAddAlt1RoundedIcon sx={{ fontSize: '13px !important', color: '#38bdf8 !important' }} />}
          label="Mời bạn"
          onClick={onCopyRoomLink}
          sx={{
            backgroundColor: 'rgba(56, 189, 248, 0.16)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(56, 189, 248, 0.28)',
            },
          }}
        />
      </Tooltip>

      {/* Action Rời phòng cho Khách */}
      {!isHost && onLeaveRoom && (
        <Tooltip title="Rời phòng và quay về phòng cá nhân của bạn">
          <Chip
            size="small"
            icon={<ExitToAppRoundedIcon sx={{ fontSize: '13px !important', color: '#f87171 !important' }} />}
            label="Rời phòng"
            onClick={onLeaveRoom}
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontWeight: 700,
              fontSize: '0.72rem',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.35)',
                color: '#fff',
              },
            }}
          />
        </Tooltip>
      )}

      {/* Balance Badge if Logged In */}
      {user && (
        <Tooltip title="Số dư ví Lo-Fi hiện tại">
          <Chip
            size="small"
            icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: '13px !important', color: '#fbbf24 !important' }} />}
            label={`${user.tien || 0} Xu`}
            sx={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fef08a',
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          />
        </Tooltip>
      )}

      {/* Study Buddies Avatar Stack */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          alignItems: 'center',
          gap: 1,
          ml: 1,
          pl: 1.5,
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Overlapping Avatars (Số avatar random/hiển thị chính xác theo số người) */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {displayedAvatars.map((src, idx) => (
            <Avatar
              key={idx}
              src={src}
              sx={{
                width: 24,
                height: 24,
                border: '1.5px solid #0f172a',
                ml: idx > 0 ? -1 : 0,
                zIndex: maxVisible - idx,
              }}
            />
          ))}
          {count > 3 && (
            <Avatar
              sx={{
                width: 22,
                height: 22,
                ml: -1,
                fontSize: '0.62rem',
                fontWeight: 800,
                backgroundColor: '#3b82f6',
                border: '1.5px solid #0f172a',
                zIndex: 0,
              }}
            >
              +{count - 3}
            </Avatar>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
          {count} đang học
        </Typography>
      </Box>
    </Box>
  );
}

