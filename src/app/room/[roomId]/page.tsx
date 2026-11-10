'use client';

import React, { Suspense, use, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RoomClient from '@/components/RoomClient';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import {
  CircularProgress,
  Box,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

function RoomContent({ paramsPromise }: { paramsPromise: Promise<{ roomId: string }> }) {
  const { roomId } = use(paramsPromise);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const spaceParam = searchParams.get('space') || '';
  const hostParam = searchParams.get('host') || '';

  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{
    roomId: string;
    roomCode: string;
    hostName: string;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const validateRoom = async () => {
      setIsValidating(true);
      setErrorMsg(null);

      try {
        const query = new URLSearchParams();
        query.set('target', roomId);
        if (spaceParam) {
          query.set('space', spaceParam);
        }

        const res = await fetch(`/api/room/resolve?${query.toString()}`);
        const data = await res.json();

        if (isCancelled) return;

        if (!res.ok || !data.success) {
          setErrorMsg(
            data.message || 'Mã phòng hoặc đường dẫn phòng không tồn tại trên hệ thống.'
          );
        } else {
          setRoomData({
            roomId: data.roomId || roomId,
            roomCode: data.roomCode || spaceParam,
            hostName: data.hostName || hostParam || 'Phòng học',
          });
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMsg('Lỗi kiểm tra mã phòng. Vui lòng thử lại sau.');
        }
      } finally {
        if (!isCancelled) {
          setIsValidating(false);
        }
      }
    };

    validateRoom();

    return () => {
      isCancelled = true;
    };
  }, [roomId, spaceParam, hostParam]);

  // 1. Trạng thái đang kiểm tra mã phòng
  if (isValidating) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090a0f',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#06b6d4' }} size={44} thickness={4} />
        <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
          Đang kiểm tra và xác thực mã phòng...
        </Typography>
      </Box>
    );
  }

  // 2. Trạng thái báo lỗi khi mã phòng không tồn tại (Điền link lung tung)
  if (errorMsg || !roomData) {
    const attemptedCode = spaceParam || roomId;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030712',
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.12) 0%, transparent 60%)',
          p: 3,
        }}
      >
        <Paper
          elevation={24}
          sx={{
            maxWidth: 480,
            width: '100%',
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Icon cảnh báo lỗi */}
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              mb: 2.5,
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.3)',
            }}
          >
            <MeetingRoomRoundedIcon sx={{ fontSize: 40 }} />
          </Box>

          <Chip
            icon={<ErrorOutlineRoundedIcon sx={{ fontSize: '1rem !important', color: '#fca5a5' }} />}
            label="MÃ PHÒNG KHÔNG TỒN TẠI"
            size="small"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: 0.5,
              mb: 2,
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#f8fafc',
              mb: 1.2,
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
            }}
          >
            Không tìm thấy phòng học
          </Typography>

          <Typography
            sx={{
              color: '#94a3b8',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            Đường dẫn hoặc mã phòng bạn vừa nhập không tồn tại trên hệ thống. Vui lòng kiểm tra lại liên kết hoặc yêu cầu chủ phòng chia sẻ lại mã phòng chính xác.
          </Typography>

          {/* Hộp hiển thị mã không hợp lệ */}
          <Box
            sx={{
              width: '100%',
              p: 1.5,
              mb: 3.5,
              borderRadius: 2.5,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px dashed rgba(239, 68, 68, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Mã phòng đã nhập:
            </Typography>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: '#fca5a5',
                fontWeight: 700,
                fontFamily: 'monospace',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                px: 1.2,
                py: 0.3,
                borderRadius: 1.5,
              }}
            >
              {attemptedCode}
            </Typography>
          </Box>

          {/* Nút thao tác */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<HomeRoundedIcon />}
              onClick={() => {
                if (user?.id) {
                  router.push(
                    `/room/${user.id}?space=${user.roomId}&host=${encodeURIComponent(`${user.tenDangNhap}'s Room`)}`
                  );
                } else {
                  router.push('/');
                }
              }}
              sx={{
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '0.88rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#fff',
                boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
                },
              }}
            >
              Quay về phòng của tôi
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push('/')}
              sx={{
                py: 1.1,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: '#94a3b8',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                },
              }}
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // 3. Trạng thái phòng hợp lệ -> Hiển thị RoomClient
  return (
    <RoomClient
      roomId={roomData.roomId}
      initialSpaceCode={roomData.roomCode}
      initialHost={roomData.hostName}
    />
  );
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              height: '100vh',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#090a0f',
            }}
          >
            <CircularProgress sx={{ color: '#06b6d4' }} />
          </Box>
        }
      >
        <RoomContent paramsPromise={params} />
      </Suspense>
    </AuthGuard>
  );
}
