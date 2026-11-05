'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { AuthUser } from '@/context/AuthContext';

interface UserProfileCardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function UserProfileCard({ user, onLogout }: UserProfileCardProps) {
  const router = useRouter();

  const handleEnterRoom = () => {
    if (user?.roomId) {
      router.push(`/room/${user.id}?space=${user.roomId}&host=${encodeURIComponent(user.tenDangNhap + "'s Room")}`);
    } else {
      router.push('/');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Profile Info Box */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            backgroundColor: '#818cf8',
            fontSize: '1.4rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(129, 140, 248, 0.4)',
          }}
        >
          {user.tenDangNhap.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }} noWrap>
              {user.tenDangNhap}
            </Typography>
            <Chip
              label="Active"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            @{user.taiKhoan}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Chip
              icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />}
              label={`${user.tien || 0} Xu`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
              }}
            />
            <Chip
              icon={<MeetingRoomRoundedIcon sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
              label={user.roomId}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                backgroundColor: 'rgba(129, 140, 248, 0.15)',
                color: '#c7d2fe',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Enter Room Button */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleEnterRoom}
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{
          py: 1.5,
          borderRadius: 3,
          backgroundColor: '#6366f1',
          fontWeight: 700,
          fontSize: '0.95rem',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          '&:hover': { backgroundColor: '#4f46e5' },
        }}
      >
        VÀO PHÒNG HỌC NGAY
      </Button>

      {/* Logout Button */}
      <Button
        variant="outlined"
        fullWidth
        onClick={onLogout}
        startIcon={<LogoutRoundedIcon />}
        sx={{
          borderRadius: 3,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          color: '#94a3b8',
          '&:hover': {
            borderColor: '#f87171',
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          },
        }}
      >
        Đăng xuất tài khoản
      </Button>
    </Box>
  );
}

