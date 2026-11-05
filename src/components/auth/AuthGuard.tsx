'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/app/login/page';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // If still checking token
  if (isLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090a12',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#818cf8' }} size={42} />
        <Typography variant="body2" sx={{ color: '#94a3b8', letterSpacing: 1 }}>
          Đang kết nối không gian LifeAt Lo-Fi...
        </Typography>
      </Box>
    );
  }

  // If user is not logged in, enforce login first!
  if (!user) {
    return <LoginPage />;
  }

  // User is logged in -> render protected room
  return <>{children}</>;
}

