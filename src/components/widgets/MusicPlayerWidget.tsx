'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import { soundEngine } from '@/services/soundEngine';

interface MusicPlayerWidgetProps {
  onClose: () => void;
}

const CHANNELS = [
  { id: 'lofi-beats', title: 'Chill Lo-Fi Beats', artist: 'ChilledCow / Lofi Girl Vibes', genre: 'Lo-Fi Hip Hop' },
  { id: 'synthwave', title: 'Synthwave Night Drive', artist: 'Retro Wave Dreams', genre: 'Synthwave' },
  { id: 'piano', title: 'Peaceful Piano Focus', artist: 'Solitude Melodies', genre: 'Acoustic Piano' },
  { id: 'deep-ambient', title: 'Theta Waves Meditation', artist: 'Binaural Deep Study', genre: 'Ambient' },
];

export default function MusicPlayerWidget({ onClose }: MusicPlayerWidgetProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  const track = CHANNELS[currentIdx];

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      soundEngine.playSound('lofi', (volume / 100));
    } else {
      soundEngine.stopSound('lofi');
    }
  };

  const nextTrack = () => {
    setCurrentIdx((prev) => (prev + 1) % CHANNELS.length);
    if (!isPlaying) {
      setIsPlaying(true);
      soundEngine.playSound('lofi', (volume / 100));
    }
  };

  const prevTrack = () => {
    setCurrentIdx((prev) => (prev - 1 + CHANNELS.length) % CHANNELS.length);
    if (!isPlaying) {
      setIsPlaying(true);
      soundEngine.playSound('lofi', (volume / 100));
    }
  };

  const handleVolume = (_: Event, val: number | number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    setVolume(v);
    if (isPlaying) {
      soundEngine.setSoundVolume('lofi', v / 100);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        width: 320,
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MusicNoteRoundedIcon sx={{ fontSize: 20, color: '#ec4899' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            LO-FI RADIO
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Album Artwork / Visualizer */}
      <Box
        sx={{
          height: 120,
          borderRadius: 3,
          backgroundColor: 'rgba(236, 72, 153, 0.12)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        {/* Animated equalizer waves */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, height: 40, mb: 1 }}>
          {[12, 28, 40, 24, 34, 18, 30].map((h, i) => (
            <Box
              key={i}
              sx={{
                width: 4,
                height: isPlaying ? h : 4,
                backgroundColor: '#ec4899',
                borderRadius: 2,
                transition: 'height 0.3s ease-in-out',
                animation: isPlaying ? `bounce 0.8s ease-in-out infinite alternate ${i * 0.12}s` : 'none',
                '@keyframes bounce': {
                  '0%': { height: 6 },
                  '100%': { height: 38 },
                },
              }}
            />
          ))}
        </Box>

        <Chip
          size="small"
          label={track.genre}
          sx={{
            height: 20,
            fontSize: '0.65rem',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#f472b6',
          }}
        />
      </Box>

      {/* Track Info */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }} noWrap>
          {track.title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {track.artist}
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={prevTrack} sx={{ color: '#cbd5e1' }}>
          <SkipPreviousRoundedIcon />
        </IconButton>
        <IconButton
          onClick={togglePlay}
          sx={{
            backgroundColor: '#ec4899',
            color: '#fff',
            p: 1.5,
            '&:hover': { backgroundColor: '#db2777' },
          }}
        >
          {isPlaying ? <PauseRoundedIcon sx={{ fontSize: 28 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 28 }} />}
        </IconButton>
        <IconButton onClick={nextTrack} sx={{ color: '#cbd5e1' }}>
          <SkipNextRoundedIcon />
        </IconButton>
      </Box>

      {/* Volume Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
        <IconButton size="small" onClick={() => setIsMuted(!isMuted)} sx={{ color: '#94a3b8' }}>
          {isMuted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
        </IconButton>
        <Slider
          size="small"
          value={isMuted ? 0 : volume}
          onChange={handleVolume}
          disabled={isMuted}
          sx={{ color: '#ec4899' }}
        />
        <Typography variant="caption" sx={{ minWidth: 28, color: '#94a3b8', fontSize: '0.72rem' }}>
          {isMuted ? '0%' : `${volume}%`}
        </Typography>
      </Box>
    </Paper>
  );
}

