'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

interface CalendarWidgetProps {
  onClose: () => void;
}

interface ScheduleBlock {
  id: string;
  time: string;
  title: string;
  type: 'focus' | 'break' | 'meeting';
  done: boolean;
}

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { id: '1', time: '09:00 - 10:30', title: 'Deep Work: Lập trình frontend', type: 'focus', done: true },
  { id: '2', time: '10:30 - 11:00', title: 'Nghỉ giải lao & cà phê', type: 'break', done: true },
  { id: '3', time: '11:00 - 12:00', title: 'Review Code & Unit Tests', type: 'focus', done: false },
  { id: '4', time: '14:00 - 16:30', title: 'Tối ưu UI Material Next.js', type: 'focus', done: false },
  { id: '5', time: '16:30 - 17:30', title: 'Tổng kết ngày & Kế hoạch mai', type: 'meeting', done: false },
];

export default function CalendarWidget({ onClose }: CalendarWidgetProps) {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(DEFAULT_SCHEDULE);

  const toggleDone = (id: string) => {
    setSchedule(schedule.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <Paper
      elevation={8}
      sx={{
        width: 350,
        height: 480,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 20, color: '#10b981' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            DAILY AGENDA
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Date banner */}
      <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#10b981' }} />
        <Typography variant="caption" sx={{ color: '#cbd5e1', textTransform: 'capitalize', fontWeight: 600 }}>
          {todayStr}
        </Typography>
      </Box>

      {/* Timeline items */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {schedule.map((item) => (
          <Box
            key={item.id}
            onClick={() => toggleDone(item.id)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.2,
              borderRadius: 2.5,
              cursor: 'pointer',
              backgroundColor: item.done ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              borderLeft: `4px solid ${
                item.type === 'focus' ? '#6366f1' : item.type === 'break' ? '#10b981' : '#f59e0b'
              }`,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <IconButton size="small" sx={{ p: 0.2, mt: 0.2 }}>
              {item.done ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#10b981' }} />
              ) : (
                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: '#64748b' }} />
              )}
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: item.done ? '#64748b' : '#f1f5f9',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}
              >
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                {item.time}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

