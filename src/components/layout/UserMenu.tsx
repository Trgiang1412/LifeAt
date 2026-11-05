'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) {
    return (
      <Button
        component={Link}
        href="/login"
        size="small"
        startIcon={<LoginRoundedIcon sx={{ fontSize: '1rem !important' }} />}
        sx={{
          ml: 0.5,
          color: '#fff',
          fontSize: '0.78rem',
          fontWeight: 700,
          px: 1.5,
          borderRadius: 3,
          backgroundColor: 'rgba(236, 72, 153, 0.85)',
          '&:hover': { backgroundColor: '#db2777' },
        }}
      >
        Đăng nhập
      </Button>
    );
  }

  return (
    <>
      <Tooltip title={`Tài khoản: ${user.tenDangNhap}`}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ ml: 0.5, p: 0.3 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {user.tenDangNhap.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            minWidth: 190,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {user.tenDangNhap}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            @{user.taiKhoan}
          </Typography>
          <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', mt: 0.5 }}>
            💰 {user.tien} Xu Lo-Fi
          </Typography>
        </Box>

        <MenuItem component={Link} href="/login" onClick={() => setAnchorEl(null)}>
          <ListItemIcon sx={{ color: '#818cf8' }}>
            <PersonOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Hồ sơ tài khoản" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
          }}
          sx={{ color: '#f87171' }}
        >
          <ListItemIcon sx={{ color: '#f87171' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
      </Menu>
    </>
  );
}

