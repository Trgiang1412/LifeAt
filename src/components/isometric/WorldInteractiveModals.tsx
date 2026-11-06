'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  TextField,
  Tabs,
  Tab,
  Divider,
  Alert,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import ChairRoundedIcon from '@mui/icons-material/ChairRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  FURNITURE_CATALOG,
  FISHING_ENGLISH_QUESTIONS,
  CITY_SHOPS_DATA,
  ENGLISH_SOURCE_BOOK,
  STREET_NPCS_DIALOGUE_DATA,
  type FurnitureCatalogItem,
  type EnglishChallengeQuestion,
  type ShopVenueId,
  type ShopProductItem,
  type WorkCustomerScenario,
  type StreetNpcScenario,
} from '@/data/worldGameplayData';
import type { HouseFurnitureRenderItem } from './PlayTogetherPlaza';

export type WorkDifficulty = 'easy' | 'medium' | 'hard';

// ============================================================================
// 1. MODAL CÂU HỎI TIẾNG ANH KHI CÂU CÁ (TRẮC NGHIỆM 4 ĐÁP ÁN / TỰ LUẬN / KIẾN THỨC)
// ============================================================================
interface FishingQuizModalProps {
  isOpen: boolean;
  pendingFish: { name: string; icon?: string; coins: number; exp: number; rarity: string } | null;
  onSuccess: (question: EnglishChallengeQuestion) => void;
  onCancel: () => void;
}

