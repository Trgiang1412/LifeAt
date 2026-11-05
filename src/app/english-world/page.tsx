'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
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
        height: '620px',
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
  const [activeLocation, setActiveLocation] = useState<'city' | 'cafe' | 'house' | 'academy' | 'mart'>('city');
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
    if (submittingOption) return; // Prevent double click
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

      const result = await res.json();

      if (result.thanhCong) {
        if (result.laDapAnDung) {
          soundEngine.playChime?.();
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
          });
        }

        setFeedback({
          success: result.laDapAnDung,
          message: result.thongDiep,
          nhanXet: result.nhanXetNguPhapCefr,
          coins: result.phanThuong?.tienXuCong || 0,
          exp: result.phanThuong?.diemKinhNghiemCong || 0,
        });

        // Refresh user's balance and EXP
        await refreshUser();

        // Update current node to next node if available
        if (result.duLieuNutTiepTheo) {
          setCurrentNode(result.duLieuNutTiepTheo);
        } else {
          // Finished conversation
          setCurrentNode((prev) => (prev ? { ...prev, laNutKetThuc: true, danhSachLuaChon: [] } : null));
        }
      } else {
        setFeedback({
          success: false,
          message: result.thongDiep || 'Không thể thực hiện lựa chọn.',
          nhanXet: result.maLoi === 'CEFR_LEVEL_INSUFFICIENT' ? 'Yêu cầu nâng cấp trình độ CEFR cao hơn!' : '',
          coins: 0,
          exp: 0,
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Lỗi mạng khi gửi phản hồi.',
        nhanXet: '',
        coins: 0,
        exp: 0,
      });
    } finally {
      setSubmittingOption(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0a0d17',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left: Back button & World Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 3,
              px: 2,
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              },
            }}
          >
            Quay lại phòng học
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicRoundedIcon sx={{ color: '#38bdf8', fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              The English-speaking World
            </Typography>
            <Chip
              label="3D Isometric English Metaverse"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            />
          </Box>
        </Box>

        {/* Right: Player Economy & CEFR Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label="CEFR: A2"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.72rem',
              backgroundColor: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          />
          <Chip
            icon={<StarsRoundedIcon sx={{ fontSize: '15px !important', color: '#818cf8 !important' }} />}
            label="150 EXP"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
              color: '#c7d2fe',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          />
          <Chip
            icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />}
            label={`${user?.tien ?? 100} Xu`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              backgroundColor: 'rgba(251, 191, 36, 0.18)',
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

      {/* Main Content Area: 3D Isometric World Grid & Locations */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, md: 4 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' },
          gap: 3,
        }}
      >
        {/* Left Column: Locations & House Overview */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>
            ĐỊA ĐIỂM THẾ GIỚI TIẾNG ANH (LOCATIONS)
          </Typography>

          {/* Location 0: Toàn cảnh Đô thị 3D Isometric */}
          <Paper
            onClick={() => setActiveLocation('city')}
            sx={{
              p: 2,
              borderRadius: 3.5,
              cursor: 'pointer',
              backgroundColor: activeLocation === 'city' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: activeLocation === 'city' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: activeLocation === 'city' ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'rgba(56, 189, 248, 0.15)' },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <ApartmentRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  Thành phố 3D Isometric
                </Typography>
                <Chip
                  label="R3F 2.5D"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    backgroundColor: '#38bdf8',
                    color: '#07090e',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Chu kỳ Ngày/Đêm • Shader Facade • Bloom HDR
              </Typography>
            </Box>
          </Paper>

          {/* Location 1: London Focus Cafe */}
          <Paper
            onClick={() => setActiveLocation('cafe')}
            sx={{
              p: 2,
              borderRadius: 3.5,
              cursor: 'pointer',
              backgroundColor: activeLocation === 'cafe' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: activeLocation === 'cafe' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'rgba(56, 189, 248, 0.18)' },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'rgba(217, 119, 6, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <LocalCafeRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                London Focus Cafe
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Hội thoại đặt món thực tế với NPC Emma (A2)
              </Typography>
            </Box>
          </Paper>

          {/* Location 2: Player House (NhaNguoiChoi) */}
          <Paper
            onClick={() => setActiveLocation('house')}
            sx={{
              p: 2,
              borderRadius: 3.5,
              cursor: 'pointer',
              backgroundColor: activeLocation === 'house' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: activeLocation === 'house' ? '1.5px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <HomeRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                My House (Nhà Người Chơi)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Lưới nội thất 10x10 • Cấp nhà 1 • Gara
              </Typography>
            </Box>
          </Paper>

          {/* Location 3: Oxford English Academy */}
          <Paper
            onClick={() => setActiveLocation('academy')}
            sx={{
              p: 2,
              borderRadius: 3.5,
              cursor: 'pointer',
              backgroundColor: activeLocation === 'academy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: activeLocation === 'academy' ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <SchoolRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Oxford English Academy
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Thi nâng chuẩn CEFR: A1 → B1 → C2
              </Typography>
            </Box>
          </Paper>

          {/* Location 4: Times Square Mart */}
          <Paper
            onClick={() => setActiveLocation('mart')}
            sx={{
              p: 2,
              borderRadius: 3.5,
              cursor: 'pointer',
              backgroundColor: activeLocation === 'mart' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: activeLocation === 'mart' ? '1.5px solid #f472b6' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f472b6',
              }}
            >
              <StoreRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Times Square Furniture Mart
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Mua sắm vật phẩm & nội thất trang trí nhà
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Right Column: Interactive 3D World Stage & Dialogue Graph Window */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {activeLocation === 'city' && (
            <Paper
              elevation={10}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                height: { xs: '560px', md: '700px' },
                position: 'relative',
                backgroundColor: '#07090e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              }}
            >
              <IsometricWorld
                onOpenDialogue={(npcId) => {
                  if (npcId === 'NPC_EMMA_LONDON_CAFE') {
                    setIsDialogueModalOpen(true);
                  } else if (npcId === 'NPC_ALEX_ACADEMY') {
                    setActiveLocation('academy');
                  }
                }}
              />
            </Paper>
          )}

          {activeLocation === 'cafe' && (
            <Paper
              elevation={8}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 4,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              {/* Dialogue Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"
                    sx={{ width: 44, height: 44, border: '2px solid #38bdf8' }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                      {currentNode?.tenNguoiNoi || 'Emma (London Barista)'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                      NPC Hội Thoại • Cấp độ CEFR A2
                    </Typography>
                  </Box>
                </Box>

                <Tooltip title="Tải lại đối thoại">
                  <Button
                    size="small"
                    onClick={loadDialogue}
                    startIcon={<RefreshRoundedIcon />}
                    sx={{ color: '#94a3b8', fontSize: '0.75rem' }}
                  >
                    Bắt đầu lại
                  </Button>
                </Tooltip>
              </Box>

              {/* NPC Dialogue Bubble */}
              {loadingDialogue ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#38bdf8' }} />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    position: 'relative',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    "{currentNode?.noiDungTiengAnh || 'Good afternoon! Welcome to the London Focus Cafe. What can I get started for you today?'}"
                  </Typography>
                </Box>
              )}

              {/* Feedback alert after picking an option */}
              {feedback && (
                <Alert
                  severity={feedback.success ? 'success' : 'error'}
                  icon={feedback.success ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
                  sx={{
                    borderRadius: 3,
                    fontSize: '0.85rem',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {feedback.message}
                  </Typography>
                  {feedback.nhanXet && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'inherit' }}>
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

              {/* Player Branching Dialogue Options */}
              {currentNode && !currentNode.laNutKetThuc && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8 }}>
                    LỰA CHỌN CÂU PHẢN HỒI TIẾNG ANH (DIRECTED GRAPH OPTIONS):
                  </Typography>

                  {currentNode.danhSachLuaChon.map((option, idx) => (
                    <Button
                      key={option.maLuaChon}
                      variant="outlined"
                      disabled={submittingOption}
                      onClick={() => handleSelectOption(option)}
                      startIcon={<SendRoundedIcon sx={{ fontSize: '1rem !important', transform: 'rotate(-30deg)' }} />}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        py: 1.5,
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

              {currentNode?.laNutKetThuc && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 700 }}>
                    ✨ Cuộc hội thoại hoàn tất! Bạn đã nhận đủ phần thưởng và kinh nghiệm.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={loadDialogue}
                    sx={{ mt: 1.5, backgroundColor: '#6366f1', borderRadius: 2.5 }}
                  >
                    Trò chuyện lại
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {activeLocation === 'house' && (
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#818cf8' }}>
                Hệ Sinh Thái Nhà Ở Người Chơi (PlayerHouse Schema)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Mô hình ngoại thất: <strong>COZY COTTAGE V1</strong> • Lưới nội thất: <strong>10 x 10</strong> ô
              </Typography>

              {/* 10x10 Isometric Grid Mockup */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: 0.5,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  maxWidth: 420,
                  mx: 'auto',
                }}
              >
                {Array.from({ length: 100 }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      aspectRatio: '1',
                      borderRadius: 1,
                      backgroundColor: i === 24 || i === 45 ? '#818cf8' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                    }}
                  >
                    {i === 24 ? '🪑' : i === 45 ? '🪴' : ''}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {activeLocation === 'academy' && (
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#34d399' }}>
                Oxford English Academy (CEFR Framework)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Đạt chứng chỉ CEFR cao hơn để mở khóa các phân nhánh hội thoại phức tạp và nhận mức thù lao xu cao hơn.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((level) => (
                  <Chip
                    key={level}
                    label={`Level ${level}`}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: level === 'A2' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {activeLocation === 'mart' && (
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#f472b6' }}>
                Times Square Mart (Material & Furniture)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Dùng số dư xu (`tien`) tích lũy được từ các cuộc đối thoại tiếng Anh thành công để mua sắm vật phẩm nội thất cho ngôi nhà của bạn.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* 
        Hộp thoại đối thoại NPC tiếng Anh thông minh:
        Tích hợp TTS tự động phát âm, nút Replay âm thanh và hiệu ứng Sound Wave Indicator
      */}
      <DialogueOverlay
        isOpen={isDialogueModalOpen || activeLocation === 'cafe'}
        onClose={() => {
          setIsDialogueModalOpen(false);
          if (activeLocation === 'cafe') {
            setActiveLocation('city');
          }
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

