'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import {
  FURNITURE_CATALOG,
  MODERN_HOUSE_MODELS,
  FISHING_ENGLISH_QUESTIONS,
  CITY_SHOPS_DATA,
  ENGLISH_SOURCE_BOOK,
  STREET_NPCS_DIALOGUE_DATA,
  ENGLISH_DATABASE_SOURCES,
  convertMultiSourceItemToNpcScenario,
  markQuestionAsAsked,
  type EnglishDatabaseSourceId,
  type MultiSourceEnglishItem,
  type FurnitureCatalogItem,
  type ModernHouseModelItem,
  type ModernHouseStyleId,
  type EnglishChallengeQuestion,
  type ShopVenueId,
  type ShopProductItem,
  type WorkCustomerScenario,
  type StreetNpcScenario,
  type StreetNpcProfile,
  type AvatarTopStyle,
  type AvatarHatStyle,
  type AvatarAccessoryStyle,
  type WorldVehicleType,
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

// Bộ nhớ lưu lịch sử các câu hỏi câu cá đã trả lời để đảm bảo random KHÔNG TRÙNG LẶP
const sessionFishingHistory: string[] = [];

export function FishingQuizModal({
  isOpen,
  pendingFish,
  onSuccess,
  onCancel,
}: FishingQuizModalProps) {
  const [questionTypeFilter, setQuestionTypeFilter] = useState<
    'all' | 'multiple_choice' | 'essay_fill' | 'knowledge'
  >('all');
  const [currentQuestion, setCurrentQuestion] = useState<EnglishChallengeQuestion>(
    FISHING_ENGLISH_QUESTIONS[0]
  );
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayAnswer, setEssayAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const pickNextFishingQuestion = useCallback(
    (filter: 'all' | 'multiple_choice' | 'essay_fill' | 'knowledge') => {
      const candidates =
        filter === 'all'
          ? FISHING_ENGLISH_QUESTIONS
          : FISHING_ENGLISH_QUESTIONS.filter((q) => q.questionType === filter);

      let unasked = candidates.filter((q) => !sessionFishingHistory.includes(q.id));
      if (unasked.length === 0) {
        unasked = candidates;
        sessionFishingHistory.length = 0;
      }
      const chosen = unasked[Math.floor(Math.random() * unasked.length)] || candidates[0];
      sessionFishingHistory.push(chosen.id);
      setCurrentQuestion(chosen);
      setSelectedOption('');
      setEssayAnswer('');
      setFeedback(null);
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      pickNextFishingQuestion(questionTypeFilter);
    }
  }, [isOpen, questionTypeFilter, pickNextFishingQuestion]);

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
                pickNextFishingQuestion(tab.id as any);
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
                  pickNextFishingQuestion(questionTypeFilter);
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
  houseStyle?: ModernHouseStyleId;
  myPlotLabel: string;
  onClose: () => void;
  onBuyFurniture: (item: FurnitureCatalogItem) => Promise<void>;
  onUpdateFurnitureList: (newList: HouseFurnitureRenderItem[]) => Promise<void>;
  onUpdateExterior: (nextTitle: string, nextWall: string, nextRoof: string) => Promise<void>;
  onUpgradeHouseModel?: (model: ModernHouseModelItem) => Promise<void>;
}

