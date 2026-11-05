'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useAuth } from '@/context/AuthContext';

interface NotesWidgetProps {
  onClose: () => void;
  roomCode?: string;
}

const DEFAULT_NOTE = `## Mục tiêu buổi học hôm nay 🎯
- Hoàn thành thiết kế giao diện LifeAt Space
- Tập trung 4 Pomodoros không xao nhãng
- Uống đủ 1L nước lọc 💧

*Ghi chú thêm:*
Ý tưởng tốt thường đến khi tâm trí thả lỏng trong không gian yên tĩnh.`;

export default function NotesWidget({ onClose, roomCode }: NotesWidgetProps) {
  const { user, token } = useAuth();
  const [noteContent, setNoteContent] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeat_notes');
      if (saved !== null) return saved;
    }
    return DEFAULT_NOTE;
  });

  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const isInitialLoadedRef = useRef(false);

  // 1. Tải ghi chú từ Database MongoDB khi mở widget
  useEffect(() => {
    let isMounted = true;

    const fetchNote = async () => {
      try {
        const query = roomCode ? `?roomCode=${encodeURIComponent(roomCode)}` : '';
        const res = await fetch(`/api/notes${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (isMounted && data?.success && data.note?.content !== undefined) {
          setNoteContent(data.note.content);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lifeat_notes', data.note.content);
          }
        }
      } catch (err) {
        console.error('Lỗi tải ghi chú:', err);
      } finally {
        if (isMounted) {
          isInitialLoadedRef.current = true;
        }
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
    };
  }, [token, roomCode]);

  // 2. Tự động lưu (Auto-save) debounce 800ms vào Database và LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeat_notes', noteContent);
    }

    if (!isInitialLoadedRef.current) return;

    setSaveStatus('saving');

    const timeout = setTimeout(async () => {
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            content: noteContent,
            title: 'Scratchpad Notes',
            roomCode: roomCode || '',
          }),
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Lỗi tự động lưu ghi chú:', err);
        setSaveStatus('saved');
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [noteContent, token, roomCode]);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(noteContent);
      setCopied(true);
    }
  };

  // Xác nhận xóa bằng Modal giao diện đẹp thay vì alert / confirm của window
  const handleConfirmClear = async () => {
    setIsConfirmDialogOpen(false);
    setNoteContent('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lifeat_notes');
    }
    try {
      const query = roomCode ? `?roomCode=${encodeURIComponent(roomCode)}` : '';
      await fetch(`/api/notes${query}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error('Lỗi xóa ghi chú:', err);
    }
  };

  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const charCount = noteContent.length;

  return (
    <Paper
      elevation={8}
      sx={{
        width: 360,
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
          <EditNoteRoundedIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            SCRATCHPAD NOTES
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Copy all text">
            <IconButton size="small" onClick={copyToClipboard} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear notes">
            <IconButton size="small" onClick={() => setIsConfirmDialogOpen(true)} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Editor Body */}
      <Box sx={{ flex: 1, px: 2, pb: 1, display: 'flex' }}>
        <TextField
          multiline
          fullWidth
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Nhập ghi chú nhanh tại đây..."
          sx={{
            flex: 1,
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 3,
              p: 1.5,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
            },
            '& fieldset': { border: 'none' },
          }}
        />
      </Box>

      {/* Footer Info */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
          {wordCount} words • {charCount} chars
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: saveStatus === 'saving' ? '#fbbf24' : '#10b981',
            fontSize: '0.72rem',
            fontWeight: 600,
            transition: 'color 0.2s ease',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Auto-saved'}
        </Typography>
      </Box>

      {/* Snackbar sao chép */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Đã sao chép vào clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Modal xác nhận xóa ghi chú (thay thế hộp thoại native của trình duyệt) */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
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
            Xác nhận xóa ghi chú
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText sx={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
            Bạn có chắc muốn xóa toàn bộ nội dung ghi chú này? Thao tác này sẽ không thể khôi phục.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
          <Button
            size="small"
            onClick={() => setIsConfirmDialogOpen(false)}
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
            onClick={handleConfirmClear}
            sx={{
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.82rem',
              px: 2.2,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Xóa ghi chú
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
