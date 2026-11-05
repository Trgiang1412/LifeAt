'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Switch,
  Chip,
  Paper,
  Tooltip,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import WavesRoundedIcon from '@mui/icons-material/WavesRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import RadioRoundedIcon from '@mui/icons-material/RadioRounded';
import AirRoundedIcon from '@mui/icons-material/AirRounded';
import { soundEngine } from '@/services/soundEngine';
import { SoundTrack } from '@/types';

interface SoundscapeWidgetProps {
  onClose: () => void;
}

const INITIAL_SOUNDS: SoundTrack[] = [
  { id: 'rain', name: 'Rainfall', icon: 'rain', type: 'rain', volume: 60, isPlaying: false },
  { id: 'fire', name: 'Campfire', icon: 'fire', type: 'fire', volume: 50, isPlaying: false },
  { id: 'waves', name: 'Ocean Tide', icon: 'waves', type: 'waves', volume: 50, isPlaying: false },
  { id: 'birds', name: 'Forest Birds', icon: 'birds', type: 'birds', volume: 40, isPlaying: false },
  { id: 'cafe', name: 'Cafe Ambiance', icon: 'cafe', type: 'cafe', volume: 45, isPlaying: false },
  { id: 'keyboard', name: 'Key Clicks', icon: 'keyboard', type: 'keyboard', volume: 35, isPlaying: false },
  { id: 'lofi', name: 'Lofi Chords', icon: 'lofi', type: 'lofi', volume: 55, isPlaying: false },
  { id: 'whitenoise', name: 'White Noise', icon: 'whitenoise', type: 'whitenoise', volume: 30, isPlaying: false },
];

