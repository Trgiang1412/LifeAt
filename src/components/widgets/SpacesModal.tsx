'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Chip,
  InputAdornment,
  Button,
  Alert,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import YouTubeIcon from '@mui/icons-material/YouTube';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import { SPACES_DATA } from '@/data/spaces';
import { Space } from '@/types';

interface SpacesModalProps {
  open: boolean;
  onClose: () => void;
  currentSpace: Space;
  onSelectSpace: (space: Space) => void;
  isHost?: boolean;
  hostName?: string;
}

export default function SpacesModal({
  open,
  onClose,
  currentSpace,
  onSelectSpace,
  isHost = true,
  hostName,
}: SpacesModalProps) {
  const [category, setCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customYtUrl, setCustomYtUrl] = useState<string>('');
  const [selectedType, setSelectedType] = useState<Space['category']>('Lofi');
  const [ytError, setYtError] = useState<string>('');
  const [dbSpaces, setDbSpaces] = useState<Space[]>([]);

  const categories = ['All', 'YouTube 4K', 'Lofi', 'Cafe', 'Nature', 'City', 'Library', 'Fantasy'];
  const musicCategories: Space['category'][] = ['Lofi', 'Cafe', 'Nature', 'City', 'Library', 'Fantasy'];

  const extractYouTubeId = (url: string): string | null => {
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  // Tải danh sách video đã lưu từ DB ListMusic khi mở modal
  useEffect(() => {
    if (!open) return;

    fetch('/api/music')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          const spacesFromDb: Space[] = data.data.map((item: any) => ({
            id: `db-${item.id}`,
            name: item.ten || `4K ${item.loai} Stream`,
            category: (item.loai as Space['category']) || 'Lofi',
            sourceType: 'youtube',
            youtubeId: item.youtubeId || extractYouTubeId(item.link) || '',
            is4K: true,
            thumbnailUrl: item.thumbnailUrl || (item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : ''),
            fallbackGradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            description: `Video ${item.loai} từ thư viện: ${item.link}`,
            recommendedSounds: ['lofi'],
          }));
          setDbSpaces(spacesFromDb);
        }
      })
      .catch(() => {});
  }, [open]);

  // Kết hợp danh sách từ DB (ưu tiên lên đầu) cùng danh sách mẫu mặc định
  const allSpaces = useMemo(() => {
    const existingYtIds = new Set(dbSpaces.map((s) => s.youtubeId).filter(Boolean));
    const filteredBuiltin = SPACES_DATA.filter((s) => !existingYtIds.has(s.youtubeId));
    return [...dbSpaces, ...filteredBuiltin];
  }, [dbSpaces]);

  const handleApplyCustomYouTube = async () => {
    setYtError('');
    if (!customYtUrl.trim()) return;
    const ytid = extractYouTubeId(customYtUrl);
    if (!ytid) {
      setYtError('Link YouTube không hợp lệ. Vui lòng dán link dạng https://www.youtube.com/watch?v=... hoặc mã video ID.');
      return;
    }

    const spaceName = `4K ${selectedType} Stream (${ytid.slice(0, 5)})`;
    const thumb = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;

    const newSpace: Space = {
      id: `custom-yt-${ytid}-${Date.now()}`,
      name: spaceName,
      category: selectedType,
      sourceType: 'youtube',
      youtubeId: ytid,
      is4K: true,
      thumbnailUrl: thumb,
      fallbackGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      description: `Video YouTube 4K [${selectedType}]: ${ytid}`,
      recommendedSounds: ['lofi'],
    };

    // 1. Thêm vào state để hiển thị ngay ở danh sách dưới
    setDbSpaces((prev) => [newSpace, ...prev]);

    // 2. Lưu vào DB Model ListMusic
    try {
      await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: typeof window !== 'undefined' && localStorage.getItem('lifeat_jwt_token')
            ? `Bearer ${localStorage.getItem('lifeat_jwt_token')}`
            : '',
        },
        body: JSON.stringify({
          link: customYtUrl.trim(),
          loai: selectedType,
          ten: spaceName,
          thumbnailUrl: thumb,
          youtubeId: ytid,
        }),
      });
    } catch {
      // Bỏ qua lỗi lưu DB, vẫn chiếu video
    }

    // 3. Chiếu video ngay lập tức
    onSelectSpace(newSpace);
    setCustomYtUrl('');
    onClose();
  };

  const filteredSpaces = allSpaces.filter((space) => {
    const matchesCategory =
      category === 'All'
        ? true
        : category === 'YouTube 4K'
        ? space.sourceType === 'youtube'
        : space.category.toLowerCase() === category.toLowerCase();

    const matchesSearch =
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#f8fafc',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <AutoAwesomeRoundedIcon sx={{ color: '#818cf8', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              CHỌN KHÔNG GIAN (SPACES) & 4K YOUTUBE
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* Sync Info if guest */}
        {!isHost && (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2.5,
              fontSize: '0.8rem',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#7dd3fc',
            }}
          >
            Bạn đang tham gia phòng học của <strong>{hostName || 'chủ phòng'}</strong>. Không gian và nhạc nền phòng học được điều khiển đồng bộ theo chủ phòng.
          </Alert>
        )}

        {/* Custom YouTube 4K Input Bar */}
        <Box
          sx={{
            p: 1.8,
            borderRadius: 3,
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <YouTubeIcon sx={{ color: '#ef4444', fontSize: 22 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              Dán bất kỳ link Video YouTube 4K để chiếu nền:
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ví dụ: https://www.youtube.com/watch?v=1ZYbU8csdVY hoặc ID video"
              value={customYtUrl}
              onChange={(e) => {
                setCustomYtUrl(e.target.value);
                setYtError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustomYouTube();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2.5,
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'rgba(239, 68, 68, 0.3)' },
                  '&:hover fieldset': { borderColor: '#ef4444' },
                  '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                },
                '& input': { color: '#f8fafc', py: 1 },
              }}
            />

            {/* Select Loại / Danh mục */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 125 } }}>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as Space['category'])}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2.5,
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  height: 40,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ef4444',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ef4444',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#ef4444',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'rgba(15, 23, 42, 0.96)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      borderRadius: 2.5,
                    },
                  },
                }}
              >
                {musicCategories.map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.82rem' }}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleApplyCustomYouTube}
              startIcon={<PlayCircleFilledWhiteRoundedIcon />}
              sx={{
                backgroundColor: '#ef4444',
                color: '#fff',
                px: 2.5,
                height: 40,
                borderRadius: 2.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: '#dc2626' },
              }}
            >
              Chiếu 4K
            </Button>
          </Box>
          {ytError && (
            <Alert severity="error" sx={{ py: 0.2, px: 1.5, fontSize: '0.78rem', borderRadius: 2 }}>
              {ytError}
            </Alert>
          )}
        </Box>

        {/* Search & Categories Bar */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Tìm kiếm không gian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 3,
                fontSize: '0.85rem',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                '&:hover fieldset': { borderColor: '#818cf8' },
                '&.Mui-focused fieldset': { borderColor: '#818cf8' },
              },
              '& input': { color: '#f8fafc' },
            }}
          />

          <Tabs
            value={category}
            onChange={(_, val) => setCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                py: 0.5,
                px: 1.5,
                fontSize: '0.8rem',
                textTransform: 'none',
                color: '#94a3b8',
                '&.Mui-selected': { color: '#818cf8', fontWeight: 700 },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#818cf8' },
            }}
          >
            {categories.map((cat) => (
              <Tab key={cat} label={cat} value={cat} />
            ))}
          </Tabs>
        </Box>

        {/* Spaces Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
            maxHeight: 440,
            overflowY: 'auto',
            p: 0.5,
          }}
        >
          {filteredSpaces.map((space) => {
            const isSelected = space.id === currentSpace.id || (space.youtubeId && space.youtubeId === currentSpace.youtubeId);
            return (
              <Card
                key={space.id}
                onClick={() => {
                  onSelectSpace(space);
                  onClose();
                }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(129, 140, 248, 0.6)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', height: 130 }}>
                  <CardMedia
                    component="img"
                    height="130"
                    image={space.thumbnailUrl}
                    alt={space.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 70%)',
                    }}
                  />
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: '#818cf8',
                        borderRadius: '50%',
                        p: 0.2,
                        display: 'flex',
                      }}
                    >
                      <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                  )}

                  {/* 4K & YouTube Badge */}
                  <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.6 }}>
                    {space.is4K && (
                      <Chip
                        label="4K UHD"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          height: 20,
                        }}
                      />
                    )}
                    {space.sourceType === 'youtube' && (
                      <Chip
                        icon={<YouTubeIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                        label="YouTube"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          fontSize: '0.62rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 0.5 }} noWrap>
                    {space.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: 32,
                    }}
                  >
                    {space.description}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