export function HouseFurnitureModal({
  isOpen,
  userCoins,
  furnitureList,
  houseTitle,
  houseWallColor,
  houseRoofColor,
  houseStyle = 'traditional',
  myPlotLabel,
  onClose,
  onBuyFurniture,
  onUpdateFurnitureList,
  onUpdateExterior,
  onUpgradeHouseModel,
}: HouseFurnitureModalProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'shop' | 'decorate' | 'exterior'>('models');
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
          variant="scrollable"
          scrollButtons="auto"
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
            value="models"
            icon={<HomeWorkRoundedIcon fontSize="small" />}
            iconPosition="start"
            label={`🏡 Mẫu Nhà Hiện Đại (${MODERN_HOUSE_MODELS.length} mẫu)`}
          />
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
        {/* TAB 0: CÁC MẪU NHÀ HIỆN ĐẠI (KIẾN TRÚC TỪ PHỔ THÔNG ĐẾN SIÊU SANG) */}
        {activeTab === 'models' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fbbf24' }}>
                  🏡 Nâng Cấp Kiến Trúc Nhà Ở Hiện Đại
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  Lựa chọn mẫu biệt thự theo phong cách yêu thích của bạn. Kiến trúc 3D ngoài lô đất sẽ tự động biến đổi hoàn toàn!
                </Typography>
              </Box>
              <Chip
                label={`Đang áp dụng: ${
                  MODERN_HOUSE_MODELS.find((m) => m.styleId === houseStyle)?.name || 'Nhà Cấp 4 Mặc Định'
                }`}
                sx={{
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid #10b981',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2.5,
              }}
            >
              {MODERN_HOUSE_MODELS.map((model) => {
                const isCurrent = (houseStyle || 'traditional') === model.styleId;
                const canAfford = userCoins >= model.priceCoins;
                const isFree = model.priceCoins === 0;

                return (
                  <Paper
                    key={model.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: isCurrent
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(15, 23, 42, 0.85)',
                      border: isCurrent
                        ? '2px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: isCurrent ? '#10b981' : '#f59e0b',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                      },
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.8rem' }}>{model.icon}</Typography>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffffff', fontSize: '1.05rem' }}>
                              {model.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={`Cấp ${model.tier} • ${model.englishName}`}
                              sx={{
                                height: 20,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                                color: '#7dd3fc',
                              }}
                            />
                          </Box>
                        </Box>

                        <Chip
                          label={isFree ? 'Miễn phí' : `🪙 ${model.priceCoins.toLocaleString()} Xu`}
                          sx={{
                            fontWeight: 900,
                            backgroundColor: isFree
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                            color: isFree ? '#6ee7b7' : '#fde68a',
                            border: isFree ? '1px solid #10b981' : '1px solid #f59e0b',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1, fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {model.description}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.5 }}>
                        {model.highlights.map((hl, hIdx) => (
                          <Chip
                            key={hIdx}
                            size="small"
                            label={`✨ ${hl}`}
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#e2e8f0',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        pt: 1.5,
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {isCurrent ? (
                        <Button
                          disabled
                          variant="contained"
                          sx={{
                            backgroundColor: '#10b981 !important',
                            color: '#0f172a !important',
                            fontWeight: 900,
                            borderRadius: 2,
                            textTransform: 'none',
                          }}
                        >
                          ✅ Đang Sử Dụng Mẫu Này
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          disabled={busy || (!isFree && !canAfford)}
                          onClick={async () => {
                            if (!onUpgradeHouseModel) return;
                            setBusy(true);
                            try {
                              await onUpgradeHouseModel(model);
                            } finally {
                              setBusy(false);
                            }
                          }}
                          sx={{
                            fontWeight: 900,
                            borderRadius: 2,
                            textTransform: 'none',
                            background: canAfford || isFree
                              ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                              : 'rgba(255,255,255,0.1)',
                            color: canAfford || isFree ? '#ffffff' : '#64748b',
                            boxShadow: canAfford || isFree ? '0 4px 14px rgba(234, 88, 12, 0.4)' : 'none',
                          }}
                        >
                          {isFree ? '🔨 Đổi Sang Mẫu Này' : canAfford ? `🔨 Xây Dựng (🪙 ${model.priceCoins} Xu)` : 'Thiếu Xu'}
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

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
  activeVehicle: WorldVehicleType;
  onClose: () => void;
  onBuyShopItem: (item: ShopProductItem) => Promise<void>;
  onEquipOutfit: (item: ShopProductItem) => void;
  onEquipVehicle: (
    vehicleType: WorldVehicleType,
    vehicleColor: string | undefined,
    name: string
  ) => void;
  onOpenWardrobe?: () => void;
  onCompleteWorkScenario: (scenario: WorkCustomerScenario) => Promise<void>;
  onFailWorkScenario?: (scenario: WorkCustomerScenario) => void;
}

// Lưu lịch sử các kịch bản khách hàng đã phục vụ để chọn ngẫu nhiên KHÔNG TRÙNG LẶP
const sessionShopWorkHistoryMap: Record<string, string[]> = {};

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
  onOpenWardrobe,
  onCompleteWorkScenario,
  onFailWorkScenario,
}: ShopAndWorkModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'work'>(
    isWorkingAsStaff ? initialTab : 'buy'
  );
  const [difficulty, setDifficulty] = useState<WorkDifficulty>('easy');
  const [currentScenario, setCurrentScenario] = useState<WorkCustomerScenario | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayInput, setEssayInput] = useState<string>('');
  const [workFeedback, setWorkFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    correctAnswer: string;
    explanationVi: string;
  } | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Chọn kịch bản khách hàng ngẫu nhiên KHÔNG LẶP LẠI theo độ khó
  const pickNextWorkScenario = useCallback((venueId: ShopVenueId, diff: WorkDifficulty) => {
    const s = CITY_SHOPS_DATA[venueId];
    if (!s) return;
    const pool = s.workScenarios.filter((sc) => sc.difficulty === diff);
    const key = `${venueId}_${diff}`;
    const history = sessionShopWorkHistoryMap[key] || [];
    let unasked = pool.filter((sc) => !history.includes(sc.id));
    if (unasked.length === 0) {
      unasked = pool;
      sessionShopWorkHistoryMap[key] = [];
    }
    const chosen = unasked[Math.floor(Math.random() * unasked.length)] || pool[0];
    sessionShopWorkHistoryMap[key] = [...(sessionShopWorkHistoryMap[key] || []), chosen.id];
    setCurrentScenario(chosen);
    setSelectedOption('');
    setEssayInput('');
    setWorkFeedback(null);
  }, []);

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
      pickNextWorkScenario(shopId, difficulty);
    }
  }, [shopId, initialTab, isWorkingAsStaff, difficulty, pickNextWorkScenario]);

  const shop = shopId ? CITY_SHOPS_DATA[shopId] : null;

  if (!shop || !currentScenario) return null;

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
          {(shopId === 'CLOTHING' || shopId === 'CAR_SHOWROOM') && onOpenWardrobe && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                onClose();
                onOpenWardrobe();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 900,
                fontSize: '0.74rem',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#ffffff',
              }}
            >
              👗 Phòng Tự Phối Đồ & Đổi Màu Xe
            </Button>
          )}
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
                    <Typography sx={{ fontSize: '2.4rem' }}>{item.icon}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ffffff' }}>
                          {item.name}
                        </Typography>
                        {item.brand && (
                          <Chip
                            size="small"
                            label={item.brand}
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 900,
                              backgroundColor: 'rgba(236, 72, 153, 0.18)',
                              color: '#fbcfe8',
                              border: '1px solid rgba(236, 72, 153, 0.4)',
                            }}
                          />
                        )}
                        {item.speedBoost && (
                          <Chip
                            size="small"
                            label={`⚡ ${item.speedBoost} m/s`}
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 900,
                              backgroundColor: 'rgba(56, 189, 248, 0.18)',
                              color: '#bae6fd',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700, display: 'block', mt: 0.3 }}>
                        {item.englishName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#94a3b8', display: 'block', mt: 0.5, lineHeight: 1.4 }}
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
                        onClick={() => onEquipOutfit(item)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 900,
                          backgroundColor: isEquippedOutfit ? '#10b981' : '#38bdf8',
                          color: '#0f172a',
                        }}
                      >
                        {isEquippedOutfit ? '✅ Đang mặc' : '👕 Mặc bộ này'}
                      </Button>
                    ) : item.category === 'vehicle' && isOwned ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          onEquipVehicle(
                            isEquippedVehicle ? 'none' : item.vehicleType || 'skateboard',
                            item.vehicleColor,
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
                    if (shopId) {
                      pickNextWorkScenario(shopId, lv.id as WorkDifficulty);
                    }
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
// Tích hợp Cơ Sở Dữ Liệu Tiếng Anh Đa Nguồn (6 bộ giáo trình + MongoDB + Open API)
// ============================================================================
const NPC_GLOBAL_HISTORY_STORAGE_KEY = 'lifeat_npc_global_asked_v3';
const sessionGlobalAskedScenarioIds = new Set<string>();
let cachedDynamicApiScenarios: StreetNpcScenario[] = [];
let hasFetchedDynamicApi = false;

function getAskedNpcScenarioIds(): Set<string> {
  if (typeof window !== 'undefined' && sessionGlobalAskedScenarioIds.size === 0) {
    try {
      const raw = window.localStorage.getItem(NPC_GLOBAL_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => sessionGlobalAskedScenarioIds.add(String(id)));
        }
      }
    } catch {}
  }
  return sessionGlobalAskedScenarioIds;
}

