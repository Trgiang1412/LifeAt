'use client';

import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#090a0f',
        color: '#f8fafc',
        gap: 2,
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: 800, color: '#818cf8' }}>
        404
      </Typography>
      <Typography variant="h6">Không tìm thấy phòng này</Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        sx={{
          backgroundColor: '#6366f1',
          '&:hover': { backgroundColor: '#4f46e5' },
        }}
      >
        Về phòng mặc định
      </Button>
    </Box>
  );
}