export function FishingQuizModal({
  isOpen,
  pendingFish,
  onSuccess,
  onCancel,
}: FishingQuizModalProps) {
  const [questionTypeFilter, setQuestionTypeFilter] = useState<
    'all' | 'multiple_choice' | 'essay_fill' | 'knowledge'
  >('all');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayAnswer, setEssayAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuestionIndex(Math.floor(Math.random() * FISHING_ENGLISH_QUESTIONS.length));
      setSelectedOption('');
      setEssayAnswer('');
      setFeedback(null);
    }
  }, [isOpen]);

  const filteredQuestions = useMemo(() => {
    if (questionTypeFilter === 'all') return FISHING_ENGLISH_QUESTIONS;
    return FISHING_ENGLISH_QUESTIONS.filter((q) => q.questionType === questionTypeFilter);
  }, [questionTypeFilter]);

  const currentQuestion =
    filteredQuestions[questionIndex % Math.max(1, filteredQuestions.length)] ||
    FISHING_ENGLISH_QUESTIONS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    let isCorrect = false;
    if (currentQuestion.questionType === 'essay_fill') {
      const cleanInput = essayAnswer.trim().toLowerCase();
      const accepted = (
        currentQuestion.acceptedAnswers || [currentQuestion.correctAnswer]
      ).map((a) => a.trim().toLowerCase());
      isCorrect = accepted.includes(cleanInput);
    } else {
      isCorrect =
        selectedOption.trim().toLowerCase() ===
        currentQuestion.correctAnswer.trim().toLowerCase();
    }

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        message: `🎉 Chính xác! Đáp án: "${currentQuestion.correctAnswer}".\n📖 Giải thích: ${currentQuestion.explanationVi}`,
      });
      setTimeout(() => {
        onSuccess(currentQuestion);
      }, 1100);
    } else {
      setFeedback({
        isCorrect: false,
        message: `❌ Bạn đã trả lời sai! Đáp án đúng là: "${currentQuestion.correctAnswer}".\n📖 Giải thích: ${currentQuestion.explanationVi}`,
      });
    }
  };

  return (
    <Dialog
      open={Boolean(isOpen && pendingFish)}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          border: '2px solid rgba(56, 189, 248, 0.5)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '2rem' }}>{pendingFish?.icon || '🎣'}</Typography>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#38bdf8' }}>
              Thử Thách Tiếng Anh Trước Khi Kéo Cá Lên!
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Đang cắn câu: <strong>{pendingFish?.name}</strong> (+{pendingFish?.coins} Xu, +
              {pendingFish?.exp} EXP)
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} sx={{ color: '#94a3b8' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Bộ lọc loại câu hỏi: Trắc nghiệm 4 đáp án / Tự luận / Kiến thức */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {[
            { id: 'all', label: '🎲 Ngẫu nhiên' },
            { id: 'multiple_choice', label: '📝 Trắc nghiệm (4 đáp án)' },
            { id: 'essay_fill', label: '✍️ Tự luận (Điền từ)' },
            { id: 'knowledge', label: '🌍 Câu hỏi Kiến thức' },
          ].map((tab) => (
            <Chip
              key={tab.id}
              label={tab.label}
              clickable
              onClick={() => {
                setQuestionTypeFilter(tab.id as any);
                setQuestionIndex((i) => i + 1);
                setSelectedOption('');
                setEssayAnswer('');
                setFeedback(null);
              }}
              sx={{
                fontWeight: 800,
                backgroundColor:
                  questionTypeFilter === tab.id ? '#0284c7' : 'rgba(255,255,255,0.08)',
                color: questionTypeFilter === tab.id ? '#ffffff' : '#cbd5e1',
                border:
                  questionTypeFilter === tab.id
                    ? '1px solid #7dd3fc'
                    : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </Box>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Chip
              size="small"
              label={
                currentQuestion.questionType === 'multiple_choice'
                  ? '📝 Trắc nghiệm 4 đáp án'
                  : currentQuestion.questionType === 'essay_fill'
                    ? '✍️ Tự luận điền trả lời'
                    : '🌍 Kiến thức Tiếng Anh'
              }
              sx={{
                fontWeight: 800,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fde68a',
              }}
            />
            <Chip
              size="small"
              component="a"
              href={ENGLISH_SOURCE_BOOK.url}
              target="_blank"
              rel="noopener noreferrer"
              clickable
              label={`📘 ${currentQuestion.unitSource || ENGLISH_SOURCE_BOOK.title}`}
              sx={{
                fontWeight: 800,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                color: '#bae6fd',
                textDecoration: 'none',
              }}
            />
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 800, color: '#ffffff', mb: 1, whiteSpace: 'pre-line' }}>
            {currentQuestion.prompt}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
            💡 Gợi ý: {currentQuestion.hintVi}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {currentQuestion.questionType === 'essay_fill' ? (
              <TextField
                fullWidth
                size="small"
                autoFocus
                disabled={Boolean(feedback)}
                placeholder="Nhập câu trả lời Tiếng Anh của bạn..."
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 2,
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.2,
                  mb: 2,
                }}
              >
                {(currentQuestion.options || []).map((opt, idx) => {
                  const isChosen = selectedOption === opt;
                  const isRightAnswer =
                    Boolean(feedback) &&
                    opt.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
                  return (
                    <Button
                      key={idx}
                      disabled={Boolean(feedback)}
                      variant={isChosen || isRightAnswer ? 'contained' : 'outlined'}
                      onClick={() => setSelectedOption(opt)}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        fontWeight: 800,
                        py: 1.2,
                        px: 2,
                        borderRadius: 2.5,
                        backgroundColor: isRightAnswer
                          ? '#10b981'
                          : isChosen
                            ? feedback && !feedback.isCorrect
                              ? '#ef4444'
                              : '#0284c7'
                            : 'rgba(255,255,255,0.04)',
                        borderColor: isRightAnswer
                          ? '#34d399'
                          : isChosen
                            ? '#38bdf8'
                            : 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        '&.Mui-disabled': {
                          color: '#ffffff',
                          opacity: isRightAnswer || isChosen ? 1 : 0.6,
                        },
                      }}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </Button>
                  );
                })}
              </Box>
            )}

            {feedback && (
              <Alert
                severity={feedback.isCorrect ? 'success' : 'error'}
                sx={{ mb: 2, borderRadius: 2, fontWeight: 700, whiteSpace: 'pre-line' }}
              >
                {feedback.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
              <Button
                variant={feedback && !feedback.isCorrect ? 'contained' : 'outlined'}
                onClick={() => {
                  setQuestionIndex((i) => i + 1);
                  setSelectedOption('');
                  setEssayAnswer('');
                  setFeedback(null);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  color: feedback && !feedback.isCorrect ? '#0f172a' : '#cbd5e1',
                  backgroundColor: feedback && !feedback.isCorrect ? '#38bdf8' : 'transparent',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                {feedback && !feedback.isCorrect
                  ? '⏭️ Đã hiểu! Thử câu hỏi tiếp theo'
                  : '🔄 Đổi câu hỏi khác'}
              </Button>
              {!feedback && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    currentQuestion.questionType === 'essay_fill'
                      ? !essayAnswer.trim()
                      : !selectedOption
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 900,
                    px: 3,
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#ffffff',
                  }}
                >
                  🎣 Trả Lời & Kéo Cá Lên!
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 2. MODAL MUA NỘI THẤT BẰNG XU & TỰ DO TRANG TRÍ TRONG NHÀ CẤP 4
// ============================================================================
interface HouseFurnitureModalProps {
  isOpen: boolean;
  userCoins: number;
  furnitureList: HouseFurnitureRenderItem[];
  houseTitle: string;
  houseWallColor: string;
  houseRoofColor: string;
  myPlotLabel: string;
  onClose: () => void;
  onBuyFurniture: (item: FurnitureCatalogItem) => Promise<void>;
  onUpdateFurnitureList: (newList: HouseFurnitureRenderItem[]) => Promise<void>;
  onUpdateExterior: (nextTitle: string, nextWall: string, nextRoof: string) => Promise<void>;
}

export function HouseFurnitureModal({
  isOpen,
  userCoins,
  furnitureList,
  houseTitle,
  houseWallColor,
  houseRoofColor,
  myPlotLabel,
  onClose,
  onBuyFurniture,
  onUpdateFurnitureList,
  onUpdateExterior,
}: HouseFurnitureModalProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'decorate' | 'exterior'>('shop');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [titleInput, setTitleInput] = useState<string>(houseTitle);
  const [wallInput, setWallInput] = useState<string>(houseWallColor);
  const [roofInput, setRoofInput] = useState<string>(houseRoofColor);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    setTitleInput(houseTitle);
    setWallInput(houseWallColor);
    setRoofInput(houseRoofColor);
  }, [houseTitle, houseWallColor, houseRoofColor]);

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === 'all') return FURNITURE_CATALOG;
    return FURNITURE_CATALOG.filter((item) => item.danhMuc === categoryFilter);
  }, [categoryFilter]);

  const selectedFurniture = furnitureList[selectedIndex] || null;

  const handlePlaceAtGrid = async (gridX: number, gridZ: number) => {
    if (!selectedFurniture) return;
    const updated = furnitureList.map((item, idx) =>
      idx === selectedIndex ? { ...item, toaDoLuoiX: gridX, toaDoLuoiZ: gridZ } : item
    );
    await onUpdateFurnitureList(updated);
  };

  const handleRotateSelected = async () => {
    if (!selectedFurniture) return;
    const updated = furnitureList.map((item, idx) =>
      idx === selectedIndex
        ? { ...item, gocXoayDo: ((item.gocXoayDo || 0) + 90) % 360 }
        : item
    );
    await onUpdateFurnitureList(updated);
  };

  const handleRemoveSelected = async () => {
    if (!selectedFurniture || furnitureList.length <= 1) return;
    const updated = furnitureList.filter((_, idx) => idx !== selectedIndex);
    setSelectedIndex(0);
    await onUpdateFurnitureList(updated);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          border: '2px solid #f59e0b',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1.5,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 800 }}>
            🏠 {myPlotLabel} • Cửa Hàng Nội Thất & Trang Trí Nhà
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffffff' }}>
            {houseTitle}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`🪙 Số dư: ${userCoins} Xu`}
            sx={{
              fontWeight: 900,
              fontSize: '0.85rem',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fde68a',
              border: '1.5px solid #f59e0b',
            }}
          />
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 800,
              color: '#94a3b8',
              '&.Mui-selected': { color: '#fbbf24' },
            },
          }}
        >
          <Tab
            value="shop"
            icon={<ChairRoundedIcon fontSize="small" />}
            iconPosition="start"
            label={`🛒 Mua Nội Thất Bằng Xu (${FURNITURE_CATALOG.length} mẫu)`}
          />
          <Tab
            value="decorate"
            icon={<GridOnRoundedIcon fontSize="small" />}
            iconPosition="start"
            label={`📐 Tự Do Trang Trí Sàn Nhà 10×10 (${furnitureList.length} món)`}
          />
          <Tab
            value="exterior"
            icon={<PaletteRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="🎨 Đổi Màu Sơn Tường & Mái Ngói"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5, maxHeight: '72vh' }}>
        {/* TAB 1: MUA NỘI THẤT BẰNG XU */}
        {activeTab === 'shop' && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'phong_khach', label: '🛋️ Phòng khách' },
                { id: 'phong_ngu', label: '🛏️ Phòng ngủ' },
                { id: 'goc_hoc_tap', label: '📚 Góc học tập' },
                { id: 'trang_tri', label: '🌿 Trang trí' },
              ].map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  clickable
                  onClick={() => setCategoryFilter(cat.id)}
                  sx={{
                    fontWeight: 800,
                    backgroundColor:
                      categoryFilter === cat.id ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                    color: categoryFilter === cat.id ? '#0f172a' : '#cbd5e1',
                  }}
                />
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              {filteredCatalog.map((item) => {
                const countInHouse = furnitureList.filter(
                  (f) => f.maVatPham === item.maVatPham
                ).length;
                const canAfford = userCoins >= item.giaXu;
                return (
                  <Paper
                    key={item.maVatPham}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: '2rem' }}>{item.icon}</Typography>
                        <Chip
                          size="small"
                          label={item.giaXu === 0 ? 'Miễn phí' : `🪙 ${item.giaXu} Xu`}
                          sx={{
                            fontWeight: 900,
                            backgroundColor:
                              item.giaXu === 0
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color: item.giaXu === 0 ? '#6ee7b7' : '#fde68a',
                          }}
                        />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ffffff' }}>
                        {item.tenVatPham}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        {item.moTa}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pt: 1,
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 700 }}>
                        Đang đặt: <strong>{countInHouse}</strong>
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busy || !canAfford}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await onBuyFurniture(item);
                            setActiveTab('decorate');
                            setSelectedIndex(furnitureList.length);
                          } finally {
                            setBusy(false);
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          borderRadius: 2,
                          backgroundColor: canAfford ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                          color: canAfford ? '#0f172a' : '#64748b',
                        }}
                      >
                        {canAfford ? '🛒 Mua & Đặt' : 'Thiếu Xu'}
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* TAB 2: TỰ DO TRANG TRÍ TRÊN LƯỚI SÀN NHÀ 10x10 */}
        {activeTab === 'decorate' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
              gap: 3,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: '#34d399', fontWeight: 900, display: 'block', mb: 1 }}
              >
                1. CHỌN MÓN NỘI THẤT TRONG NHÀ ({furnitureList.length} MÓN)
              </Typography>
              <Box sx={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {furnitureList.map((item, idx) => {
                  const catalogInfo = FURNITURE_CATALOG.find(
                    (c) => c.maVatPham === item.maVatPham
                  );
                  const isSelected = idx === selectedIndex;
                  return (
                    <Paper
                      key={`${item.maVatPham}-${idx}`}
                      onClick={() => setSelectedIndex(idx)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(15, 23, 42, 0.7)',
                        border: isSelected
                          ? '1.5px solid #34d399'
                          : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '1.4rem' }}>
                          {catalogInfo?.icon || '🛋️'}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffffff' }}>
                            {catalogInfo?.tenVatPham || item.tenVatPham || item.maVatPham}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Ô ({item.toaDoLuoiX}, {item.toaDoLuoiZ}) • Xoay {item.gocXoayDo || 0}°
                          </Typography>
                        </Box>
                      </Box>
                      {isSelected && (
                        <Chip
                          size="small"
                          label="Đang chọn"
                          sx={{
                            fontWeight: 900,
                            backgroundColor: '#10b981',
                            color: '#0f172a',
                          }}
                        />
                      )}
                    </Paper>
                  );
                })}
              </Box>

              {selectedFurniture && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<RotateRightRoundedIcon />}
                    onClick={handleRotateSelected}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      backgroundColor: '#0284c7',
                    }}
                  >
                    Xoay 90° ({selectedFurniture.gocXoayDo || 0}°)
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineRoundedIcon />}
                    disabled={furnitureList.length <= 1}
                    onClick={handleRemoveSelected}
                    sx={{ textTransform: 'none', fontWeight: 800 }}
                  >
                    Cất đi
                  </Button>
                </Box>
              )}
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: '#fbbf24', fontWeight: 900, display: 'block', mb: 1 }}
              >
                2. BẤM VÀO Ô TRÊN SÀN NHÀ 10×10 ĐỂ ĐẶT MÓN ĐANG CHỌN
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: 0.6,
                    aspectRatio: '1 / 1',
                    maxWidth: 340,
                    mx: 'auto',
                  }}
                >
                  {Array.from({ length: 10 }).map((_, rowZ) =>
                    Array.from({ length: 10 }).map((__, colX) => {
                      const itemHereIdx = furnitureList.findIndex(
                        (f) => f.toaDoLuoiX === colX && f.toaDoLuoiZ === rowZ
                      );
                      const itemHere = itemHereIdx >= 0 ? furnitureList[itemHereIdx] : null;
                      const catInfo = itemHere
                        ? FURNITURE_CATALOG.find((c) => c.maVatPham === itemHere.maVatPham)
                        : null;
                      const isCurrentSelected =
                        selectedFurniture &&
                        selectedFurniture.toaDoLuoiX === colX &&
                        selectedFurniture.toaDoLuoiZ === rowZ;

                      return (
                        <Box
                          key={`${colX}-${rowZ}`}
                          onClick={() => handlePlaceAtGrid(colX, rowZ)}
                          sx={{
                            borderRadius: 1,
                            border: isCurrentSelected
                              ? '2px solid #34d399'
                              : itemHere
                                ? '1px solid #f59e0b'
                                : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: isCurrentSelected
                              ? 'rgba(16, 185, 129, 0.35)'
                              : itemHere
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            '&:hover': {
                              backgroundColor: 'rgba(56, 189, 248, 0.25)',
                            },
                          }}
                        >
                          {catInfo?.icon || ''}
                        </Box>
                      );
                    })
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#94a3b8', display: 'block', textAlign: 'center', mt: 1.5 }}
                >
                  🚪 Cửa chính ở phía Nam • Bạn cũng có thể click trực tiếp lên sàn phòng 3D để đổi chỗ!
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}

        {/* TAB 3: ĐỔI MÀU SƠN TƯỜNG & MÁI NGÓI */}
        {activeTab === 'exterior' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Biển tên Ngôi Nhà Cấp 4"
              fullWidth
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#ffffff' },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
              }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                Màu Sơn Tường:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { color: '#f5ebd6', label: 'Vàng Kem Truyền Thống' },
                  { color: '#f8fafc', label: 'Trắng Sứ Hiện Đại' },
                  { color: '#e0f2fe', label: 'Xanh Ngọc Bắc Âu' },
                  { color: '#fce7f3', label: 'Hồng Phấn Ấm Áp' },
                  { color: '#dcfce7', label: 'Xanh Trà Xanh' },
                ].map((item) => (
                  <Chip
                    key={item.color}
                    label={item.label}
                    clickable
                    onClick={() => setWallInput(item.color)}
                    sx={{
                      fontWeight: 800,
                      border:
                        wallInput === item.color
                          ? '2px solid #fbbf24'
                          : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      color: '#ffffff',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                Màu Mái Ngói:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { color: '#b93829', label: 'Ngói Đỏ Hạ Long' },
                  { color: '#991b1b', label: 'Đỏ Đô Cổ Điển' },
                  { color: '#1e3a8a', label: 'Ngói Xanh Nhật' },
                  { color: '#0f766e', label: 'Ngói Xanh Ngọc' },
                  { color: '#334155', label: 'Ngói Xám Đá' },
                ].map((item) => (
                  <Chip
                    key={item.color}
                    label={item.label}
                    clickable
                    onClick={() => setRoofInput(item.color)}
                    sx={{
                      fontWeight: 800,
                      border:
                        roofInput === item.color
                          ? '2px solid #fbbf24'
                          : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      color: '#ffffff',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={async () => {
                await onUpdateExterior(titleInput, wallInput, roofInput);
                onClose();
              }}
              sx={{
                fontWeight: 900,
                textTransform: 'none',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#0f172a',
              }}
            >
              💾 Lưu Thiết Kế Nhà
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 3. MODAL CỬA HÀNG MUA SẮM & LÀM VIỆC KIẾM TIỀN THEO ĐỘ KHÓ (CAFE, QUÁN ĂN, QUẦN ÁO, XE)
// ============================================================================
interface ShopAndWorkModalProps {
  shopId: ShopVenueId | null;
  initialTab?: 'buy' | 'work';
  isWorkingAsStaff?: boolean;
  onToggleWorkingAsStaff?: (working: boolean) => void;
  userCoins: number;
  ownedItemCodes: string[];
  activeOutfitColor: string;
  activeVehicle: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
  onClose: () => void;
  onBuyShopItem: (item: ShopProductItem) => Promise<void>;
  onEquipOutfit: (outfitColor: string, hatColor: string, name: string) => void;
  onEquipVehicle: (
    vehicleType: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar',
    name: string
  ) => void;
  onCompleteWorkScenario: (scenario: WorkCustomerScenario) => Promise<void>;
  onFailWorkScenario?: (scenario: WorkCustomerScenario) => void;
}

export function ShopAndWorkModal({
  shopId,
  initialTab = 'buy',
  isWorkingAsStaff = false,
  onToggleWorkingAsStaff,
  userCoins,
  ownedItemCodes,
  activeOutfitColor,
  activeVehicle,
  onClose,
  onBuyShopItem,
  onEquipOutfit,
  onEquipVehicle,
  onCompleteWorkScenario,
  onFailWorkScenario,
}: ShopAndWorkModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'work'>(
    isWorkingAsStaff ? initialTab : 'buy'
  );
  const [difficulty, setDifficulty] = useState<WorkDifficulty>('easy');
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayInput, setEssayInput] = useState<string>('');
  const [workFeedback, setWorkFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    correctAnswer: string;
    explanationVi: string;
  } | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Tự động đóng modal sau khi trả lời xong (không cần bấm nút đón khách thủ công, quán tự điều phối khách)
  useEffect(() => {
    if (!workFeedback) return;
    const timer = setTimeout(() => {
      setWorkFeedback(null);
      setSelectedOption('');
      setEssayInput('');
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [workFeedback, onClose]);

  useEffect(() => {
    if (shopId) {
      setActiveTab(isWorkingAsStaff ? initialTab : 'buy');
      setWorkFeedback(null);
      setSelectedOption('');
      setEssayInput('');
    }
  }, [shopId, initialTab, isWorkingAsStaff]);

  const shop = shopId ? CITY_SHOPS_DATA[shopId] : null;

  const scenariosForDifficulty = useMemo(() => {
    if (!shop) return [];
    return shop.workScenarios.filter((s) => s.difficulty === difficulty);
  }, [shop, difficulty]);

  if (!shop) return null;

  const currentScenario =
    scenariosForDifficulty[scenarioIdx % Math.max(1, scenariosForDifficulty.length)] ||
    shop.workScenarios[0];

  const handleCheckWorkAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScenario || workFeedback) return;

    let isCorrect = false;
    if (currentScenario.questionType === 'essay_fill') {
      const clean = essayInput.trim().toLowerCase();
      const accepted = (
        currentScenario.acceptedAnswers || [currentScenario.correctAnswer]
      ).map((a) => a.trim().toLowerCase());
      isCorrect = accepted.includes(clean);
    } else {
      isCorrect =
        selectedOption.trim().toLowerCase() ===
        currentScenario.correctAnswer.trim().toLowerCase();
    }

    if (isCorrect) {
      setBusy(true);
      try {
        await onCompleteWorkScenario(currentScenario);
        setWorkFeedback({
          isCorrect: true,
          headline: `🎉 Tuyệt vời! Khách hàng ${currentScenario.customerName} rất hài lòng và đã mua hàng! (+${currentScenario.rewardCoins} Xu, +${currentScenario.rewardExp} EXP)`,
          correctAnswer: currentScenario.correctAnswer,
          explanationVi: currentScenario.explanationVi,
        });
      } finally {
        setBusy(false);
      }
    } else {
      // Khi trả lời sai: Hiển thị giải thích chi tiết và khách sẽ KHÔNG mua nữa, nhường chỗ cho khách tiếp theo!
      onFailWorkScenario?.(currentScenario);
      setWorkFeedback({
        isCorrect: false,
        headline: `😞 Bạn trả lời sai rồi! Khách hàng ${currentScenario.customerName} không mua nữa và đã rời khỏi quầy!`,
        correctAnswer: currentScenario.correctAnswer,
        explanationVi: currentScenario.explanationVi,
      });
    }
  };

  return (
    <Dialog
      open={Boolean(shopId)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          border: `2px solid ${shop.accentColor}`,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffffff' }}>
            {shop.title}
          </Typography>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
            {isWorkingAsStaff
              ? `👨‍🍳 Đang làm nhân viên (${shop.jobTitle}) • Tiếp khách NPC kiếm Xu`
              : `🛒 Khách hàng mua sắm • ${shop.subtitle}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          {onToggleWorkingAsStaff && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const nextWorking = !isWorkingAsStaff;
                onToggleWorkingAsStaff(nextWorking);
                setActiveTab(nextWorking ? 'work' : 'buy');
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 900,
                fontSize: '0.74rem',
                borderRadius: 2,
                borderColor: isWorkingAsStaff ? '#f87171' : '#fbbf24',
                color: isWorkingAsStaff ? '#fca5a5' : '#fef08a',
                backgroundColor: isWorkingAsStaff
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.14)',
              }}
            >
              {isWorkingAsStaff
                ? '🛑 Nghỉ làm (Trở lại làm khách mua hàng)'
                : `💼 Xin làm nhân viên (${shop.jobTitle})`}
            </Button>
          )}
          <Chip
            label={`🪙 ${userCoins} Xu`}
            sx={{
              fontWeight: 900,
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fde68a',
              border: '1.5px solid #f59e0b',
            }}
          />
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {isWorkingAsStaff && (
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 900,
                color: '#94a3b8',
                '&.Mui-selected': { color: '#fbbf24' },
              },
            }}
          >
            <Tab
              value="work"
              icon={<WorkRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`💼 Quầy Tiếp Khách NPC (${shop.jobTitle})`}
            />
            <Tab
              value="buy"
              icon={<ShoppingCartRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`🛒 Xem Hàng Hóa (${shop.products.length} mặt hàng)`}
            />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ pt: 2.5, maxHeight: '72vh' }}>
        {/* TAB 1: MUA ĐỒ ĂN UỐNG / QUẦN ÁO / XE CỘ */}
        {activeTab === 'buy' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {shop.products.map((item) => {
              const isOwned = ownedItemCodes.includes(item.id);
              const canAfford = userCoins >= item.priceCoins;
              const isEquippedOutfit =
                item.category === 'clothing' && item.outfitColor === activeOutfitColor;
              const isEquippedVehicle =
                item.category === 'vehicle' && item.vehicleType === activeVehicle;

              return (
                <Paper
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: 'rgba(15, 23, 42, 0.78)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '2.2rem' }}>{item.icon}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ffffff' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700 }}>
                        {item.englishName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 1.2,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={`🪙 ${item.priceCoins} Xu`}
                        sx={{
                          fontWeight: 900,
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: '#fde68a',
                        }}
                      />
                      <Chip
                        size="small"
                        label={`+${item.expReward} EXP`}
                        sx={{
                          fontWeight: 800,
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: '#bae6fd',
                        }}
                      />
                    </Box>

                    {item.category === 'clothing' && isOwned ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          onEquipOutfit(
                            item.outfitColor || '#38bdf8',
                            item.hatColor || '#f59e0b',
                            item.name
                          )
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          backgroundColor: isEquippedOutfit ? '#10b981' : '#38bdf8',
                          color: '#0f172a',
                        }}
                      >
                        {isEquippedOutfit ? '✅ Đang mặc' : '👕 Mặc ngay'}
                      </Button>
                    ) : item.category === 'vehicle' && isOwned ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          onEquipVehicle(
                            isEquippedVehicle ? 'none' : item.vehicleType || 'skateboard',
                            item.name
                          )
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          backgroundColor: isEquippedVehicle ? '#ef4444' : '#38bdf8',
                          color: isEquippedVehicle ? '#ffffff' : '#0f172a',
                        }}
                      >
                        {isEquippedVehicle ? '🚶 Xuống xe' : '🔑 Lấy xe lái'}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busy || !canAfford}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await onBuyShopItem(item);
                          } finally {
                            setBusy(false);
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          backgroundColor: canAfford ? '#fbbf24' : 'rgba(255,255,255,0.08)',
                          color: canAfford ? '#0f172a' : '#64748b',
                        }}
                      >
                        {canAfford ? '🛒 Mua ngay' : 'Không đủ Xu'}
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* TAB 2: LÀM VIỆC TIẾP ĐÓN KHÁCH NPC THEO ĐỘ KHÓ */}
        {activeTab === 'work' && currentScenario && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#cbd5e1', mr: 1 }}>
                Chọn độ khó ca làm việc:
              </Typography>
              {[
                { id: 'easy', label: '🟢 Dễ (Easy • +35~40 Xu)', color: '#10b981' },
                { id: 'medium', label: '🟡 Trung bình (Medium • +65~75 Xu)', color: '#f59e0b' },
                { id: 'hard', label: '🔴 Khó (Hard • +110~130 Xu)', color: '#ef4444' },
              ].map((lv) => (
                <Chip
                  key={lv.id}
                  label={lv.label}
                  clickable
                  onClick={() => {
                    setDifficulty(lv.id as WorkDifficulty);
                    setScenarioIdx(0);
                    setSelectedOption('');
                    setEssayInput('');
                    setWorkFeedback(null);
                  }}
                  sx={{
                    fontWeight: 900,
                    backgroundColor:
                      difficulty === lv.id ? lv.color : 'rgba(255,255,255,0.08)',
                    color: difficulty === lv.id ? '#0f172a' : '#cbd5e1',
                  }}
                />
              ))}
            </Box>

            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(251, 191, 36, 0.4)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Typography sx={{ fontSize: '2rem' }}>
                    {currentScenario.customerAvatar}
                  </Typography>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fef08a' }}>
                      Khách hàng NPC: {currentScenario.customerName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {workFeedback && !workFeedback.isCorrect
                        ? '🚫 Khách hàng đã từ chối mua và rời khỏi quầy!'
                        : `Đang đứng trước quầy làm việc trong ${shop.title}`}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    component="a"
                    href={ENGLISH_SOURCE_BOOK.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    label={`📘 ${currentScenario.unitSource || ENGLISH_SOURCE_BOOK.title}`}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: 'rgba(56, 189, 248, 0.2)',
                      color: '#bae6fd',
                      textDecoration: 'none',
                    }}
                  />
                  <Chip
                    label={`Thưởng: +${currentScenario.rewardCoins} Xu • +${currentScenario.rewardExp} EXP`}
                    sx={{
                      fontWeight: 900,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                    }}
                  />
                </Box>
              </Box>

              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  borderLeft: '4px solid #38bdf8',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#ffffff', whiteSpace: 'pre-line' }}>
                  &ldquo;{currentScenario.customerOrderEn}&rdquo;
                </Typography>
                <Typography variant="caption" sx={{ color: '#bae6fd', display: 'block', mt: 0.8 }}>
                  💡 Ngữ cảnh & Yêu cầu: {currentScenario.contextHintVi}
                </Typography>
              </Paper>

              <Box component="form" onSubmit={handleCheckWorkAnswer}>
                {currentScenario.questionType === 'essay_fill' ? (
                  <TextField
                    fullWidth
                    size="small"
                    disabled={Boolean(workFeedback)}
                    placeholder="Điền từ / câu trả lời Tiếng Anh cho khách hàng..."
                    value={essayInput}
                    onChange={(e) => setEssayInput(e.target.value)}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1.2,
                      mb: 2,
                    }}
                  >
                    {(currentScenario.options || []).map((opt, idx) => {
                      const isSelected = selectedOption === opt;
                      const isRightAnswer =
                        Boolean(workFeedback) &&
                        opt.trim().toLowerCase() ===
                          currentScenario.correctAnswer.trim().toLowerCase();
                      return (
                        <Button
                          key={idx}
                          disabled={Boolean(workFeedback)}
                          variant={isSelected || isRightAnswer ? 'contained' : 'outlined'}
                          onClick={() => setSelectedOption(opt)}
                          sx={{
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            fontWeight: 800,
                            py: 1.2,
                            px: 2,
                            borderRadius: 2,
                            backgroundColor: isRightAnswer
                              ? '#10b981'
                              : isSelected
                                ? workFeedback && !workFeedback.isCorrect
                                  ? '#ef4444'
                                  : '#0284c7'
                                : 'rgba(255,255,255,0.04)',
                            borderColor: isRightAnswer
                              ? '#34d399'
                              : isSelected
                                ? '#38bdf8'
                                : 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            '&.Mui-disabled': {
                              color: '#ffffff',
                              opacity: isRightAnswer || isSelected ? 1 : 0.6,
                            },
                          }}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {workFeedback && (
                  <Alert
                    severity={workFeedback.isCorrect ? 'success' : 'error'}
                    sx={{ mb: 2, borderRadius: 2.5, fontWeight: 700 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.6 }}>
                      {workFeedback.headline}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#fef08a', mb: 0.5 }}>
                      ✅ Đáp án đúng: &ldquo;{workFeedback.correctAnswer}&rdquo;
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      📖 Giải thích: {workFeedback.explanationVi}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                  {workFeedback ? (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setWorkFeedback(null);
                        setSelectedOption('');
                        setEssayInput('');
                        onClose();
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 900,
                        py: 1.3,
                        backgroundColor: workFeedback.isCorrect ? '#10b981' : '#f59e0b',
                        color: '#0f172a',
                        '&:hover': {
                          backgroundColor: workFeedback.isCorrect ? '#34d399' : '#fbbf24',
                        },
                      }}
                    >
                      {workFeedback.isCorrect
                        ? '✅ Phục vụ xong! Khách đang mang đồ ra bàn ngồi [Tự động quay lại]'
                        : '🚪 Khách đã rời quán — Trở lại quầy đón khách [Tự động quay lại]'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#94a3b8',
                          borderColor: 'rgba(255,255,255,0.2)',
                        }}
                      >
                        Đóng
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={
                          busy ||
                          (currentScenario.questionType === 'essay_fill'
                            ? !essayInput.trim()
                            : !selectedOption)
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          px: 3,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#ffffff',
                        }}
                      >
                        💬 Phục Vụ Khách & Nhận Tiền Thưởng
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 4. MODAL TRÒ CHUYỆN & LUYỆN TIẾNG ANH CÙNG CƯ DÂN / NPC TRÊN ĐƯỜNG (PHÍM [E])
// ============================================================================
interface StreetNpcDialogueModalProps {
  npcId: string | null;
  onClose: () => void;
  onCompleteScenario: (scenario: StreetNpcScenario) => Promise<void>;
}

export function StreetNpcDialogueModal({
  npcId,
  onClose,
  onCompleteScenario,
}: StreetNpcDialogueModalProps) {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayInput, setEssayInput] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    correctAnswer: string;
    explanationVi: string;
  } | null>(null);

  useEffect(() => {
    if (npcId) {
      setScenarioIdx(0);
      setSelectedOption('');
      setEssayInput('');
      setFeedback(null);
    }
  }, [npcId]);

  const npcProfile = npcId
    ? STREET_NPCS_DIALOGUE_DATA[npcId] || STREET_NPCS_DIALOGUE_DATA.CITIZEN_SOPHIA
    : null;

  const currentScenario: StreetNpcScenario | null = useMemo(() => {
    if (!npcProfile) return null;
    const list = npcProfile.scenarios;
    return list[scenarioIdx % list.length] || list[0] || null;
  }, [npcProfile, scenarioIdx]);

  // Phát âm câu nói tiếng Anh của NPC bằng Web Speech API khi mở modal hoặc đổi câu
  const speakEnglishText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/["“”_]+/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'en-GB';
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors
    }
  };

  useEffect(() => {
    if (npcId && currentScenario?.npcSpeechEn) {
      speakEnglishText(currentScenario.npcSpeechEn);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [npcId, currentScenario?.id]);

  if (!npcId || !npcProfile || !currentScenario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || feedback) return;

    let isCorrect = false;
    if (currentScenario.questionType === 'multiple_choice') {
      isCorrect = selectedOption === currentScenario.correctAnswer;
    } else {
      const normalized = essayInput.trim().toLowerCase();
      const accepted = (currentScenario.acceptedAnswers || [currentScenario.correctAnswer]).map(
        (a) => a.toLowerCase().trim()
      );
      isCorrect = accepted.includes(normalized);
    }

    if (isCorrect) {
      setBusy(true);
      try {
        await onCompleteScenario(currentScenario);
        setFeedback({
          isCorrect: true,
          headline: `🎉 Tuyệt vời! ${npcProfile.name} rất ấn tượng với khả năng Tiếng Anh của bạn! (+${currentScenario.rewardCoins} Xu & +${currentScenario.rewardExp} EXP)`,
          correctAnswer: currentScenario.correctAnswer,
          explanationVi: currentScenario.explanationVi,
        });
      } finally {
        setBusy(false);
      }
    } else {
      setFeedback({
        isCorrect: false,
        headline: `💡 Chưa chính xác! Hãy xem đáp án đúng và giải thích ngữ pháp từ ${npcProfile.name} nhé:`,
        correctAnswer: currentScenario.correctAnswer,
        explanationVi: currentScenario.explanationVi,
      });
    }
  };

  return (
    <Dialog
      open={Boolean(npcId)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
          border: `2px solid ${npcProfile.accentColor}`,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: `2px solid ${npcProfile.accentColor}`,
            }}
          >
            {npcProfile.avatarEmoji}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
              {npcProfile.name}
            </Typography>
            <Typography variant="caption" sx={{ color: npcProfile.accentColor, fontWeight: 800 }}>
              {npcProfile.role} • 📍 {npcProfile.locationLabel}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Nguồn sách Destination B1 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.5,
          }}
        >
          <Chip
            size="small"
            label={`📚 ${currentScenario.unitSource || ENGLISH_SOURCE_BOOK.title}`}
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              backgroundColor: 'rgba(56, 189, 248, 0.16)',
              color: '#7dd3fc',
              border: '1px solid rgba(56, 189, 248, 0.35)',
            }}
          />
          <Chip
            size="small"
            label={`Thưởng: +${currentScenario.rewardCoins} Xu • +${currentScenario.rewardExp} EXP`}
            sx={{
              fontWeight: 900,
              fontSize: '0.72rem',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fde68a',
              border: '1px solid rgba(245, 158, 11, 0.45)',
            }}
          />
        </Box>

        {/* Lời thoại tiếng Anh của NPC */}
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 900 }}>
              🗣️ {npcProfile.name} trò chuyện cùng bạn:
            </Typography>
            <Button
              size="small"
              onClick={() => speakEnglishText(currentScenario.npcSpeechEn)}
              sx={{
                textTransform: 'none',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#7dd3fc',
                py: 0.2,
                px: 1,
                borderRadius: 1.5,
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
              }}
            >
              🔊 Nghe phát âm
            </Button>
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 800,
              color: '#f8fafc',
              whiteSpace: 'pre-line',
              lineHeight: 1.55,
              mb: 1,
            }}
          >
            {currentScenario.npcSpeechEn}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#fde68a',
              fontWeight: 700,
            }}
          >
            💡 Gợi ý ngữ cảnh: {currentScenario.contextHintVi}
          </Typography>
        </Paper>

        {/* Form trả lời */}
        <Box component="form" onSubmit={handleSubmit}>
          {currentScenario.questionType === 'multiple_choice' && currentScenario.options ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {currentScenario.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isRightOption = feedback && opt === currentScenario.correctAnswer;
                const isWrongSelected = feedback && isSelected && !feedback.isCorrect;
                return (
                  <Button
                    key={opt}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => setSelectedOption(opt)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      textTransform: 'none',
                      py: 1.2,
                      px: 2,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      color: isRightOption
                        ? '#dcfce7'
                        : isWrongSelected
                        ? '#fee2e2'
                        : isSelected
                        ? '#0f172a'
                        : '#f8fafc',
                      backgroundColor: isRightOption
                        ? 'rgba(16, 185, 129, 0.32)'
                        : isWrongSelected
                        ? 'rgba(239, 68, 68, 0.3)'
                        : isSelected
                        ? '#38bdf8'
                        : 'rgba(255,255,255,0.06)',
                      border: isRightOption
                        ? '2px solid #10b981'
                        : isWrongSelected
                        ? '2px solid #ef4444'
                        : isSelected
                        ? '2px solid #bae6fd'
                        : '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </Button>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                autoFocus
                disabled={Boolean(feedback)}
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                placeholder="Nhập từ vựng tiếng Anh còn thiếu..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    fontWeight: 800,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    borderRadius: 2.5,
                  },
                }}
              />
            </Box>
          )}

          {feedback && (
            <Alert
              severity={feedback.isCorrect ? 'success' : 'error'}
              sx={{ mb: 2, borderRadius: 2.5, fontWeight: 700 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>
                {feedback.headline}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#fef08a', mb: 0.4 }}>
                ✅ Đáp án đúng: &ldquo;{feedback.correctAnswer}&rdquo;
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                📖 Giải thích: {feedback.explanationVi}
              </Typography>
            </Alert>
          )}

          <DialogActions sx={{ px: 0, pb: 0, justifyContent: 'space-between' }}>
            <Button
              type="button"
              onClick={onClose}
              sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'none' }}
            >
              Đóng hội thoại
            </Button>

            {feedback ? (
              <Button
                type="button"
                variant="contained"
                onClick={() => {
                  if (npcProfile.scenarios.length > 1) {
                    setScenarioIdx((i) => i + 1);
                    setSelectedOption('');
                    setEssayInput('');
                    setFeedback(null);
                  } else {
                    onClose();
                  }
                }}
                sx={{
                  borderRadius: 2.5,
                  px: 3,
                  fontWeight: 900,
                  textTransform: 'none',
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                }}
              >
                {npcProfile.scenarios.length > 1
                  ? `⏭️ Chủ đề tiếp theo cùng ${npcProfile.name}`
                  : '✅ Hoàn thành cuộc trò chuyện'}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={
                  busy ||
                  (currentScenario.questionType === 'essay_fill'
                    ? !essayInput.trim()
                    : !selectedOption)
                }
                sx={{
                  borderRadius: 2.5,
                  px: 3,
                  fontWeight: 900,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                  color: '#ffffff',
                }}
              >
                💬 Trả Lời {npcProfile.name}
              </Button>
            )}
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

