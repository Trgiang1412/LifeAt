'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { PomodoroSettings } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSaveSettings: (newSettings: PomodoroSettings) => void;
}

export default function SettingsModal({ open, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [form, setForm] = React.useState<PomodoroSettings>(settings);

  React.useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveSettings(form);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#f8fafc',
        },
      }}
    >
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsRoundedIcon sx={{ color: '#818cf8', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              CÀI ĐẶT PHÒNG
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Timer Config */}
        <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: 0.5 }}>
          THỜI GIAN ĐỒNG HỒ (PHÚT)
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Pomodoro
            </Typography>
            <TextField
              type="number"
              size="small"
              value={form.pomodoroTime}
              onChange={(e) => handleChange('pomodoroTime', Math.max(1, parseInt(e.target.value) || 1))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                },
                '& input': { color: '#f8fafc', textAlign: 'center' },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Nghỉ ngắn
            </Typography>
            <TextField
              type="number"
              size="small"
              value={form.shortBreakTime}
              onChange={(e) => handleChange('shortBreakTime', Math.max(1, parseInt(e.target.value) || 1))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                },
                '& input': { color: '#f8fafc', textAlign: 'center' },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Nghỉ dài
            </Typography>
            <TextField
              type="number"
              size="small"
              value={form.longBreakTime}
              onChange={(e) => handleChange('longBreakTime', Math.max(1, parseInt(e.target.value) || 1))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                },
                '& input': { color: '#f8fafc', textAlign: 'center' },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Automation Toggles */}
        <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: 0.5 }}>
          TỰ ĐỘNG HÓA
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.autoStartBreaks}
                onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#818cf8' } }}
              />
            }
            label={<Typography variant="body2" sx={{ color: '#cbd5e1' }}>Tự động bắt đầu nghỉ giải lao</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.autoStartPomodoros}
                onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#818cf8' } }}
              />
            }
            label={<Typography variant="body2" sx={{ color: '#cbd5e1' }}>Tự động bắt đầu hiệp Pomodoro tiếp theo</Typography>}
          />
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          sx={{
            mt: 1,
            py: 1.2,
            borderRadius: 2.5,
            backgroundColor: '#6366f1',
            fontWeight: 700,
            '&:hover': { backgroundColor: '#4f46e5' },
          }}
        >
          LƯU CÀI ĐẶT
        </Button>
      </DialogContent>
    </Dialog>
  );
}