function recordAskedNpcScenarioId(scenarioId: string): void {
  sessionGlobalAskedScenarioIds.add(scenarioId);
  markQuestionAsAsked(scenarioId);
  if (typeof window !== 'undefined') {
    try {
      const recent = Array.from(sessionGlobalAskedScenarioIds).slice(-140);
      window.localStorage.setItem(NPC_GLOBAL_HISTORY_STORAGE_KEY, JSON.stringify(recent));
    } catch {}
  }
}

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
  const [sourceFilter, setSourceFilter] = useState<EnglishDatabaseSourceId | 'ALL'>('ALL');
  const [dynamicScenarios, setDynamicScenarios] = useState<StreetNpcScenario[]>(
    cachedDynamicApiScenarios
  );
  const [currentScenario, setCurrentScenario] = useState<StreetNpcScenario | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [essayInput, setEssayInput] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    correctAnswer: string;
    explanationVi: string;
  } | null>(null);

  const npcProfile = npcId
    ? STREET_NPCS_DIALOGUE_DATA[npcId] || STREET_NPCS_DIALOGUE_DATA.CITIZEN_SOPHIA
    : null;

  // Đồng bộ thêm câu hỏi từ API Đa Nguồn (MongoDB + Open Trivia DB)
  useEffect(() => {
    if (hasFetchedDynamicApi) return;
    hasFetchedDynamicApi = true;
    fetch('/api/english-questions?includeExternal=true')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.questions)) {
          const converted = (data.questions as MultiSourceEnglishItem[]).map(
            convertMultiSourceItemToNpcScenario
          );
          cachedDynamicApiScenarios = converted;
          setDynamicScenarios(converted);
        }
      })
      .catch(() => {});
  }, []);

  // Lựa chọn câu hỏi NGẪU NHIÊN & KHÔNG TRÙNG LẶP trên toàn thế giới
  const pickNextScenario = useCallback(
    (
      npc: StreetNpcProfile,
      filterSource: EnglishDatabaseSourceId | 'ALL' = sourceFilter,
      excludeCurrentId?: string
    ) => {
      const askedSet = getAskedNpcScenarioIds();

      // Hợp nhất kho câu hỏi của NPC và kho động từ API (MongoDB + OpenTDB)
      const mergedMap = new Map<string, StreetNpcScenario>();
      for (const sc of npc.scenarios) {
        mergedMap.set(sc.id, sc);
      }
      for (const sc of dynamicScenarios) {
        if (!mergedMap.has(sc.id)) {
          mergedMap.set(sc.id, sc);
        }
      }
      let pool = Array.from(mergedMap.values());

      // Lọc theo nguồn học liệu nếu người chơi chọn nguồn cụ thể
      if (filterSource !== 'ALL') {
        const bySource = pool.filter((s) => s.sourceId === filterSource);
        if (bySource.length > 0) {
          pool = bySource;
        }
      }

      // Tuyệt đối không lặp lại câu vừa hiển thị
      if (excludeCurrentId && pool.length > 1) {
        pool = pool.filter((s) => s.id !== excludeCurrentId);
      }

      // Lọc những câu CHƯA TỪNG HỎI trong suốt phiên chơi (bất kể hỏi bởi NPC nào)
      let unasked = pool.filter((s) => !askedSet.has(s.id));

      // Nếu đã trả lời hết sạch toàn bộ ngân hàng trong nguồn này -> Xoay vòng mới
      if (unasked.length === 0) {
        pool.forEach((s) => sessionGlobalAskedScenarioIds.delete(s.id));
        unasked = pool;
      }

      // Xáo trộn Fisher-Yates hoàn toàn ngẫu nhiên (không cố định thứ tự 1-2 đầu danh sách!)
      const randomIndex = Math.floor(Math.random() * unasked.length);
      const chosen = unasked[randomIndex] || npc.scenarios[0];

      recordAskedNpcScenarioId(chosen.id);

      // Xáo trộn luôn thứ tự 4 đáp án A, B, C, D để người chơi không học vẹt vị trí
      const shuffledOptions =
        chosen.options && chosen.options.length > 1
          ? [...chosen.options].sort(() => Math.random() - 0.5)
          : chosen.options;

      setCurrentScenario({
        ...chosen,
        options: shuffledOptions,
      });
      setSelectedOption('');
      setEssayInput('');
      setFeedback(null);
    },
    [dynamicScenarios, sourceFilter]
  );

  useEffect(() => {
    if (npcId && npcProfile) {
      pickNextScenario(npcProfile, sourceFilter);
    } else {
      setCurrentScenario(null);
    }
  }, [npcId]);

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
      isCorrect =
        selectedOption.trim().toLowerCase() ===
        currentScenario.correctAnswer.trim().toLowerCase();
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

  const totalUniqueQuestionsCount =
    npcProfile.scenarios.length + dynamicScenarios.length;

  return (
    <Dialog
      open={Boolean(npcId)}
      onClose={onClose}
      maxWidth="md"
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Nhãn Nguồn học liệu & Phần thưởng */}
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
              fontSize: '0.72rem',
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
              🗣️ {npcProfile.name} hỏi bạn:
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
                const isRightOption =
                  feedback &&
                  opt.trim().toLowerCase() === currentScenario.correctAnswer.trim().toLowerCase();
                const isWrongSelected = feedback && isSelected && !feedback.isCorrect;
                return (
                  <Button
                    key={`${opt}-${idx}`}
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

          <DialogActions sx={{ px: 0, pb: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="button"
                onClick={onClose}
                sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'none' }}
              >
                Đóng
              </Button>
            </Box>

            {feedback ? (
              <Button
                type="button"
                variant="contained"
                onClick={() => {
                  pickNextScenario(npcProfile, sourceFilter, currentScenario.id);
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
                ⏭️ Câu hỏi ngẫu nhiên tiếp theo cùng {npcProfile.name}
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

// ============================================================================
// 5. STUDIO TỰ PHỐI ĐỒ THỜI TRANG & GARA ĐỘ XE (MIX & MATCH WARDROBE STUDIO)
// ============================================================================
export interface WardrobeCustomizationState {
  avatarStyle: AvatarTopStyle;
  outfitColor: string;
  hatColor: string;
  pantsColor: string;
  shoeColor: string;
  hairColor: string;
  hatStyle: AvatarHatStyle;
  accessory: AvatarAccessoryStyle;
  activeVehicle: WorldVehicleType;
  vehicleColor: string;
}

interface WardrobeMixMatchModalProps {
  isOpen: boolean;
  state: WardrobeCustomizationState;
  ownedItemCodes?: string[];
  onChange: (patch: Partial<WardrobeCustomizationState>) => void;
  onClose: () => void;
  onOpenShop?: (shopId: 'CLOTHING' | 'CAR_SHOWROOM') => void;
}

const CLOTHING_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'streetwear', label: '🧥 Streetwear' },
  { id: 'suit', label: '🤵 Vest & Quý tộc' },
  { id: 'y2k', label: '🌸 Y2K & Trẻ trung' },
  { id: 'royal', label: '👑 Hoàng gia & Dạ tiệc' },
  { id: 'cyberpunk', label: '🦾 Cyberpunk' },
];

const ACCESSORY_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'hat', label: '👑 Mũ & Vương miện' },
  { id: 'back', label: '🪽 Cánh & Đeo lưng' },
  { id: 'glasses', label: '🕶️ Kính & Phụ kiện' },
];

const VEHICLE_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'starter', label: '🚶 Đi bộ & Ván trượt' },
  { id: 'bike', label: '🏍️ Mô tô & Xe máy' },
  { id: 'sport', label: '🏎️ Siêu xe thể thao' },
  { id: 'suv', label: '🚙 SUV & Xe sang' },
];

