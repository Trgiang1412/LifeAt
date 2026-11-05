'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!taiKhoan.trim() || !matKhau.trim()) {
      setErrorMsg('Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    const res = await login(taiKhoan, matKhau);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
    } else {
      setErrorMsg(res.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: 2.5, fontSize: '0.82rem' }}>
          {errorMsg}
        </Alert>
      )}

      {/* Account Input */}
      <TextField
        fullWidth
        size="small"
        label="Tài khoản"
        placeholder="Nhập tên tài khoản..."
        value={taiKhoan}
        onChange={(e) => setTaiKhoan(e.target.value)}
        name="lifeat_account_no_autofill"
        autoComplete="new-password"
        inputProps={{
          autoComplete: 'new-password',
          autoCorrect: 'off',
          spellCheck: false,
          'aria-autocomplete': 'none',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineRoundedIcon sx={{ color: '#818cf8', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&:hover fieldset': { borderColor: '#818cf8' },
            '&.Mui-focused fieldset': { borderColor: '#818cf8' },
          },
          '& .MuiInputLabel-root': { color: '#94a3b8' },
          '& input': {
            color: '#f8fafc',
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
              WebkitBoxShadow: '0 0 0 1000px #181c2e inset !important',
              WebkitTextFillColor: '#f8fafc !important',
              caretColor: '#f8fafc !important',
              transition: 'background-color 5000s ease-in-out 0s',
              borderRadius: 'inherit',
            },
          },
        }}
      />

      {/* Password Input */}
      <TextField
        fullWidth
        size="small"
        type={showPassword ? 'text' : 'password'}
        label="Mật khẩu"
        placeholder="Nhập mật khẩu..."
        value={matKhau}
        onChange={(e) => setMatKhau(e.target.value)}
        name="lifeat_password_no_autofill"
        autoComplete="new-password"
        inputProps={{
          autoComplete: 'new-password',
          autoCorrect: 'off',
          spellCheck: false,
          'aria-autocomplete': 'none',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon sx={{ color: '#818cf8', fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setShowPassword(!showPassword)}
                sx={{ color: '#94a3b8' }}
              >
                {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&:hover fieldset': { borderColor: '#818cf8' },
            '&.Mui-focused fieldset': { borderColor: '#818cf8' },
          },
          '& .MuiInputLabel-root': { color: '#94a3b8' },
          '& input': {
            color: '#f8fafc',
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
              WebkitBoxShadow: '0 0 0 1000px #181c2e inset !important',
              WebkitTextFillColor: '#f8fafc !important',
              caretColor: '#f8fafc !important',
              transition: 'background-color 5000s ease-in-out 0s',
              borderRadius: 'inherit',
            },
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading}
        sx={{
          mt: 1,
          py: 1.3,
          borderRadius: 3,
          backgroundColor: '#6366f1',
          fontWeight: 700,
          fontSize: '0.92rem',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
          '&:hover': {
            backgroundColor: '#4f46e5',
          },
        }}
      >
        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'ĐĂNG NHẬP VÀO PHÒNG'}
      </Button>
    </Box>
  );
}
