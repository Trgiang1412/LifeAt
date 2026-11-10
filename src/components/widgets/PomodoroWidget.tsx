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
  onTimeChange?: (timeString: string, isRunning: boolean) => void;
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
  onTimeChange,
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
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const onTimerUpdateRef = useRef(onTimerUpdate);
  onTimerUpdateRef.current = onTimerUpdate;

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

    // Nếu thời gian đã hết (currentLeft === 0) mà timer server vẫn báo isActive,
    // khách không chạy tiếp trạng thái isActive nữa để tránh kẹt ở 00:00
    if (currentLeft === 0) {
      setTimeLeft(0);
      setIsActive(false);
    } else {
      setTimeLeft(currentLeft);
      setIsActive(syncedTimer.isActive);
    }
  }, [syncedTimer, isHost]);

  // Khi chủ phòng cập nhật cài đặt thời gian (ví dụ chỉnh 2p, 1p, 15p trong SettingsModal),
  // cập nhật ngay lập tức thời gian đếm ngược nếu đồng hồ chưa chạy
  useEffect(() => {
    if (!isActive && isHost) {
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
    }
  }, [
    settings.pomodoroTime,
    settings.shortBreakTime,
    settings.longBreakTime,
    settings.longBreakInterval,
    mode,
    isHost,
  ]);

  const handleModeChange = (newMode: PomodoroMode, autoStart = false) => {
    if (!isHost) return;
    setMode(newMode);
    setIsActive(autoStart);
    const newDuration = getDurationForMode(newMode);
    setTimeLeft(newDuration);
    if (onTimerUpdate) {
      onTimerUpdate({
        mode: newMode,
        timeLeft: newDuration,
        isActive: autoStart,
        lastUpdated: Date.now(),
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft <= 0 && isActive) {
      // Âm thanh chuông báo mỗi lần chuyển phiên
      soundEngine.playChime?.();

      if (modeRef.current === 'pomodoro') {
        // Hoàn thành phiên Pomodoro 25p
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        const nextCompleted = completedSessions + 1;
        setCompletedSessions(nextCompleted);
        onSessionComplete?.();

        if (isHostRef.current) {
          // Kiểm tra xem đã đủ số vòng cài đặt (longBreakInterval) chưa
          const isCycleComplete = nextCompleted % settings.longBreakInterval === 0;
          if (isCycleComplete) {
            // Đủ số vòng: Tự động chuyển sang Long Break (tự chạy nếu autoStartBreaks bật)
            handleModeChange('longBreak', settings.autoStartBreaks ?? true);
          } else {
            // Chưa đủ: Tự động chuyển sang Short Break (tự chạy nếu autoStartBreaks bật)
            handleModeChange('shortBreak', settings.autoStartBreaks ?? true);
          }
        }
      } else if (modeRef.current === 'shortBreak') {
        // Sau khi nghỉ ngắn xong: Tự động quay lại Pomodoro cho vòng tiếp theo (tự chạy nếu autoStartPomodoros bật)
        if (isHostRef.current) {
          handleModeChange('pomodoro', settings.autoStartPomodoros ?? true);
        }
      } else if (modeRef.current === 'longBreak') {
        // Sau khi chạy xong Long Break: ĐÃ KẾT THÚC TRỌN VẸN CHU KỲ!
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.5 },
        });
        if (isHostRef.current) {
          // Lúc này mới kết thúc chu kỳ: Dừng đồng hồ, chuyển về Pomodoro sẵn sàng cho chu kỳ mới
          handleModeChange('pomodoro', false);
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, completedSessions, settings]);

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
    if (mode === 'pomodoro') {
      const nextCompleted = completedSessions + 1;
      setCompletedSessions(nextCompleted);
      const isCycleComplete = nextCompleted % settings.longBreakInterval === 0;
      handleModeChange(isCycleComplete ? 'longBreak' : 'shortBreak', false);
    } else {
      handleModeChange('pomodoro', false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  useEffect(() => {
    onTimeChange?.(formattedTime, isActive);
  }, [formattedTime, isActive, onTimeChange]);

  const totalModeDuration = getDurationForMode(mode);
  const progressPercent = ((totalModeDuration - timeLeft) / totalModeDuration) * 100;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 320,
        p: 2.5,
        borderRadius: 2,
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
          onClick={() => handleModeChange('pomodoro', false)}
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
          onClick={() => handleModeChange('shortBreak', false)}
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
          onClick={() => handleModeChange('longBreak', false)}
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
          label={
            mode === 'longBreak'
              ? `Long Break (${settings.longBreakInterval}/${settings.longBreakInterval}) 🎉`
              : `Cycle: ${(completedSessions % settings.longBreakInterval) + 1}/${settings.longBreakInterval}`
          }
          sx={{
            backgroundColor: mode === 'longBreak' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            color: mode === 'longBreak' ? '#38bdf8' : '#94a3b8',
            fontSize: '0.72rem',
            border: mode === 'longBreak' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
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