interface AccessoryItemDef {
  id: string;
  category: 'hat' | 'back' | 'glasses';
  label: string;
  icon: string;
  hatStyle?: AvatarHatStyle;
  accessory?: AvatarAccessoryStyle;
  defaultUnlocked?: boolean;
}

const ACCESSORY_ITEMS_LIST: AccessoryItemDef[] = [
  // Mũ & Vương miện
  { id: 'snapback', category: 'hat', hatStyle: 'snapback', label: 'Mũ Lưỡi Trai Snapback', icon: '🧢', defaultUnlocked: true },
  { id: 'beret', category: 'hat', hatStyle: 'beret', label: 'Mũ Nồi Nghệ Sĩ Paris Beret', icon: '🎨' },
  { id: 'crown', category: 'hat', hatStyle: 'crown', label: 'Vương Miện Hoàng Gia Đính Đá', icon: '👑' },
  { id: 'cat_ears', category: 'hat', hatStyle: 'cat_ears', label: 'Mũ Tai Mèo Phát Sáng Harajuku', icon: '🐱' },
  { id: 'halo', category: 'hat', hatStyle: 'halo', label: 'Vòng Hào Quang Thiên Thần', icon: '😇' },
  { id: 'no_hat', category: 'hat', hatStyle: 'none', label: 'Tháo Mũ (Khoe tóc tự nhiên)', icon: '💇', defaultUnlocked: true },
  // Cánh & Đeo lưng
  { id: 'angel_wings', category: 'back', accessory: 'angel_wings', label: 'Đôi Cánh Thiên Thần Tuyết Lông Vũ', icon: '🪽' },
  { id: 'cyber_wings', category: 'back', accessory: 'cyber_wings', label: 'Đôi Cánh Cơ Giới Cyber 2077', icon: '🦾' },
  { id: 'guitar_back', category: 'back', accessory: 'guitar_back', label: 'Đàn Guitar Acoustic Gỗ Lãng Tử', icon: '🎸' },
  { id: 'crossbody_bag', category: 'back', accessory: 'crossbody_bag', label: 'Túi Da Đeo Chéo Thời Trang', icon: '👜' },
  // Kính & Tai nghe
  { id: 'sunglasses', category: 'glasses', accessory: 'sunglasses', label: 'Kính Râm Thời Thượng Sành Điệu', icon: '🕶️' },
  { id: 'headphones', category: 'glasses', accessory: 'headphones', label: 'Tai Nghe DJ Chống Ồn', icon: '🎧', defaultUnlocked: true },
  { id: 'no_accessory', category: 'glasses', accessory: 'none', label: 'Tối Giản (Không đeo phụ kiện)', icon: '✨', defaultUnlocked: true },
];

