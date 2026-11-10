'use client';

import React, { useState } from 'react';
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
  Snackbar,
  Alert,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { PomodoroSettings } from '@/types';
import { soundEngine } from '@/services/soundEngine';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSaveSettings: (newSettings: PomodoroSettings) => void;
}

const DEFAULT_SETTINGS_FALLBACK: PomodoroSettings = {
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
};

export default function SettingsModal({ open, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [form, setForm] = React.useState<PomodoroSettings>(settings);
  const [showSavedToast, setShowSavedToast] = useState(false);

  React.useEffect(() => {
    setForm(settings);
  }, [settings, open]);

  const handleChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveSettings(form);
    setShowSavedToast(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    setForm(DEFAULT_SETTINGS_FALLBACK);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            color: '#f8fafc',
          },
        }}
      >
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsRoundedIcon sx={{ color: '#818cf8', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                CÀI ĐẶT PHÒNG
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#fff' } }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Timer Config */}
          <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 800, letterSpacing: 0.5 }}>
            THỜI GIAN ĐỒNG HỒ (PHÚT)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.6, fontWeight: 600 }}>
                Pomodoro
              </Typography>
              <TextField
                type="number"
                size="small"
                value={form.pomodoroTime}
                onChange={(e) => handleChange('pomodoroTime', Math.max(1, parseInt(e.target.value) || 1))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.09)' },
                    '&.Mui-focused': { borderColor: '#818cf8' },
                  },
                  '& input': { color: '#f8fafc', textAlign: 'center', fontWeight: 700, fontSize: '1rem', py: 1 },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.6, fontWeight: 600 }}>
                Nghỉ ngắn
              </Typography>
              <TextField
                type="number"
                size="small"
                value={form.shortBreakTime}
                onChange={(e) => handleChange('shortBreakTime', Math.max(1, parseInt(e.target.value) || 1))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.09)' },
                    '&.Mui-focused': { borderColor: '#818cf8' },
                  },
                  '& input': { color: '#f8fafc', textAlign: 'center', fontWeight: 700, fontSize: '1rem', py: 1 },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.6, fontWeight: 600 }}>
                Nghỉ dài
              </Typography>
              <TextField
                type="number"
                size="small"
                value={form.longBreakTime}
                onChange={(e) => handleChange('longBreakTime', Math.max(1, parseInt(e.target.value) || 1))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.09)' },
                    '&.Mui-focused': { borderColor: '#818cf8' },
                  },
                  '& input': { color: '#f8fafc', textAlign: 'center', fontWeight: 700, fontSize: '1rem', py: 1 },
                }}
              />
            </Box>
          </Box>

          {/* Cấu hình chu kỳ nghỉ dài (Số vòng) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 2.5,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                Chu kỳ nghỉ dài
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Số hiệp Pomodoro hoàn thành trước khi nghỉ dài
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                type="number"
                size="small"
                value={form.longBreakInterval || 4}
                onChange={(e) => handleChange('longBreakInterval', Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                sx={{
                  width: 65,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    '& fieldset': { border: 'none' },
                  },
                  '& input': { color: '#818cf8', textAlign: 'center', fontWeight: 800, py: 0.8 },
                }}
              />
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                hiệp
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Automation Toggles */}
          <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 800, letterSpacing: 0.5 }}>
            TỰ ĐỘNG HÓA
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.autoStartBreaks}
                  onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#818cf8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>Tự động bắt đầu nghỉ giải lao</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.autoStartPomodoros}
                  onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#818cf8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>Tự động bắt đầu hiệp Pomodoro tiếp theo</Typography>}
            />
          </Box>

          {/* Thử âm thanh chuông báo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: '10px 14px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 2.5,
              border: '1px solid rgba(129, 140, 248, 0.2)',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                Chuông báo chuyển phiên
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Âm thanh chuông báo trong trẻo (Chime)
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => soundEngine.playChime?.()}
              startIcon={<VolumeUpRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: 'rgba(129, 140, 248, 0.5)',
                color: '#c7d2fe',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: 2,
                textTransform: 'none',
                py: 0.6,
                px: 1.2,
                '&:hover': {
                  borderColor: '#818cf8',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#fff',
                },
              }}
            >
              Thử chuông
            </Button>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={handleResetDefaults}
              startIcon={<RestartAltRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: 2.5,
                borderColor: 'rgba(255, 255, 255, 0.16)',
                color: '#94a3b8',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  color: '#f8fafc',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                },
              }}
            >
              Mặc định
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                flex: 2,
                py: 1.2,
                borderRadius: 2.5,
                backgroundColor: '#6366f1',
                fontWeight: 800,
                fontSize: '0.92rem',
                letterSpacing: 0.5,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
                '&:hover': { backgroundColor: '#4f46e5' },
              }}
            >
              LƯU CÀI ĐẶT
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={showSavedToast}
        autoHideDuration={2000}
        onClose={() => setShowSavedToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}>
          ✓ Đã lưu cài đặt phòng thành công!
        </Alert>
      </Snackbar>
    </>
  );
}

