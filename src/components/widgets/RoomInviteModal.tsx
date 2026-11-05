'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface RoomInviteModalProps {
  open: boolean;
  onClose: () => void;
  roomHost: string;
  roomCode: string;
}

interface UserSuggestion {
  id: string;
  tenDangNhap: string;
  taiKhoan: string;
  roomId: string;
}

export default function RoomInviteModal({
  open,
  onClose,
  roomHost,
  roomCode,
}: RoomInviteModalProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Tab 1: Mời bằng tên
  const [inviteName, setInviteName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Gợi ý người dùng khi gõ tên
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Tab 2: Dán link vào phòng
  const [joinInput, setJoinInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Trạng thái copy
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Link phòng hoàn chỉnh
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentRoomUrl =
    typeof window !== 'undefined'
      ? `${currentOrigin}/room/${user?.id || roomCode}?space=${roomCode}&host=${encodeURIComponent(roomHost)}`
      : '';

  // Debounce tìm kiếm người dùng khi gõ tên
  useEffect(() => {
    if (!inviteName.trim() || inviteName.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/room/search-user?q=${encodeURIComponent(inviteName.trim())}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data && data.users) {
          setSuggestions(data.users);
        }
      } catch {
        // Bỏ qua lỗi tìm kiếm
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [inviteName, token]);

  // Xử lý gửi lời mời trực tiếp bằng tên
  const handleSendInvite = async (targetName?: string) => {
    const recipient = targetName || inviteName;
    if (!recipient.trim()) return;

    if (!user || !token) {
      setInviteStatus({
        type: 'error',
        message: 'Vui lòng đăng nhập để gửi lời mời bạn bè.',
      });
      return;
    }

    setIsSending(true);
    setInviteStatus(null);

    try {
      const res = await fetch('/api/room/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientName: recipient.trim(),
          senderRoomId: roomCode,
          senderRoomName: roomHost,
          roomUrl: currentRoomUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteStatus({
          type: 'error',
          message: data.message || 'Không thể gửi lời mời.',
        });
      } else {
        setInviteStatus({
          type: 'success',
          message: data.message || `Đã gửi lời mời thành công tới "${recipient}"!`,
        });
        setInviteName('');
        setSuggestions([]);
      }
    } catch {
      setInviteStatus({
        type: 'error',
        message: 'Lỗi kết nối khi gửi lời mời.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Xử lý dán link hoặc nhập mã để vào phòng
  const handleJoinByLink = async () => {
    if (!joinInput.trim()) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/room/resolve?target=${encodeURIComponent(joinInput.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.roomUrl) {
        setJoinError(data.message || 'Link hoặc mã phòng không hợp lệ.');
      } else {
        onClose();
        router.push(data.roomUrl);
      }
    } catch {
      setJoinError('Lỗi kiểm tra link phòng. Vui lòng thử lại.');
    } finally {
      setIsJoining(false);
    }
  };

  // Sao chép link phòng
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentRoomUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Sao chép mã phòng
  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <MeetingRoomRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              Phòng học & Lời mời
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Mời bạn bè cùng học hoặc dán link chuyển phòng
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ px: 3, pt: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'none',
              color: '#94a3b8',
              '&.Mui-selected': { color: '#818cf8' },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#818cf8',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<PersonAddAlt1RoundedIcon sx={{ fontSize: '1.1rem !important' }} />}
            iconPosition="start"
            label="Mời bạn bè vào phòng"
          />
          <Tab
            icon={<LinkRoundedIcon sx={{ fontSize: '1.1rem !important' }} />}
            iconPosition="start"
            label="Dán link vào phòng khác"
          />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {/* TAB 0: MỜI BẠN BÈ */}
        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Mục 1: Mời trực tiếp bằng Tên */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>1. Mời trực tiếp bằng tên</span>
                <Chip size="small" label="Thông báo tức thì" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }} />
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                Người được mời sẽ nhận được thông báo kèm nút xác nhận chấp nhận vào phòng.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập tên đăng nhập (VD: Hải Đăng, TruongGiang...)"
                  value={inviteName}
                  onChange={(e) => {
                    setInviteName(e.target.value);
                    setInviteStatus(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendInvite();
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {isSearching ? (
                          <CircularProgress size={16} sx={{ color: '#818cf8' }} />
                        ) : (
                          <SearchRoundedIcon sx={{ fontSize: 18, color: '#64748b' }} />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 2.5,
                      color: '#fff',
                      fontSize: '0.85rem',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#818cf8' },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  onClick={() => handleSendInvite()}
                  disabled={isSending || !inviteName.trim()}
                  startIcon={isSending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 2.5,
                    px: 2.5,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: '#6366f1',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#4f46e5' },
                  }}
                >
                  Gửi lời mời
                </Button>
              </Box>

              {/* Gợi ý người dùng khi tìm kiếm */}
              {suggestions.length > 0 && (
                <Paper
                  sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#94a3b8', px: 1, py: 0.5, fontWeight: 700, fontSize: '0.68rem' }}>
                    GỢI Ý TÀI KHOẢN:
                  </Typography>
                  {suggestions.map((sug) => (
                    <Box
                      key={sug.id}
                      onClick={() => handleSendInvite(sug.tenDangNhap)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 0.8,
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.72rem', backgroundColor: '#818cf8' }}>
                          {sug.tenDangNhap.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.82rem' }}>
                            {sug.tenDangNhap}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                            @{sug.taiKhoan}
                          </Typography>
                        </Box>
                      </Box>
                      <Button size="small" sx={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700 }}>
                        Mời ngay
                      </Button>
                    </Box>
                  ))}
                </Paper>
              )}

              {/* Thông báo kết quả gửi lời mời */}
              {inviteStatus && (
                <Alert
                  severity={inviteStatus.type}
                  sx={{
                    mt: 1.5,
                    borderRadius: 2.5,
                    fontSize: '0.8rem',
                    backgroundColor: inviteStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: inviteStatus.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: inviteStatus.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  }}
                >
                  {inviteStatus.message}
                </Alert>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Mục 2: Chia sẻ link hoặc mã phòng */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                2. Chia sẻ liên kết & Mã phòng
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                Bất kỳ ai có liên kết hoặc mã phòng đều có thể tham gia cùng bạn.
              </Typography>

              {/* Link phòng */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Liên kết phòng trực tiếp:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={currentRoomUrl}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 2.5,
                        color: '#93c5fd',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                      },
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCopyLink}
                    startIcon={copiedLink ? <CheckRoundedIcon sx={{ color: '#10b981' }} /> : <ContentCopyRoundedIcon />}
                    sx={{
                      borderRadius: 2.5,
                      px: 2,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      borderColor: copiedLink ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                      color: copiedLink ? '#10b981' : '#fff',
                      backgroundColor: copiedLink ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    }}
                  >
                    {copiedLink ? 'Đã sao chép' : 'Sao chép link'}
                  </Button>
                </Box>
              </Box>

              {/* Mã phòng ngắn */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                    MÃ PHÒNG (ROOM CODE)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: 1.2 }}>
                    {roomCode}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleCopyCode}
                  startIcon={copiedCode ? <CheckRoundedIcon sx={{ color: '#10b981' }} /> : <ContentCopyRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    fontWeight: 700,
                    backgroundColor: copiedCode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: copiedCode ? '#34d399' : '#fff',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 1: DÁN LINK HOẶC NHẬP MÃ VÀO PHÒNG */}
        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                Dán link hoặc mã phòng để tham gia
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                Nhập link phòng được bạn bè gửi (hoặc chỉ cần gõ mã phòng như M7KQ-AQ07) để chuyển ngay đến phòng đó.
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Dán link phòng (https://.../room/...) hoặc nhập mã phòng (VD: M7KQ-AQ07)"
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  setJoinError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleJoinByLink();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 2.5,
                    color: '#fff',
                    fontSize: '0.85rem',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#818cf8' },
                  },
                }}
              />

              {joinError && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 1.5,
                    borderRadius: 2.5,
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                  }}
                >
                  {joinError}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleJoinByLink}
                disabled={isJoining || !joinInput.trim()}
                startIcon={isJoining ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <MeetingRoomRoundedIcon />}
                sx={{
                  mt: 2,
                  py: 1.2,
                  borderRadius: 2.5,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  backgroundColor: '#818cf8',
                  color: '#090a0f',
                  boxShadow: '0 4px 14px rgba(129, 140, 248, 0.4)',
                  '&:hover': { backgroundColor: '#6366f1', color: '#fff' },
                }}
              >
                Vào phòng ngay 🚀
              </Button>
            </Box>

            {/* Mẹo sử dụng */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, display: 'block', mb: 0.5 }}>
                💡 HỖ TRỢ ĐA DẠNG ĐỊNH DẠNG:
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.6 }}>
                • Link đầy đủ: <code>http://localhost:3000/room/67c6...?space=M7KQ-AQ07</code><br />
                • Đường dẫn rút gọn: <code>/room/M7KQ-AQ07</code><br />
                • Chỉ mã phòng: <code>M7KQ-AQ07</code>
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