export function WardrobeMixMatchModal({
  isOpen,
  state,
  ownedItemCodes = [],
  onChange,
  onClose,
  onOpenShop,
}: WardrobeMixMatchModalProps) {
  const [tab, setTab] = useState<'fashion' | 'accessories' | 'garage'>('fashion');
  const [clothingCat, setClothingCat] = useState<string>('all');
  const [accessoryCat, setAccessoryCat] = useState<string>('all');
  const [vehicleCat, setVehicleCat] = useState<string>('all');

  const ownedSet = useMemo(
    () => new Set<string>(['SKATEBOARD_STARTER', ...ownedItemCodes]),
    [ownedItemCodes]
  );

  // 1. Quần áo đã mua / sở hữu (gồm món mặc định miễn phí)
  const myPurchasedClothing = useMemo(() => {
    return (CITY_SHOPS_DATA.CLOTHING.products || []).filter(
      (item) => item.priceCoins === 0 || ownedSet.has(item.id)
    );
  }, [ownedSet]);

  // Bộ sưu tập các kiểu nón & phụ kiện đã mở khóa từ trang phục đã mua
  const unlockedHatStyles = useMemo(() => {
    const set = new Set<AvatarHatStyle>(['none', 'snapback']);
    myPurchasedClothing.forEach((c) => {
      if (c.hatStyle) set.add(c.hatStyle);
    });
    return set;
  }, [myPurchasedClothing]);

  const unlockedAccessories = useMemo(() => {
    const set = new Set<AvatarAccessoryStyle>(['none', 'headphones']);
    myPurchasedClothing.forEach((c) => {
      if (c.accessory) set.add(c.accessory);
    });
    return set;
  }, [myPurchasedClothing]);

  // Lọc quần áo theo danh mục
  const filteredClothing = useMemo(() => {
    if (clothingCat === 'all') return myPurchasedClothing;
    return myPurchasedClothing.filter((c) => c.avatarStyle === clothingCat);
  }, [myPurchasedClothing, clothingCat]);

  // Lọc phụ kiện theo danh mục
  const filteredAccessories = useMemo(() => {
    if (accessoryCat === 'all') return ACCESSORY_ITEMS_LIST;
    return ACCESSORY_ITEMS_LIST.filter((a) => a.category === accessoryCat);
  }, [accessoryCat]);

  // 2. Xe trong Gara: Phương tiện mặc định (đi bộ, ván trượt) và tất cả xe ĐÃ MUA
  const myPurchasedVehicles = useMemo(() => {
    const defaultList: Array<{
      id: string;
      category: 'starter' | 'bike' | 'sport' | 'suv';
      vehicleType: WorldVehicleType;
      label: string;
      speed: string;
      icon: string;
      brand: string;
      vehicleColor?: string;
    }> = [
      {
        id: 'WALK_DEFAULT',
        category: 'starter',
        vehicleType: 'none',
        label: 'Đi Bộ Dạo Phố',
        speed: '7.5 m/s',
        icon: '🚶',
        brand: 'Đi bộ tự do',
      },
      {
        id: 'VEHICLE_SKATEBOARD',
        category: 'starter',
        vehicleType: 'skateboard',
        label: 'Ván Trượt Thể Thao Skateboard',
        speed: '14.5 m/s',
        icon: '🛹',
        brand: 'LifeAt Skate',
        vehicleColor: '#f59e0b',
      },
    ];

    const showroomPurchased = (CITY_SHOPS_DATA.CAR_SHOWROOM.products || [])
      .filter((car) => car.id !== 'VEHICLE_SKATEBOARD' && ownedSet.has(car.id))
      .map((car) => {
        let cat: 'starter' | 'bike' | 'sport' | 'suv' = 'sport';
        if (car.vehicleType === 'hoverboard' || car.vehicleType === 'skateboard') cat = 'starter';
        else if (car.vehicleType === 'vespa' || car.vehicleType === 'harley' || car.vehicleType === 'motorbike') cat = 'bike';
        else if (car.vehicleType === 'cybertruck' || car.vehicleType === 'gclass' || car.vehicleType === 'rollsroyce') cat = 'suv';
        else cat = 'sport';

        return {
          id: car.id,
          category: cat,
          vehicleType: car.vehicleType || 'sportscar',
          label: car.name,
          speed: `${car.speedBoost || 24.0} m/s`,
          icon: car.icon,
          brand: car.brand || 'Luxury Auto',
          vehicleColor: car.vehicleColor,
        };
      });

    return [...defaultList, ...showroomPurchased];
  }, [ownedSet]);

  const filteredVehicles = useMemo(() => {
    if (vehicleCat === 'all') return myPurchasedVehicles;
    return myPurchasedVehicles.filter((v) => v.category === vehicleCat);
  }, [myPurchasedVehicles, vehicleCat]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
          border: '2px solid #ec4899',
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
            👗 Tủ Đồ Thời Trang & Gara Xe Cá Nhân
          </Typography>
          <Typography variant="caption" sx={{ color: '#fbcfe8', fontWeight: 700 }}>
            Chỉ chứa những trang phục, phụ kiện và phương tiện bạn đã mua!
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 900,
              color: '#94a3b8',
              '&.Mui-selected': { color: '#f472b6' },
            },
          }}
        >
          <Tab value="fashion" label={`👕 Tủ Quần Áo (${myPurchasedClothing.length})`} />
          <Tab value="accessories" label="👑 Mũ & Phụ Kiện" />
          <Tab value="garage" label={`🏎️ Gara Phương Tiện (${myPurchasedVehicles.length})`} />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5, maxHeight: '72vh' }}>
        {/* ============================================================== */}
        {/* TAB 1: TỦ QUẦN ÁO (PHÂN LOẠI DANH MỤC - KHÔNG CÓ BẢNG PHỐI MÀU) */}
        {/* ============================================================== */}
        {tab === 'fashion' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Thanh Phân Loại Danh Mục Trang Phục */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {CLOTHING_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    clickable
                    onClick={() => setClothingCat(cat.id)}
                    sx={{
                      fontWeight: 800,
                      backgroundColor:
                        clothingCat === cat.id ? '#ec4899' : 'rgba(255,255,255,0.08)',
                      color: clothingCat === cat.id ? '#ffffff' : '#cbd5e1',
                      border: clothingCat === cat.id ? '1px solid #fbcfe8' : '1px solid transparent',
                    }}
                  />
                ))}
              </Box>

              {onOpenShop && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    onClose();
                    onOpenShop('CLOTHING');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    borderRadius: 2,
                    borderColor: '#ec4899',
                    color: '#fbcfe8',
                  }}
                >
                  🛍️ Sắm Thêm Quần Áo Tại Shop
                </Button>
              )}
            </Box>

            {/* Danh Sách Các Bộ Đồ Đã Mua Thuộc Danh Mục */}
            {filteredClothing.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                }}
              >
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>👗</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#fbcfe8' }}>
                  Chưa có trang phục nào thuộc phân loại này trong tủ đồ của bạn!
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                  Ghé Shop Thời Trang Royal Fashion Boutique để mua thêm nhiều mẫu đẹp nhé.
                </Typography>
                {onOpenShop && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      onClose();
                      onOpenShop('CLOTHING');
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    }}
                  >
                    🛍️ Đến Cửa Hàng Thời Trang Ngay
                  </Button>
                )}
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {filteredClothing.map((cloth) => {
                  const isCurrentFullSet =
                    state.avatarStyle === cloth.avatarStyle &&
                    state.outfitColor === cloth.outfitColor;
                  return (
                    <Paper
                      key={cloth.id}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: isCurrentFullSet
                          ? 'rgba(236, 72, 153, 0.24)'
                          : 'rgba(15, 23, 42, 0.72)',
                        border: isCurrentFullSet
                          ? '2px solid #ec4899'
                          : '1px solid rgba(255,255,255,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#ec4899',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '2.4rem' }}>{cloth.icon}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ffffff' }}>
                              {cloth.name}
                            </Typography>
                            {cloth.brand && (
                              <Chip
                                size="small"
                                label={cloth.brand}
                                sx={{
                                  height: 18,
                                  fontSize: '0.64rem',
                                  fontWeight: 900,
                                  backgroundColor: 'rgba(236, 72, 153, 0.18)',
                                  color: '#fbcfe8',
                                  border: '1px solid rgba(236, 72, 153, 0.4)',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700, display: 'block', mt: 0.3 }}>
                            {cloth.englishName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                            {cloth.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <Button
                          size="small"
                          variant={isCurrentFullSet ? 'contained' : 'outlined'}
                          onClick={() => {
                            onChange({
                              ...(cloth.outfitColor ? { outfitColor: cloth.outfitColor } : {}),
                              ...(cloth.hatColor ? { hatColor: cloth.hatColor } : {}),
                              ...(cloth.pantsColor ? { pantsColor: cloth.pantsColor } : {}),
                              ...(cloth.shoeColor ? { shoeColor: cloth.shoeColor } : {}),
                              ...(cloth.avatarStyle ? { avatarStyle: cloth.avatarStyle } : {}),
                              ...(cloth.hatStyle ? { hatStyle: cloth.hatStyle } : {}),
                              ...(cloth.accessory ? { accessory: cloth.accessory } : {}),
                            });
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 900,
                            fontSize: '0.76rem',
                            borderRadius: 2,
                            px: 2.5,
                            backgroundColor: isCurrentFullSet ? '#ec4899' : 'transparent',
                            color: '#ffffff',
                            borderColor: '#ec4899',
                          }}
                        >
                          {isCurrentFullSet ? '✅ Đang mặc' : '👕 Mặc Bộ Này'}
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MŨ & PHỤ KIỆN (PHÂN LOẠI DANH MỤC - KHÔNG CÓ BẢNG PHỐI MÀU) */}
        {/* ============================================================== */}
        {tab === 'accessories' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Thanh Phân Loại Danh Mục Phụ Kiện */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ACCESSORY_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  clickable
                  onClick={() => setAccessoryCat(cat.id)}
                  sx={{
                    fontWeight: 800,
                    backgroundColor:
                      accessoryCat === cat.id ? '#a855f7' : 'rgba(255,255,255,0.08)',
                    color: accessoryCat === cat.id ? '#ffffff' : '#cbd5e1',
                    border: accessoryCat === cat.id ? '1px solid #d8b4fe' : '1px solid transparent',
                  }}
                />
              ))}
            </Box>

            {/* Danh Sách Mũ & Phụ Kiện */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {filteredAccessories.map((item) => {
                const isHat = item.category === 'hat';
                const isUnlocked = isHat
                  ? item.defaultUnlocked || (item.hatStyle && unlockedHatStyles.has(item.hatStyle))
                  : item.defaultUnlocked || (item.accessory && unlockedAccessories.has(item.accessory));

                const isEquipped = isHat
                  ? state.hatStyle === item.hatStyle
                  : state.accessory === item.accessory;

                return (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: isEquipped
                        ? 'rgba(168, 85, 247, 0.25)'
                        : 'rgba(15, 23, 42, 0.72)',
                      border: isEquipped
                        ? '2px solid #a855f7'
                        : '1px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isUnlocked ? 1 : 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Typography sx={{ fontSize: '2rem' }}>{item.icon}</Typography>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffffff' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isUnlocked ? '#c084fc' : '#f87171', fontWeight: 700 }}>
                          {isUnlocked ? 'Đã sở hữu' : '🔒 Cần mua trang phục tương ứng'}
                        </Typography>
                      </Box>
                    </Box>

                    {isUnlocked ? (
                      <Button
                        size="small"
                        variant={isEquipped ? 'contained' : 'outlined'}
                        onClick={() => {
                          if (isHat && item.hatStyle !== undefined) {
                            onChange({ hatStyle: item.hatStyle });
                          } else if (!isHat && item.accessory !== undefined) {
                            onChange({ accessory: item.accessory });
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          borderRadius: 2,
                          backgroundColor: isEquipped ? '#a855f7' : 'transparent',
                          color: '#ffffff',
                          borderColor: '#a855f7',
                        }}
                      >
                        {isEquipped ? '✅ Đang dùng' : 'Trang bị'}
                      </Button>
                    ) : (
                      <Chip size="small" label="Chưa có" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} />
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GARA PHƯƠNG TIỆN (PHÂN LOẠI DANH MỤC - KHÔNG ĐỘ MÀU SƠN) */}
        {/* ============================================================== */}
        {tab === 'garage' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Thanh Phân Loại Danh Mục Xe */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {VEHICLE_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    clickable
                    onClick={() => setVehicleCat(cat.id)}
                    sx={{
                      fontWeight: 800,
                      backgroundColor:
                        vehicleCat === cat.id ? '#0284c7' : 'rgba(255,255,255,0.08)',
                      color: vehicleCat === cat.id ? '#ffffff' : '#cbd5e1',
                      border: vehicleCat === cat.id ? '1px solid #7dd3fc' : '1px solid transparent',
                    }}
                  />
                ))}
              </Box>

              {onOpenShop && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    onClose();
                    onOpenShop('CAR_SHOWROOM');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#ffffff',
                  }}
                >
                  🏎️ Showroom Siêu Xe
                </Button>
              )}
            </Box>

            {/* Danh Sách Phương Tiện Đã Mua Thuộc Danh Mục */}
            {filteredVehicles.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                }}
              >
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🏎️</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#7dd3fc' }}>
                  Chưa có xe nào thuộc phân loại này trong gara của bạn!
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                  Ghé Kaia Luxury Auto Showroom để tậu thêm các dòng xe khủng nhé.
                </Typography>
                {onOpenShop && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      onClose();
                      onOpenShop('CAR_SHOWROOM');
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    }}
                  >
                    🏎️ Đến Showroom Mua Xe
                  </Button>
                )}
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {filteredVehicles.map((v) => {
                  const active = state.activeVehicle === v.vehicleType;
                  return (
                    <Paper
                      key={v.id}
                      onClick={() => {
                        onChange({
                          activeVehicle: v.vehicleType,
                          ...(v.vehicleColor ? { vehicleColor: v.vehicleColor } : {}),
                        });
                      }}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: active
                          ? 'rgba(2, 132, 199, 0.32)'
                          : 'rgba(15, 23, 42, 0.72)',
                        border: active
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255,255,255,0.12)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#38bdf8',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontSize: '2.2rem' }}>{v.icon}</Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#ffffff' }}>
                            {v.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#7dd3fc', fontWeight: 700, display: 'block', mt: 0.3 }}>
                            {v.brand} • ⚡ {v.speed}
                          </Typography>
                        </Box>
                      </Box>
                      {active ? (
                        <Chip
                          size="small"
                          label="✅ Đang Lái"
                          sx={{
                            fontWeight: 900,
                            backgroundColor: '#38bdf8',
                            color: '#0f172a',
                          }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: 1.5,
                            borderColor: 'rgba(255,255,255,0.25)',
                            color: '#cbd5e1',
                          }}
                        >
                          Lái xe này
                        </Button>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => {
            if (myPurchasedClothing.length > 0) {
              const randCloth =
                myPurchasedClothing[Math.floor(Math.random() * myPurchasedClothing.length)];
              onChange({
                avatarStyle: randCloth.avatarStyle || 'streetwear',
                outfitColor: randCloth.outfitColor || '#38bdf8',
                hatColor: randCloth.hatColor || '#f59e0b',
                pantsColor: randCloth.pantsColor || '#1e293b',
                shoeColor: cloth_shoeColor(randCloth),
                hatStyle: randCloth.hatStyle || 'snapback',
                accessory: randCloth.accessory || 'headphones',
              });
            }
          }}
          sx={{
            borderRadius: 2.5,
            fontWeight: 900,
            textTransform: 'none',
            borderColor: '#f472b6',
            color: '#fbcfe8',
          }}
        >
          🎲 Mặc Ngẫu Nhiên (Theo đồ đã mua)
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2.5,
            px: 3.5,
            fontWeight: 900,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#ffffff',
          }}
        >
          ✨ Hoàn Tất & Dạo Phố Ngay!
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function cloth_shoeColor(cloth: any): string {
  return cloth.shoeColor || '#ffffff';
}