export default function SoundscapeWidget({ onClose }: SoundscapeWidgetProps) {
  const [sounds, setSounds] = useState<SoundTrack[]>(INITIAL_SOUNDS);
  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'rain': return <ThunderstormRoundedIcon fontSize="small" sx={{ color: '#60a5fa' }} />;
      case 'fire': return <LocalFireDepartmentRoundedIcon fontSize="small" sx={{ color: '#f97316' }} />;
      case 'waves': return <WavesRoundedIcon fontSize="small" sx={{ color: '#38bdf8' }} />;
      case 'birds': return <ParkRoundedIcon fontSize="small" sx={{ color: '#4ade80' }} />;
      case 'cafe': return <LocalCafeRoundedIcon fontSize="small" sx={{ color: '#d97706' }} />;
      case 'keyboard': return <KeyboardRoundedIcon fontSize="small" sx={{ color: '#c084fc' }} />;
      case 'lofi': return <RadioRoundedIcon fontSize="small" sx={{ color: '#f43f5e' }} />;
      case 'whitenoise': return <AirRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />;
      default: return <GraphicEqRoundedIcon fontSize="small" />;
    }
  };

  const toggleSound = (soundId: string) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          const nextState = !s.isPlaying;
          if (nextState) {
            soundEngine.playSound(s.type, (s.volume / 100) * (masterVolume / 100));
          } else {
            soundEngine.stopSound(s.type);
          }
          return { ...s, isPlaying: nextState };
        }
        return s;
      })
    );
  };

  const handleVolumeChange = (soundId: string, newVolume: number) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          if (s.isPlaying) {
            soundEngine.setSoundVolume(s.type, (newVolume / 100) * (masterVolume / 100));
          }
          return { ...s, volume: newVolume };
        }
        return s;
      })
    );
  };

  const handleMasterVolume = (_: Event, val: number | number[]) => {
    const vol = Array.isArray(val) ? val[0] : val;
    setMasterVolume(vol);
    soundEngine.setMasterVolume(vol / 100);
  };

  const toggleMasterMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.toggleMute(nextMuted);
  };

  const resetAllSounds = () => {
    soundEngine.stopAll();
    setSounds(INITIAL_SOUNDS);
  };

  const applyPreset = (presetName: string) => {
    soundEngine.stopAll();
    let activeIds: { id: string; vol: number }[] = [];
    if (presetName === 'Rainy Focus') {
      activeIds = [{ id: 'rain', vol: 70 }, { id: 'lofi', vol: 40 }];
    } else if (presetName === 'Coffee Shop') {
      activeIds = [{ id: 'cafe', vol: 60 }, { id: 'keyboard', vol: 40 }];
    } else if (presetName === 'Cabin Night') {
      activeIds = [{ id: 'fire', vol: 70 }, { id: 'rain', vol: 35 }];
    } else if (presetName === 'Nature Zen') {
      activeIds = [{ id: 'birds', vol: 60 }, { id: 'waves', vol: 45 }];
    }

    setSounds((prev) =>
      prev.map((s) => {
        const found = activeIds.find((a) => a.id === s.id);
        if (found) {
          soundEngine.playSound(s.type, (found.vol / 100) * (masterVolume / 100));
          return { ...s, isPlaying: true, volume: found.vol };
        } else {
          return { ...s, isPlaying: false };
        }
      })
    );
  };

  const activeCount = sounds.filter((s) => s.isPlaying).length;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 360,
        maxHeight: 520,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GraphicEqRoundedIcon sx={{ fontSize: 20, color: '#38bdf8' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            SOUND MIXER
          </Typography>
          {activeCount > 0 && (
            <Chip
              size="small"
              label={`${activeCount} active`}
              sx={{ height: 20, fontSize: '0.68rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Stop all sounds">
            <IconButton size="small" onClick={resetAllSounds} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <RestartAltRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Master Volume Bar */}
      <Box sx={{ px: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
        <IconButton size="small" onClick={toggleMasterMute} sx={{ color: isMuted ? '#f87171' : '#38bdf8' }}>
          {isMuted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
        </IconButton>
        <Slider
          size="small"
          value={isMuted ? 0 : masterVolume}
          onChange={handleMasterVolume}
          disabled={isMuted}
          sx={{ color: '#38bdf8' }}
        />
        <Typography variant="caption" sx={{ minWidth: 32, color: '#94a3b8', textAlign: 'right' }}>
          {isMuted ? '0%' : `${masterVolume}%`}
        </Typography>
      </Box>

      {/* Presets Row */}
      <Box sx={{ px: 2, py: 1.2, display: 'flex', gap: 0.8, overflowX: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {['Rainy Focus', 'Coffee Shop', 'Cabin Night', 'Nature Zen'].map((preset) => (
          <Chip
            key={preset}
            size="small"
            clickable
            label={preset}
            onClick={() => applyPreset(preset)}
            sx={{
              fontSize: '0.72rem',
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              color: '#cbd5e1',
              '&:hover': {
                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                color: '#fff',
              },
            }}
          />
        ))}
      </Box>

      {/* Individual Sound Tracks */}
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {sounds.map((sound) => (
          <Box
            key={sound.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 2.5,
              backgroundColor: sound.isPlaying ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.02)',
              border: sound.isPlaying ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Click to play/pause icon */}
            <IconButton
              size="small"
              onClick={() => toggleSound(sound.id)}
              sx={{
                backgroundColor: sound.isPlaying ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  backgroundColor: sound.isPlaying ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {getIcon(sound.type)}
            </IconButton>

            {/* Name */}
            <Box sx={{ width: 95 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: sound.isPlaying ? 600 : 400,
                  color: sound.isPlaying ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.82rem',
                }}
              >
                {sound.name}
              </Typography>
            </Box>

            {/* Volume slider */}
            <Slider
              size="small"
              value={sound.volume}
              disabled={!sound.isPlaying}
              onChange={(_, val) => handleVolumeChange(sound.id, Array.isArray(val) ? val[0] : val)}
              sx={{
                flex: 1,
                color: sound.isPlaying ? '#38bdf8' : '#475569',
              }}
            />

            <Typography variant="caption" sx={{ minWidth: 26, color: sound.isPlaying ? '#cbd5e1' : '#64748b', fontSize: '0.72rem' }}>
              {sound.isPlaying ? `${sound.volume}%` : 'off'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

