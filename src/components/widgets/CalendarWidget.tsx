'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Button,
  TextField,
  Tooltip,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useAuth } from '@/context/AuthContext';

export interface ScheduleBlock {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'focus' | 'break' | 'meeting';
  done: boolean;
}

interface CalendarWidgetProps {
  onClose: () => void;
  roomCode?: string;
}

export default function CalendarWidget({ onClose, roomCode }: CalendarWidgetProps) {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ScheduleBlock | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formType, setFormType] = useState<'focus' | 'break' | 'meeting'>('focus');

  // 1. Fetch dữ liệu lịch trình từ API / LocalStorage
  const fetchSchedule = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/schedule?roomCode=${encodeURIComponent(roomCode || '')}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setSchedule(data.items);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback xuống localStorage
    }

    try {
      const saved = localStorage.getItem('lifeat_daily_schedule');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc bỏ các dữ liệu mẫu cũ nếu từng lưu
          const filtered = parsed.filter(
            (item: any) =>
              item.id &&
              !String(item.id).startsWith('default-') &&
              item.id !== '1' &&
              item.id !== '2' &&
              item.id !== '3' &&
              item.id !== '4' &&
              item.id !== '5'
          );
          setSchedule(filtered);
          setLoading(false);
          return;
        }
      }
    } catch {}

    setSchedule([]);
    setLoading(false);
  }, [token, roomCode]);

  useEffect(() => {
    fetchSchedule().finally(() => setLoading(false));
  }, [fetchSchedule]);

  // Lưu bản sao localStorage để luôn sẵn sàng offline
  const saveToLocal = (items: ScheduleBlock[]) => {
    try {
      localStorage.setItem('lifeat_daily_schedule', JSON.stringify(items));
    } catch {}
  };

  // 2. Toggle trạng thái Done
  const toggleDone = async (item: ScheduleBlock) => {
    const nextDone = !item.done;
    const updated = schedule.map((s) => (s.id === item.id ? { ...s, done: nextDone } : s));
    setSchedule(updated);
    saveToLocal(updated);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch('/api/schedule', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: item.id,
          done: nextDone,
        }),
      });
    } catch {}
  };

  // 3. Mở dialog thêm mới
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormType('focus');
    setIsAddOpen(true);
  };

  // 4. Mở dialog chỉnh sửa
  const handleOpenEdit = (e: React.MouseEvent, item: ScheduleBlock) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormTitle(item.title);
    setFormStartTime(item.startTime || '09:00');
    setFormEndTime(item.endTime || '10:00');
    setFormType(item.type);
    setIsAddOpen(true);
  };

  // 5. Xóa mục lịch trình
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = schedule.filter((s) => s.id !== id);
    setSchedule(updated);
    saveToLocal(updated);

    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`/api/schedule?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
    } catch {}
  };

  // 6. Lưu thêm mới hoặc cập nhật
  const handleSaveItem = async () => {
    if (!formTitle.trim()) return;

    const timeFormatted = `${formStartTime} - ${formEndTime}`;

    if (editingItem) {
      // Cập nhật
      const updatedList = schedule.map((s) =>
        s.id === editingItem.id
          ? {
              ...s,
              title: formTitle.trim(),
              startTime: formStartTime,
              endTime: formEndTime,
              time: timeFormatted,
              type: formType,
            }
          : s
      );
      setSchedule(updatedList);
      saveToLocal(updatedList);
      setIsAddOpen(false);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        await fetch('/api/schedule', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            id: editingItem.id,
            title: formTitle.trim(),
            startTime: formStartTime,
            endTime: formEndTime,
            type: formType,
          }),
        });
      } catch {}
    } else {
      // Tạo mới
      const tempId = `item-${Date.now()}`;
      const newItem: ScheduleBlock = {
        id: tempId,
        title: formTitle.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        time: timeFormatted,
        type: formType,
        done: false,
      };

      const updatedList = [...schedule, newItem].sort((a, b) =>
        (a.startTime || '').localeCompare(b.startTime || '')
      );
      setSchedule(updatedList);
      saveToLocal(updatedList);
      setIsAddOpen(false);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: formTitle.trim(),
            startTime: formStartTime,
            endTime: formEndTime,
            type: formType,
            roomCode: roomCode || '',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.item) {
            setSchedule((prev) =>
              prev.map((s) => (s.id === tempId ? { ...s, id: data.item.id } : s))
            );
          }
        }
      } catch {}
    }
  };

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const completedCount = schedule.filter((s) => s.done).length;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 350,
        height: 480,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
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
          <Chip
            size="small"
            label={`${completedCount}/${schedule.length}`}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 800,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Thêm lịch trình mới">
            <IconButton
              size="small"
              onClick={handleOpenAdd}
              sx={{
                color: '#34d399',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Date banner */}
      <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#10b981' }} />
          <Typography variant="caption" sx={{ color: '#cbd5e1', textTransform: 'capitalize', fontWeight: 600 }}>
            {todayStr}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleOpenAdd}
          startIcon={<AddRoundedIcon sx={{ fontSize: '15px !important' }} />}
          sx={{
            py: 0.2,
            px: 1,
            fontSize: '0.72rem',
            color: '#34d399',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
          }}
        >
          Thêm mốc
        </Button>
      </Box>

      {/* Timeline items */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#10b981' }} />
          </Box>
        ) : schedule.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
            <Typography variant="body2" sx={{ fontSize: '0.82rem', mb: 1 }}>
              Chưa có mốc lịch trình nào hôm nay.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenAdd}
              startIcon={<AddRoundedIcon />}
              sx={{
                borderColor: 'rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.75rem',
              }}
            >
              Tạo mốc đầu tiên
            </Button>
          </Box>
        ) : (
          schedule.map((item) => (
            <Box
              key={item.id}
              onClick={() => toggleDone(item)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: item.done ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                borderLeft: `4px solid ${
                  item.type === 'focus' ? '#6366f1' : item.type === 'break' ? '#10b981' : '#f59e0b'
                }`,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  '& .item-actions': { opacity: 1 },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, flex: 1, minWidth: 0 }}>
                <IconButton size="small" sx={{ p: 0.2, mt: 0.1 }}>
                  {item.done ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  )}
                </IconButton>

                <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: item.done ? '#64748b' : '#f1f5f9',
                      textDecoration: item.done ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    {item.time || `${item.startTime} - ${item.endTime}`}
                  </Typography>
                </Box>
              </Box>

              {/* Action buttons (Sửa / Xóa) */}
              <Box
                className="item-actions"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  opacity: { xs: 1, sm: 0 },
                  transition: 'opacity 0.2s',
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenEdit(e, item)}
                  sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#38bdf8' } }}
                >
                  <EditRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => handleDelete(e, item.id)}
                  sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#f87171' } }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Dialog thêm / sửa mốc thời gian */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', pb: 1 }}>
          {editingItem ? '✏️ Chỉnh sửa lịch trình' : '➕ Thêm mốc lịch trình mới'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          <TextField
            autoFocus
            label="Nội dung công việc / mục tiêu"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            fullWidth
            size="small"
            placeholder="vd: Deep Work: Lập trình frontend..."
            sx={{
              '& .MuiInputBase-input': { color: '#fff', fontSize: '0.85rem' },
              '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Bắt đầu"
              type="time"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { color: '#fff', fontSize: '0.85rem' },
                '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                },
              }}
            />
            <TextField
              label="Kết thúc"
              type="time"
              value={formEndTime}
              onChange={(e) => setFormEndTime(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { color: '#fff', fontSize: '0.85rem' },
                '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block' }}>
              Phân loại:
            </Typography>
            <Select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              size="small"
              fullWidth
              sx={{
                color: '#fff',
                fontSize: '0.85rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <MenuItem value="focus">🎯 Tập trung cao độ (Focus Work)</MenuItem>
              <MenuItem value="break">☕ Nghỉ giải lao (Break / Relax)</MenuItem>
              <MenuItem value="meeting">🤝 Họp nhóm & Trao đổi (Meeting)</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAddOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={!formTitle.trim()}
            sx={{
              backgroundColor: '#10b981',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            {editingItem ? 'Cập nhật' : 'Thêm vào lịch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
