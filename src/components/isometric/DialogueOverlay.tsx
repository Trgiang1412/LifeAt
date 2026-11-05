'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import useElevenLabsTTS from '@/hooks/useElevenLabsTTS';

export interface DialogueOption {
  maLuaChon: string;
  noiDungTiengAnh: string;
  laDapAnDung: boolean;
  nhanXetNguPhapCefr: string;
  dieuKien: {
    trinhDoToiThieu: string;
    coNhiemVuYeuCau: string[];
  };
  hanhDong: {
    diemKinhNghiemCong: number;
    tienXuCong: number;
    coNhiemVuKichHoat: string[];
  };
}

export interface DialogueNodeData {
  _id: string;
  maDoThiHoiThoai: string;
  khoaNut: string;
  maNpc: string;
  tenNguoiNoi: string;
  noiDungTiengAnh: string;
  laNutKetThuc: boolean;
  danhSachLuaChon: DialogueOption[];
}

interface DialogueOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  npcName?: string;
  npcRole?: string;
  avatarUrl?: string;
  currentNode: DialogueNodeData | null;
  loading?: boolean;
  submittingOption?: boolean;
  feedback?: {
    success: boolean;
    message: string;
    nhanXet: string;
    coins: number;
    exp: number;
  } | null;
  onSelectOption: (option: DialogueOption) => void;
  onRestart?: () => void;
}

export default function DialogueOverlay({
  isOpen,
  onClose,
  npcName = 'Emma',
  npcRole = 'London Barista • CEFR A2',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
  currentNode,
  loading = false,
  submittingOption = false,
  feedback,
  onSelectOption,
  onRestart,
}: DialogueOverlayProps) {
  const { play, stop, isSpeaking, isLoading } = useElevenLabsTTS({
    fallbackToBrowser: true,
  });

  // 1. Tự động phát âm câu thoại tiếng Anh khi NPC đổi câu mới
  // Và tự động dừng luồng âm thanh cũ khi chuyển câu hoặc khi đóng modal (Ràng buộc kỹ thuật)
  useEffect(() => {
    if (isOpen && currentNode?.noiDungTiengAnh) {
      play(currentNode.noiDungTiengAnh);
    }

    return () => {
      stop();
    };
  }, [currentNode?._id, isOpen]);

  // Dừng âm thanh khi đóng overlay
  const handleClose = () => {
    stop();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        backgroundColor: 'rgba(7, 9, 14, 0.75)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 4.5,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
          p: { xs: 2.5, sm: 3.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          position: 'relative',
        }}
      >
        {/* Nút đóng modal ở góc trên phải */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: '#94a3b8',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.12)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        {/* Header NPC Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl}
              sx={{
                width: 54,
                height: 54,
                border: '2.5px solid #38bdf8',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            />
            {/* Chấm trạng thái đang nói */}
            {isSpeaking && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '2px solid #0f172a',
                }}
              />
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              {currentNode?.tenNguoiNoi || npcName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700, letterSpacing: 0.5 }}>
              {npcRole}
            </Typography>
          </Box>
        </Box>

        {/* 
          NPC Dialogue Bubble với nút Replay âm thanh và hiệu ứng Sound Wave Indicator 
        */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={36} sx={{ color: '#38bdf8' }} />
          </Box>
        ) : (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1.5px solid rgba(56, 189, 248, 0.28)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: '#f8fafc',
                fontSize: { xs: '1.05rem', sm: '1.18rem' },
                lineHeight: 1.6,
                letterSpacing: 0.2,
              }}
            >
              "{currentNode?.noiDungTiengAnh || 'Good day! What can I get started for you today?'}"
            </Typography>

            {/* Thanh điều khiển âm thanh & Wave Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              {/* Nút Replay âm thanh */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={isSpeaking ? 'Dừng phát âm' : 'Phát lại phát âm tiếng Anh'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (isSpeaking) {
                        stop();
                      } else if (currentNode?.noiDungTiengAnh) {
                        play(currentNode.noiDungTiengAnh);
                      }
                    }}
                    sx={{
                      backgroundColor: isSpeaking ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.4)' },
                    }}
                  >
                    {isSpeaking ? <StopRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                  {isLoading ? 'Đang tạo âm thanh...' : isSpeaking ? 'Đang phát âm...' : 'Ấn để nghe lại'}
                </Typography>
              </Box>

              {/* 
                Hiệu ứng Animation Sóng Âm Thanh (Wave Indicator) 
                Khi NPC đang nói (isSpeaking) các vạch sẽ dao động lên xuống
              */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', height: 24, px: 1 }}>
                {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5].map((scale, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 3.5,
                      borderRadius: 2,
                      backgroundColor: isSpeaking ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow: isSpeaking ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                      height: isSpeaking ? `${Math.round(20 * scale)}px` : '5px',
                      transition: isSpeaking ? 'height 0.15s ease-in-out' : 'all 0.3s ease',
                      animation: isSpeaking ? `soundWaveBar 0.6s infinite ease-in-out alternate ${i * 0.1}s` : 'none',
                      '@keyframes soundWaveBar': {
                        '0%': { height: '5px' },
                        '100%': { height: `${Math.round(22 * scale)}px` },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Phản hồi sau khi người chơi chọn câu đáp */}
        {feedback && (
          <Alert
            severity={feedback.success ? 'success' : 'error'}
            icon={feedback.success ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
            sx={{
              borderRadius: 3,
              fontSize: '0.85rem',
              backgroundColor: feedback.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: feedback.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f8fafc',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {feedback.message}
            </Typography>
            {feedback.nhanXet && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#94a3b8' }}>
                {feedback.nhanXet}
              </Typography>
            )}
            {feedback.success && (feedback.coins > 0 || feedback.exp > 0) && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={`+${feedback.coins} Xu`}
                  sx={{ height: 20, fontSize: '0.68rem', backgroundColor: 'rgba(251, 191, 36, 0.25)', color: '#fbbf24', fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`+${feedback.exp} EXP`}
                  sx={{ height: 20, fontSize: '0.68rem', backgroundColor: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe', fontWeight: 700 }}
                />
              </Box>
            )}
          </Alert>
        )}

        {/* Danh sách các lựa chọn phản hồi tiếng Anh (Directed Graph Options) */}
        {currentNode && !currentNode.laNutKetThuc && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8 }}>
              LỰA CHỌN CÂU PHẢN HỒI TIẾNG ANH CỦA BẠN:
            </Typography>

            {currentNode.danhSachLuaChon.map((option, idx) => (
              <Button
                key={option.maLuaChon}
                variant="outlined"
                disabled={submittingOption}
                onClick={() => {
                  stop(); // Tự động dừng âm thanh cũ khi chuyển sang câu mới
                  onSelectOption(option);
                }}
                startIcon={<SendRoundedIcon sx={{ fontSize: '0.95rem !important', transform: 'rotate(-30deg)' }} />}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1.4,
                  px: 2,
                  borderRadius: 3,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: '#38bdf8',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {idx + 1}. {option.noiDungTiengAnh}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        )}

        {/* Khi hoàn tất toàn bộ đồ thị hội thoại */}
        {currentNode?.laNutKetThuc && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 700 }}>
              ✨ Cuộc hội thoại hoàn tất! Bạn đã hoàn thành nhiệm vụ giao tiếp tiếng Anh.
            </Typography>
            {onRestart && (
              <Button
                variant="contained"
                onClick={() => {
                  stop();
                  onRestart();
                }}
                startIcon={<RefreshRoundedIcon />}
                sx={{ mt: 1.5, backgroundColor: '#6366f1', borderRadius: 2.5 }}
              >
                Trò chuyện lại
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

