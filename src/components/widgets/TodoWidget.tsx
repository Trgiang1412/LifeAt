'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Checkbox,
  Chip,
  Paper,
  Tooltip,
  ButtonGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import ClearAllRoundedIcon from '@mui/icons-material/ClearAllRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { TaskItem } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface TodoWidgetProps {
  onClose: () => void;
  roomCode?: string;
}

export default function TodoWidget({ onClose, roomCode }: TodoWidgetProps) {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeat_tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Loại bỏ hoàn toàn các dữ liệu mẫu cũ (id: 1, 2, 3)
            return parsed.filter((t) => t.id !== '1' && t.id !== '2' && t.id !== '3');
          }
        } catch {}
      }
    }
    return [];
  });

  const [inputTitle, setInputTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // 1. Tải danh sách nhiệm vụ thực tế từ MongoDB Model ToDoList
  useEffect(() => {
    let isMounted = true;

    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const query = roomCode ? `?roomCode=${encodeURIComponent(roomCode)}` : '';
        const res = await fetch(`/api/todo${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (isMounted && data?.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lifeat_tasks', JSON.stringify(data.tasks));
          }
        }
      } catch (err) {
        console.error('Lỗi tải ToDoList:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, [token, roomCode]);

  // Lưu cache cục bộ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeat_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Thêm nhiệm vụ mới vào ToDoList (MongoDB)
  const addTask = async () => {
    if (!inputTitle.trim()) return;
    const titleText = inputTitle.trim();
    setInputTitle('');

    const tempId = Date.now().toString();
    const tempTask: TaskItem = {
      id: tempId,
      title: titleText,
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      createdAt: Date.now(),
    };

    // Optimistic update
    setTasks((prev) => [tempTask, ...prev]);

    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: titleText,
          roomCode: roomCode || '',
          estimatedPomodoros: 1,
        }),
      });
      const data = await res.json();
      if (data?.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? data.task : t)));
      }
    } catch (err) {
      console.error('Lỗi khi thêm nhiệm vụ ToDoList:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  };

  // Toggle trạng thái hoàn thành (MongoDB ToDoList)
  const toggleTask = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const newCompletedState = !targetTask.completed;

    // Cập nhật UI ngay lập tức
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompletedState } : t))
    );

    try {
      await fetch('/api/todo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id,
          completed: newCompletedState,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái nhiệm vụ:', err);
    }
  };

  // Xóa nhiệm vụ (MongoDB ToDoList)
  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/todo?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error('Lỗi khi xóa nhiệm vụ ToDoList:', err);
    }
  };

  // Xóa tất cả các nhiệm vụ đã hoàn thành qua Modal
  const handleConfirmClearCompleted = async () => {
    setIsClearConfirmOpen(false);
    setTasks((prev) => prev.filter((t) => !t.completed));

    try {
      const query = roomCode
        ? `?clearCompleted=true&roomCode=${encodeURIComponent(roomCode)}`
        : '?clearCompleted=true';
      await fetch(`/api/todo${query}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error('Lỗi khi xóa nhiệm vụ hoàn thành:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const remainingCount = tasks.filter((t) => !t.completed).length;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 350,
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
          <FormatListBulletedRoundedIcon sx={{ fontSize: 20, color: '#a855f7' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            TASKS
          </Typography>
          <Chip
            size="small"
            label={`${remainingCount} left`}
            sx={{ height: 20, fontSize: '0.68rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {tasks.some((t) => t.completed) && (
            <Tooltip title="Clear completed">
              <IconButton size="small" onClick={() => setIsClearConfirmOpen(true)} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <ClearAllRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Input row */}
      <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a task & press Enter..."
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2.5,
              fontSize: '0.85rem',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
              '&:hover fieldset': { borderColor: '#a855f7' },
              '&.Mui-focused fieldset': { borderColor: '#a855f7' },
            },
            '& input': { color: '#f8fafc', py: 1 },
          }}
        />
        <IconButton
          onClick={addTask}
          sx={{
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            color: '#fff',
            borderRadius: 2.5,
            '&:hover': { backgroundColor: '#9333ea' },
          }}
        >
          <AddRoundedIcon />
        </IconButton>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center' }}>
        <ButtonGroup
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 6,
            p: 0.4,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {(['all', 'active', 'completed'] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setFilter(mode)}
              sx={{
                fontSize: '0.72rem',
                textTransform: 'capitalize',
                px: 1.5,
                py: 0.3,
                borderRadius: 5,
                backgroundColor: filter === mode ? 'rgba(168, 85, 247, 0.8)' : 'transparent',
                color: filter === mode ? '#fff' : '#94a3b8',
                '&:hover': {
                  backgroundColor: filter === mode ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              {mode}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Task list */}
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
            <Typography variant="body2">
              {isLoading
                ? 'Đang tải nhiệm vụ...'
                : 'Chưa có nhiệm vụ nào. Nhập nhiệm vụ phía trên để bắt đầu!'}
            </Typography>
          </Box>
        ) : (
          filteredTasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                borderRadius: 2.5,
                backgroundColor: task.completed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  '& .delete-btn': { opacity: 1 },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  icon={<RadioButtonUncheckedRoundedIcon sx={{ color: '#64748b' }} />}
                  checkedIcon={<CheckCircleRoundedIcon sx={{ color: '#10b981' }} />}
                  size="small"
                  sx={{ p: 0.5 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: task.completed ? '#64748b' : '#f1f5f9',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  size="small"
                  label={`🍅 ${task.completedPomodoros}/${task.estimatedPomodoros}`}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#94a3b8',
                  }}
                />
                <IconButton
                  size="small"
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                  sx={{
                    opacity: 0.6,
                    color: '#f87171',
                    p: 0.5,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Modal xác nhận xóa các nhiệm vụ đã hoàn thành */}
      <Dialog
        open={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 3.5,
            color: '#fff',
            p: 1,
            minWidth: 320,
            maxWidth: 380,
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1.2, fontWeight: 700, pb: 1 }}>
          <WarningAmberRoundedIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
          <Typography component="span" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
            Xác nhận dọn dẹp
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText sx={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
            Bạn có chắc muốn xóa tất cả các nhiệm vụ đã hoàn thành?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
          <Button
            size="small"
            onClick={() => setIsClearConfirmOpen(false)}
            sx={{
              color: '#94a3b8',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.82rem',
              px: 2,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleConfirmClearCompleted}
            sx={{
              backgroundColor: '#a855f7',
              color: '#fff',
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.82rem',
              px: 2.2,
              '&:hover': { backgroundColor: '#9333ea' },
            }}
          >
            Dọn dẹp
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
