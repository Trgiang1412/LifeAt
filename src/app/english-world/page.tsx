'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import confetti from 'canvas-confetti';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { soundEngine } from '@/services/soundEngine';
import DialogueOverlay from '@/components/isometric/DialogueOverlay';

// Dynamically import the 3D Isometric World with SSR disabled
const IsometricWorld = dynamic(() => import('@/components/isometric/IsometricWorld'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '620px',
        gap: 2,
        backgroundColor: '#07090e',
      }}
    >
      <CircularProgress size={42} sx={{ color: '#38bdf8' }} />
      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
        Đang tải kiến trúc đồ họa 3D Isometric Metaverse...
      </Typography>
    </Box>
  ),
});

interface DialogueOption {
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

interface DialogueNodeData {
  _id: string;
  maDoThiHoiThoai: string;
  khoaNut: string;
  maNpc: string;
  tenNguoiNoi: string;
  noiDungTiengAnh: string;
  laNutKetThuc: boolean;
  danhSachLuaChon: DialogueOption[];
}

function EnglishWorldContent() {
  const { user, token, refreshUser } = useAuth();
  const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<DialogueNodeData | null>(null);
  const [loadingDialogue, setLoadingDialogue] = useState(false);
  const [submittingOption, setSubmittingOption] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    nhanXet: string;
    coins: number;
    exp: number;
  } | null>(null);

  // Load dialogue on mount
  const loadDialogue = async () => {
    setLoadingDialogue(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/dialogue?maNpc=NPC_EMMA_LONDON_CAFE&maDoThi=GRAPH_CAFE_ORDER_A2', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.thanhCong) {
        if (data.trangThai && data.trangThai.nutHienTai) {
          setCurrentNode(data.trangThai.nutHienTai);
        } else if (data.nutHienTai) {
          setCurrentNode(data.nutHienTai);
        }
      }
    } catch (err) {
      console.error('Lỗi tải đối thoại:', err);
    } finally {
      setLoadingDialogue(false);
    }
  };

  useEffect(() => {
    loadDialogue();
  }, [token]);

  // Handle player selecting an option in the dialogue graph
  const handleSelectOption = async (option: DialogueOption) => {
    if (submittingOption) return;
    setSubmittingOption(true);

    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maLuaChon: option.maLuaChon }),
      });
      const data = await res.json();

      if (data.thanhCong) {
        if (data.ketQuaLuaChon?.laDapAnDung) {
          soundEngine.playChime?.();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
          setFeedback({
            success: true,
            message: 'Chính xác! Lựa chọn giao tiếp rất tự nhiên và đúng chuẩn ngữ cảnh.',
            nhanXet: data.ketQuaLuaChon.nhanXetNguPhapCefr || '',
            coins: data.ketQuaLuaChon.phanThuongNhanDuoc?.tienXuCong || 0,
            exp: data.ketQuaLuaChon.phanThuongNhanDuoc?.diemKinhNghiemCong || 0,
          });
        } else {
          setFeedback({
            success: false,
            message: 'Chưa chính xác! Câu trả lời này chưa tối ưu hoặc chưa đúng chuẩn ngữ pháp giao tiếp.',
            nhanXet: data.ketQuaLuaChon?.nhanXetNguPhapCefr || 'Hãy thử lại với câu diễn đạt lịch sự hơn.',
            coins: 0,
            exp: 0,
          });
        }

        if (data.nutKeTiep) {
          setCurrentNode(data.nutKeTiep);
        }

        refreshUser();
      }
    } catch (err) {
      console.error('Lỗi gửi lựa chọn:', err);
    } finally {
      setSubmittingOption(false);
    }
  };

  const userCoins = user?.tien || 0;
  const userExp = (user as any)?.diemKinhNghiem || 0;
  const userCefr = (user as any)?.trinhDoTiengAnh || 'A1';

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#07090e',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Navigation */}
      <Box
        sx={{
          height: 64,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button
              size="small"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                color: '#94a3b8',
                borderRadius: 2,
                fontSize: '0.82rem',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { color: '#f8fafc', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              }}
            >
              Quay lại phòng học
            </Button>
          </Link>

          <Box sx={{ height: 20, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicRoundedIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: 0.5 }}>
              The English-speaking World
            </Typography>
            <Chip
              label="3D Isometric English Metaverse"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Box>
        </Box>

        {/* Player Stats Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`🏡 ${user?.nhaNguoiChoi?.loaiNha || 'Nhà Cấp 4 Mái Ngói'}`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: 'rgba(239, 68, 68, 0.16)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: { xs: 'none', md: 'inline-flex' },
            }}
          />
          <Chip
            label={`CEFR: ${userCefr}`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          />
          <Chip
            icon={<StarsRoundedIcon sx={{ fontSize: '15px !important', color: '#c7d2fe !important' }} />}
            label={`${userExp} EXP`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
              color: '#c7d2fe',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          />
          <Chip
            icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />}
            label={`${userCoins} Xu`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.35)',
            }}
          />
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {user?.tenDangNhap?.charAt(0).toUpperCase() || 'P'}
          </Avatar>
        </Box>
      </Box>

      {/* Main 3D Isometric World Metaverse (Full Viewport) */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
          backgroundColor: '#07090e',
        }}
      >
        <IsometricWorld
          onOpenDialogue={(npcId) => {
            if (npcId === 'NPC_EMMA_LONDON_CAFE' || npcId === 'NPC_ALEX_ACADEMY') {
              setIsDialogueModalOpen(true);
            }
          }}
        />
      </Box>

      {/* 
        Hộp thoại đối thoại NPC tiếng Anh thông minh:
        Tích hợp TTS tự động phát âm, nút Replay âm thanh và hiệu ứng Sound Wave Indicator
      */}
      <DialogueOverlay
        isOpen={isDialogueModalOpen}
        onClose={() => {
          setIsDialogueModalOpen(false);
        }}
        npcName={currentNode?.tenNguoiNoi || 'Emma'}
        npcRole="London Focus Cafe • Barista A2"
        currentNode={currentNode}
        loading={loadingDialogue}
        submittingOption={submittingOption}
        feedback={feedback}
        onSelectOption={handleSelectOption}
        onRestart={loadDialogue}
      />
    </Box>
  );
}

export default function EnglishWorldPage() {
  return (
    <AuthGuard>
      <EnglishWorldContent />
    </AuthGuard>
  );
}
