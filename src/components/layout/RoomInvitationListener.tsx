'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface PendingInvitation {
  id: string;
  senderId: string;
  senderName: string;
  senderRoomId: string;
  senderRoomName: string;
  roomUrl: string;
  createdAt: string;
}

// Hàm phát âm thanh chuông thông báo nhẹ nhàng qua Web Audio API
function playChimeSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Chuông 2 nốt ding-dong êm dịu
    playTone(587.33, 0, 0.4); // D5
    playTone(880.0, 0.15, 0.6); // A5
  } catch {
    // Bỏ qua lỗi audio
  }
}

export default function RoomInvitationListener() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [activeInvite, setActiveInvite] = useState<PendingInvitation | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Polling lấy danh sách lời mời chờ
  useEffect(() => {
    if (!user || !token) {
      setActiveInvite(null);
      return;
    }

    const checkInvitations = async () => {
      try {
        const res = await fetch('/api/room/invitations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data && data.invitations && data.invitations.length > 0) {
          const latest = data.invitations[0] as PendingInvitation;

          // Nếu là lời mời mới chưa thông báo
          if (!notifiedIdsRef.current.has(latest.id)) {
            notifiedIdsRef.current.add(latest.id);
            setActiveInvite(latest);
            playChimeSound();
          }
        }
      } catch {
        // Bỏ qua lỗi mạng nền
      }
    };

    // Kiểm tra ngay khi mount
    checkInvitations();

    // Chu kỳ 3.5 giây kiểm tra 1 lần
    const interval = setInterval(checkInvitations, 3500);

    return () => clearInterval(interval);
  }, [user, token]);

  // Phản hồi lời mời
  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!activeInvite || !token) return;

    setIsResponding(true);

    try {
      const res = await fetch('/api/room/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invitationId: activeInvite.id,
          action,
        }),
      });

      const data = await res.json();

      if (action === 'accept' && data.roomUrl) {
        setActiveInvite(null);
        router.push(data.roomUrl);
      } else {
        setActiveInvite(null);
      }
    } catch {
      setActiveInvite(null);
    } finally {
      setIsResponding(false);
    }
  };

  if (!activeInvite) return null;

  return (
    <Dialog
      open={Boolean(activeInvite)}
      onClose={() => handleRespond('decline')}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(30px)',
          border: '1.5px solid rgba(129, 140, 248, 0.4)',
          color: '#fff',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.35)',
          overflow: 'hidden',
          animation: 'pulseGlow 2s infinite alternate',
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        {/* Top Icon & Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <NotificationsActiveRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: 0.5 }}>
              LỜI MỜI VÀO PHÒNG HỌC
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => handleRespond('decline')} sx={{ color: '#94a3b8' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Sender details */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              backgroundColor: '#6366f1',
              fontWeight: 800,
              fontSize: '1.1rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {activeInvite.senderName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>{activeInvite.senderName}</span> vừa mời bạn tham gia:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#818cf8', lineHeight: 1.2 }}>
              {activeInvite.senderRoomName}
            </Typography>
          </Box>
        </Box>

        {/* Room Info Pill Box */}
        <Box
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: 2.5,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomRoundedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
              Mã phòng:
            </Typography>
          </Box>
          <Chip
            size="small"
            label={activeInvite.senderRoomId}
            sx={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.74rem',
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleRespond('decline')}
            disabled={isResponding}
            sx={{
              borderRadius: 2.5,
              py: 1,
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'none',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#94a3b8',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
              },
            }}
          >
            Từ chối
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={() => handleRespond('accept')}
            disabled={isResponding}
            startIcon={isResponding ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckRoundedIcon />}
            sx={{
              borderRadius: 2.5,
              py: 1,
              fontSize: '0.82rem',
              fontWeight: 800,
              textTransform: 'none',
              backgroundColor: '#818cf8',
              color: '#090a0f',
              boxShadow: '0 4px 14px rgba(129, 140, 248, 0.4)',
              '&:hover': {
                backgroundColor: '#6366f1',
                color: '#fff',
              },
            }}
          >
            Vào phòng ngay 🚀
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

