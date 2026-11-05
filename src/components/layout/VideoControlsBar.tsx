'use client';

import React, { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Popover,
  Slider,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import Brightness6RoundedIcon from '@mui/icons-material/Brightness6Rounded';
import AspectRatioRoundedIcon from '@mui/icons-material/AspectRatioRounded';
import FitScreenRoundedIcon from '@mui/icons-material/FitScreenRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

interface VideoControlsBarProps {
  is4K?: boolean;
  isYouTube: boolean;
  isYtAudioMuted: boolean;
  fitMode: 'fit' | 'cover';
  zoomScale: number;
  dimLevel: number;
  onToggleAudio: () => void;
  onSetFitMode: (mode: 'fit' | 'cover') => void;
  onSetZoomScale: (scale: number) => void;
  onSetDimLevel: (level: number) => void;
}

export default function VideoControlsBar({
  is4K,
  isYouTube,
  isYtAudioMuted,
  fitMode,
  zoomScale,
  dimLevel,
  onToggleAudio,
  onSetFitMode,
  onSetZoomScale,
  onSetDimLevel,
}: VideoControlsBarProps) {
  const [aspectAnchor, setAspectAnchor] = useState<HTMLElement | null>(null);
  const [brightnessAnchor, setBrightnessAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 76,
        right: 20,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pointerEvents: 'auto',
      }}
    >
      {/* 4K UHD Badge */}
      {is4K && (
        <Chip
          size="small"
          label="4K UHD"
          sx={{
            height: 24,
            fontSize: '0.68rem',
            fontWeight: 800,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
          }}
        />
      )}

      {/* Fit / Zoom Mode Button */}
      <Tooltip title={`Chế độ hiển thị: ${fitMode === 'fit' ? 'Vừa màn hình (Không crop)' : 'Tràn viền'} (Click để chỉnh zoom)`}>
        <IconButton
          size="small"
          onClick={(e) => setAspectAnchor(e.currentTarget)}
          sx={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.95)' },
          }}
        >
          {fitMode === 'fit' ? <FitScreenRoundedIcon sx={{ fontSize: 16 }} /> : <AspectRatioRoundedIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>

      {/* Brightness Control */}
      <Tooltip title={`Độ sáng nền: ${100 - dimLevel}%`}>
        <IconButton
          size="small"
          onClick={(e) => setBrightnessAnchor(e.currentTarget)}
          sx={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.95)' },
          }}
        >
          <Brightness6RoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      {/* Native Video Audio Toggle */}
      {isYouTube && (
        <Tooltip title={isYtAudioMuted ? 'Bật âm thanh video nền' : 'Tắt âm thanh video nền'}>
          <IconButton
            size="small"
            onClick={onToggleAudio}
            sx={{
              backgroundColor: isYtAudioMuted ? 'rgba(15, 23, 42, 0.8)' : 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              '&:hover': {
                backgroundColor: isYtAudioMuted ? 'rgba(15, 23, 42, 0.95)' : '#dc2626',
              },
            }}
          >
            {isYtAudioMuted ? <VolumeOffRoundedIcon sx={{ fontSize: 16 }} /> : <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      )}

      {/* Aspect Ratio / Zoom Popover */}
      <Popover
        open={Boolean(aspectAnchor)}
        anchorEl={aspectAnchor}
        onClose={() => setAspectAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 2,
            width: 250,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            mt: 1,
          },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', display: 'block', mb: 1 }}>
          CHẾ ĐỘ KHUNG HÌNH VIDEO
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant={fitMode === 'fit' ? 'contained' : 'outlined'}
            onClick={() => {
              onSetFitMode('fit');
              onSetZoomScale(1.0);
            }}
            sx={{
              flex: 1,
              fontSize: '0.72rem',
              py: 0.6,
              borderRadius: 2,
              backgroundColor: fitMode === 'fit' ? '#818cf8' : 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
            }}
          >
            Vừa màn hình (Không crop)
          </Button>
          <Button
            size="small"
            variant={fitMode === 'cover' ? 'contained' : 'outlined'}
            onClick={() => {
              onSetFitMode('cover');
              onSetZoomScale(1.0);
            }}
            sx={{
              flex: 1,
              fontSize: '0.72rem',
              py: 0.6,
              borderRadius: 2,
              backgroundColor: fitMode === 'cover' ? '#818cf8' : 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
            }}
          >
            Tràn viền (Fill)
          </Button>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            Độ thu phóng (Zoom): {Math.round(zoomScale * 100)}%
          </Typography>
          <Tooltip title="Đặt lại 100%">
            <IconButton size="small" onClick={() => onSetZoomScale(1.0)} sx={{ color: '#94a3b8', p: 0.2 }}>
              <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Slider
          size="small"
          value={zoomScale}
          min={0.7}
          max={1.3}
          step={0.02}
          onChange={(_, val) => onSetZoomScale(Array.isArray(val) ? val[0] : val)}
          sx={{ color: '#818cf8' }}
        />
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', display: 'block', mt: 0.5 }}>
          Kéo sang trái để thu nhỏ nếu video bị mất góc cạnh
        </Typography>
      </Popover>

      {/* Brightness Popover */}
      <Popover
        open={Boolean(brightnessAnchor)}
        anchorEl={brightnessAnchor}
        onClose={() => setBrightnessAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 2,
            width: 220,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            mt: 1,
          },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', display: 'block', mb: 1 }}>
          ĐỘ SÁNG VIDEO NỀN: {100 - dimLevel}%
        </Typography>
        <Slider
          size="small"
          value={100 - dimLevel}
          min={20}
          max={100}
          step={5}
          onChange={(_, val) => onSetDimLevel(100 - (Array.isArray(val) ? val[0] : val))}
          sx={{ color: '#818cf8' }}
        />
      </Popover>
    </Box>
  );
}

