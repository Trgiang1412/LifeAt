'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';

export default function AuthHeader() {
  return (
    <Box sx={{ textAlign: 'center', mb: 3 }}>
      {/* Retro Cassette Badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.6,
          borderRadius: 8,
          backgroundColor: 'rgba(236, 72, 153, 0.15)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: '#f472b6',
          mb: 1.5,
        }}
      >
        <MusicNoteRoundedIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
          LO-FI CO-WORKING SPACES
        </Typography>
        <RadioButtonCheckedRoundedIcon sx={{ fontSize: 14, color: '#ef4444' }} />
      </Box>

      {/* Main Brand Title */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #f8fafc 0%, #c7d2fe 50%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 0.5,
        }}
      >
        LifeAt Space
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
        Đăng nhập để vào không gian học tập & làm việc sâu
      </Typography>
    </Box>
  );
}

