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
  Typography,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SparklesIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useAuth } from '@/context/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!taiKhoan.trim() || !matKhau.trim() || !tenDangNhap.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tài khoản, mật khẩu và tên đăng nhập.');
      return;
    }

    setLoading(true);
    const res = await register(taiKhoan, matKhau, tenDangNhap);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
    } else {
      setErrorMsg(res.message || 'Đăng ký không thành công.');
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
        name="lifeat_reg_acc_no_autofill"
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
              <PersonOutlineRoundedIcon sx={{ color: '#ec4899', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&:hover fieldset': { borderColor: '#ec4899' },
            '&.Mui-focused fieldset': { borderColor: '#ec4899' },
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

      {/* Display Name Input */}
      <TextField
        fullWidth
        size="small"
        label="Tên đăng nhập (Tên hiển thị)"
        placeholder="Ví dụ: Trường Giang, Linh Nhi..."
        value={tenDangNhap}
        onChange={(e) => setTenDangNhap(e.target.value)}
        name="lifeat_reg_name_no_autofill"
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
              <BadgeOutlinedIcon sx={{ color: '#ec4899', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&:hover fieldset': { borderColor: '#ec4899' },
            '&.Mui-focused fieldset': { borderColor: '#ec4899' },
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
        name="lifeat_reg_pass_no_autofill"
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
              <LockOutlinedIcon sx={{ color: '#ec4899', fontSize: 20 }} />
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
            '&:hover fieldset': { borderColor: '#ec4899' },
            '&.Mui-focused fieldset': { borderColor: '#ec4899' },
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

      {/* Promotional bonus text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SparklesIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          Tặng ngay <strong style={{ color: '#fbbf24' }}>100 Xu</strong> và một phòng học riêng khi tạo tài khoản!
        </Typography>
      </Box>

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
          backgroundColor: '#ec4899',
          fontWeight: 700,
          fontSize: '0.92rem',
          boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)',
          '&:hover': {
            backgroundColor: '#db2777',
          },
        }}
      >
        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'TẠO TÀI KHOẢN MỚI'}
      </Button>
    </Box>
  );
}
