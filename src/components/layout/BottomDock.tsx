'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import WallpaperRoundedIcon from '@mui/icons-material/WallpaperRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { ActiveWidget } from '@/types';

interface BottomDockProps {
  activeWidgets: Set<ActiveWidget>;
  onToggleWidget: (widget: ActiveWidget) => void;
  onOpenSpaces: () => void;
  onOpenSettings: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  isTimerMinimized?: boolean;
}

export default function BottomDock({
  activeWidgets,
  onToggleWidget,
  onOpenSpaces,
  onOpenSettings,
  isZenMode,
  onToggleZenMode,
  isTimerMinimized,
}: BottomDockProps) {
  const router = useRouter();

  if (isZenMode) {
    return (
      <Tooltip title="Hiện thanh công cụ (Z)" placement="top">
        <IconButton
          onClick={onToggleZenMode}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            p: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <VisibilityRoundedIcon />
        </IconButton>
      </Tooltip>
    );
  }

  const dockItems: { id: ActiveWidget; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'timer', label: 'Pomodoro Timer', icon: <TimerRoundedIcon />, color: '#818cf8' },
    { id: 'sounds', label: 'Sound Mixer', icon: <GraphicEqRoundedIcon />, color: '#38bdf8' },
    { id: 'tasks', label: 'To-Do Tasks', icon: <FormatListBulletedRoundedIcon />, color: '#c084fc' },
    { id: 'notes', label: 'Scratchpad Notes', icon: <EditNoteRoundedIcon />, color: '#fbbf24' },
    { id: 'music', label: 'Lofi Music Radio', icon: <MusicNoteRoundedIcon />, color: '#f472b6' },
    { id: 'chat', label: 'Room Members & Chat', icon: <GroupRoundedIcon />, color: '#2dd4bf' },
    { id: 'calendar', label: 'Daily Agenda', icon: <CalendarMonthRoundedIcon />, color: '#34d399' },
  ];

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Spaces background picker */}
        <Tooltip title="Đổi không gian (Spaces)" placement="top">
          <IconButton
            onClick={onOpenSpaces}
            sx={{
              color: '#f8fafc',
              p: 1.2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <WallpaperRoundedIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* Widgets Toggles */}
        {dockItems.map((item) => {
          const isTimer = item.id === 'timer';
          const isWidgetOpen = activeWidgets.has(item.id);
          const isMinimized = isTimer && isTimerMinimized;
          const isActive = isWidgetOpen && !isMinimized;

          let tooltipTitle = item.label;
          if (isTimer && isWidgetOpen && isMinimized) {
            tooltipTitle = 'Pomodoro Timer (Đang chạy ngầm - Nhấp để hiện)';
          }

          return (
            <Tooltip key={item.id} title={tooltipTitle} placement="top">
              <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  onClick={() => onToggleWidget(item.id)}
                  sx={{
                    color: isActive
                      ? item.color
                      : isMinimized
                      ? '#a5b4fc'
                      : 'rgba(255, 255, 255, 0.65)',
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.1)'
                      : isMinimized
                      ? 'rgba(129, 140, 248, 0.18)'
                      : 'transparent',
                    p: 1.2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateY(-2px)',
                      color: item.color,
                    },
                  }}
                >
                  {item.icon}
                </IconButton>
                {/* Active indicator dot */}
                {isWidgetOpen && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: isMinimized ? '#a5b4fc' : item.color,
                      boxShadow: `0 0 8px ${item.color}`,
                      opacity: isMinimized ? 0.7 : 1,
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* Settings button */}
        <Tooltip title="Cài đặt phòng" placement="top">
          <IconButton
            onClick={onOpenSettings}
            sx={{
              color: 'rgba(255, 255, 255, 0.65)',
              p: 1.2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <SettingsRoundedIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* The English-speaking world Portal (Icon Trái Đất) */}
        <Tooltip title="The English-speaking world" placement="top">
          <IconButton
            onClick={() => router.push('/english-world')}
            sx={{
              p: 1.2,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.35) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.5) 0%, rgba(59, 130, 246, 0.7) 100%)',
                color: '#ffffff',
                transform: 'translateY(-3px) scale(1.1)',
                boxShadow: '0 0 24px rgba(56, 189, 248, 0.6)',
              },
            }}
          >
            <PublicRoundedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}
