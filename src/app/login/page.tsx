'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthHeader from '@/components/auth/AuthHeader';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import UserProfileCard from '@/components/auth/UserProfileCard';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const handleAuthSuccess = () => {
    // When logged in or registered, redirect to main room
    router.push('/');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        backgroundColor: '#090a12',
      }}
    >
      {/* Decoupled 4K Lo-Fi Video Background */}
      <AuthBackground />

      {/* Main Glassmorphic Auth Card */}
      <Paper
        elevation={24}
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 440,
          borderRadius: 5,
          p: { xs: 3, sm: 4 },
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(129, 140, 248, 0.15)',
        }}
      >
        {/* Decoupled Lo-Fi Cassette Header */}
        <AuthHeader />

        {/* If user is already logged in, show UserProfileCard */}
        {user ? (
          <UserProfileCard user={user} onLogout={logout} />
        ) : (
          /* Login / Register Tab & Form */
          <Box>
            <Tabs
              value={tab}
              onChange={(_, val) => setTab(val)}
              variant="fullWidth"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 3,
                p: 0.5,
                '& .MuiTab-root': {
                  borderRadius: 2.5,
                  minHeight: 40,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  '&.Mui-selected': {
                    color: '#fff',
                    backgroundColor: tab === 'login' ? 'rgba(99, 102, 241, 0.85)' : 'rgba(236, 72, 153, 0.85)',
                  },
                },
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              <Tab label="Đăng nhập" value="login" />
              <Tab label="Đăng ký mới" value="register" />
            </Tabs>

            {tab === 'login' ? (
              <LoginForm onSuccess={handleAuthSuccess} />
            ) : (
              <RegisterForm onSuccess={handleAuthSuccess} />
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
