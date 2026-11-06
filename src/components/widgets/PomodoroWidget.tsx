'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/services/soundEngine';
import { PomodoroMode, PomodoroSettings } from '@/types';

interface PomodoroWidgetProps {
  onClose: () => void;
  onMinimize?: () => void;
  settings: PomodoroSettings;
  onSessionComplete?: () => void;
  isHost?: boolean;
  hostName?: string;
  syncedTimer?: {
    mode: PomodoroMode;
    timeLeft: number;
    isActive: boolean;
    lastUpdated: number;
  } | null;
  onTimerUpdate?: (timer: {
    mode: PomodoroMode;
    timeLeft: number;
    isActive: boolean;
    lastUpdated: number;
  }) => void;
}

export default function PomodoroWidget({
  onClose,
  onMinimize,
  settings,
  onSessionComplete,
  isHost = true,
  hostName,
  syncedTimer,
  onTimerUpdate,
}: PomodoroWidgetProps) {
  const [mode, setMode] = useState<PomodoroMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Keep ref to avoid stale closure in timer
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const getDurationForMode = (m: PomodoroMode) => {
    switch (m) {
      case 'pomodoro':
        return settings.pomodoroTime * 60;
      case 'shortBreak':
        return settings.shortBreakTime * 60;
      case 'longBreak':
        return settings.longBreakTime * 60;
    }
  };

  // Đồng bộ đồng hồ từ chủ phòng nếu là khách
  useEffect(() => {
    if (isHost || !syncedTimer) return;

    if (syncedTimer.mode && syncedTimer.mode !== modeRef.current) {
      setMode(syncedTimer.mode);
    }

    const elapsed = syncedTimer.isActive
      ? Math.floor((Date.now() - syncedTimer.lastUpdated) / 1000)
      : 0;
    const currentLeft = Math.max(0, syncedTimer.timeLeft - elapsed);
    setTimeLeft(currentLeft);
    setIsActive(syncedTimer.isActive);
  }, [syncedTimer, isHost]);

  const handleModeChange = (newMode: PomodoroMode) => {
    if (!isHost) return;
    setMode(newMode);
    setIsActive(false);
    const newDuration = getDurationForMode(newMode);
    setTimeLeft(newDuration);
    if (onTimerUpdate) {
      onTimerUpdate({
        mode: newMode,
        timeLeft: newDuration,
        isActive: false,
        lastUpdated: Date.now(),
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play chime
      soundEngine.playChime?.();

      if (modeRef.current === 'pomodoro') {
        // Pomodoro complete!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        const nextCompleted = completedSessions + 1;
        setCompletedSessions(nextCompleted);
        onSessionComplete?.();

        if (isHost) {
          if (nextCompleted % settings.longBreakInterval === 0) {
            handleModeChange('longBreak');
          } else {
            handleModeChange('shortBreak');
          }
        }
      } else if (isHost) {
        handleModeChange('pomodoro');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, completedSessions, settings, isHost]);

  const toggleTimer = () => {
    if (!isHost) return;
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (onTimerUpdate) {
      onTimerUpdate({
        mode,
        timeLeft,
        isActive: nextActive,
        lastUpdated: Date.now(),
      });
    }
  };

  const resetTimer = () => {
    if (!isHost) return;
    setIsActive(false);
    const newDuration = getDurationForMode(mode);
    setTimeLeft(newDuration);
    if (onTimerUpdate) {
      onTimerUpdate({
        mode,
        timeLeft: newDuration,
        isActive: false,
        lastUpdated: Date.now(),
      });
    }
  };

  const skipTimer = () => {
    if (!isHost) return;
    setIsActive(false);
    if (mode === 'pomodoro') {
      handleModeChange('shortBreak');
    } else {
      handleModeChange('pomodoro');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalModeDuration = getDurationForMode(mode);
  const progressPercent = ((totalModeDuration - timeLeft) / totalModeDuration) * 100;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 320,
        p: 2.5,
        borderRadius: 4,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Header */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerRoundedIcon sx={{ fontSize: 20, color: '#818cf8' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            POMODORO
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {onMinimize && (
            <Tooltip title="Ẩn (Thời gian vẫn chạy)" placement="top">
              <IconButton
                size="small"
                onClick={onMinimize}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  p: 0.5,
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <MinimizeRoundedIcon sx={{ fontSize: 18, transform: 'translateY(-3px)' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Đóng" placement="top">
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                p: 0.5,
                '&:hover': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Sync Badge if Member/Guest */}
      {!isHost && (
        <Chip
          size="small"
          label={`🕒 Đồng bộ theo Host: ${hostName || 'Chủ phòng'}`}
          sx={{
            mb: 1.5,
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 700,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
          }}
        />
      )}

      {/* Mode Selector Buttons */}
      <ButtonGroup
        size="small"
        variant="text"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 8,
          p: 0.5,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Button
          onClick={() => handleModeChange('pomodoro')}
          disabled={!isHost}
          sx={{
            borderRadius: 6,
            fontSize: '0.75rem',
            px: 1.5,
            py: 0.6,
            backgroundColor: mode === 'pomodoro' ? 'rgba(99, 102, 241, 0.9)' : 'transparent',
            color: mode === 'pomodoro' ? '#fff' : '#94a3b8',
            '&:hover': {
              backgroundColor: mode === 'pomodoro' ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Pomodoro
        </Button>
        <Button
          onClick={() => handleModeChange('shortBreak')}
          disabled={!isHost}
          sx={{
            borderRadius: 6,
            fontSize: '0.75rem',
            px: 1.5,
            py: 0.6,
            backgroundColor: mode === 'shortBreak' ? 'rgba(16, 185, 129, 0.9)' : 'transparent',
            color: mode === 'shortBreak' ? '#fff' : '#94a3b8',
            '&:hover': {
              backgroundColor: mode === 'shortBreak' ? 'rgba(16, 185, 129, 1)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Short Break
        </Button>
        <Button
          onClick={() => handleModeChange('longBreak')}
          disabled={!isHost}
          sx={{
            borderRadius: 6,
            fontSize: '0.75rem',
            px: 1.5,
            py: 0.6,
            backgroundColor: mode === 'longBreak' ? 'rgba(14, 165, 233, 0.9)' : 'transparent',
            color: mode === 'longBreak' ? '#fff' : '#94a3b8',
            '&:hover': {
              backgroundColor: mode === 'longBreak' ? 'rgba(14, 165, 233, 1)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Long Break
        </Button>
      </ButtonGroup>

      {/* Main Countdown Display */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          my: 1,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            letterSpacing: 2,
            fontFamily: 'monospace',
            color: mode === 'pomodoro' ? '#f8fafc' : mode === 'shortBreak' ? '#34d399' : '#38bdf8',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {formattedTime}
        </Typography>

        {/* Progress Bar */}
        <Box
          sx={{
            width: 220,
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mt: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: mode === 'pomodoro' ? '#6366f1' : mode === 'shortBreak' ? '#10b981' : '#0ea5e9',
              transition: 'width 1s linear',
            }}
          />
        </Box>
      </Box>

      {/* Action Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
        <Tooltip title={!isHost ? 'Chỉ chủ phòng mới có thể reset' : 'Đặt lại đồng hồ'}>
          <span>
            <IconButton onClick={resetTimer} disabled={!isHost} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={!isHost ? 'Đồng hồ được điều khiển đồng bộ bởi chủ phòng' : (isActive ? 'Tạm dừng' : 'Bắt đầu')}>
          <span>
            <Button
              variant="contained"
              onClick={toggleTimer}
              disabled={!isHost}
              sx={{
                minWidth: 120,
                height: 48,
                borderRadius: 8,
                backgroundColor: isActive ? 'rgba(239, 68, 68, 0.85)' : 'rgba(99, 102, 241, 0.95)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                gap: 1,
                '&:hover': {
                  backgroundColor: isActive ? '#dc2626' : '#4f46e5',
                },
                '&.Mui-disabled': {
                  backgroundColor: isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              {isActive ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
              {isActive ? 'PAUSE' : 'START'}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={!isHost ? 'Chỉ chủ phòng mới có thể chuyển phiên' : 'Chuyển phiên kế tiếp'}>
          <span>
            <IconButton onClick={skipTimer} disabled={!isHost} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <SkipNextRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Session counter chips */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5 }}>
        <Chip
          size="small"
          label={`Cycle: ${completedSessions % settings.longBreakInterval + 1}/${settings.longBreakInterval}`}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#94a3b8',
            fontSize: '0.72rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        />
        <Chip
          size="small"
          label={`Completed: ${completedSessions} 🍅`}
          sx={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            fontSize: '0.72rem',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        />
      </Box>
    </Paper>
  );
}

