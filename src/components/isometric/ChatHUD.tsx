'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import useMultiplayerStore from '@/stores/useMultiplayerStore';

const QUICK_PHRASES = [
  'Hello everyone! 👋',
  'Nice to meet you! ✨',
  'How are you today? ☕',
  "Let's practice English! 🎯",
];

export default function ChatHUD() {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, remotePlayers, chatMessages, sendMessage } = useMultiplayerStore();

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ngăn phím W, A, S, D truyền xuống game controls khi đang gõ chữ
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isExpanded]);

  const onlineCount = (remotePlayers.size || 0) + (isConnected ? 1 : 0);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 84, // Phía trên thanh Scrubber hoặc ở góc trái
        left: 20,
        zIndex: 35,
        width: { xs: 'calc(100vw - 40px)', sm: 380 },
        pointerEvents: 'auto',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          borderRadius: 3.5,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Header HUD */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.2,
            borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            background: 'rgba(255, 255, 255, 0.03)',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.82rem' }}>
              English Live Chat
            </Typography>
            <Chip
              icon={<PeopleAltRoundedIcon sx={{ fontSize: '12px !important', color: isConnected ? '#34d399 !important' : '#94a3b8 !important' }} />}
              label={`${onlineCount} online`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                color: isConnected ? '#34d399' : '#94a3b8',
                border: isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
              }}
            />
          </Box>

          <IconButton size="small" sx={{ color: '#94a3b8' }}>
            {isExpanded ? <ExpandMoreRoundedIcon fontSize="small" /> : <ExpandLessRoundedIcon fontSize="small" />}
          </IconButton>
        </Box>

        {isExpanded && (
          <>
            {/* Vùng hiển thị tin nhắn chat (Scrollable) */}
            <Box
              sx={{
                maxHeight: 180,
                minHeight: 100,
                overflowY: 'auto',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                fontSize: '0.8rem',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 },
              }}
            >
              {chatMessages.map((msg, idx) => (
                <Box
                  key={`${msg.id}-${msg.timestamp}-${idx}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: '6px 10px',
                    borderRadius: 2,
                    backgroundColor: msg.username === 'System' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: msg.username === 'System' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        color: msg.avatarColor || (msg.username === 'System' ? '#38bdf8' : '#f59e0b'),
                      }}
                    >
                      {msg.username}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#64748b' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#f1f5f9', wordBreak: 'break-word' }}>
                    {msg.text}
                  </Typography>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Gợi ý mẫu câu tiếng Anh nhanh (Quick Phrases) */}
            <Box sx={{ display: 'flex', gap: 0.8, px: 1.5, pb: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
              {QUICK_PHRASES.map((phrase, i) => (
                <Chip
                  key={i}
                  label={phrase}
                  size="small"
                  onClick={() => sendMessage(phrase)}
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' },
                  }}
                />
              ))}
            </Box>

            {/* Ô nhập tin nhắn & nút Gửi */}
            <Box
              sx={{
                p: '6px 8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              <InputBase
                fullWidth
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tiếng Anh để trò chuyện... (Enter để gửi)"
                sx={{
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  px: 1,
                  py: 0.3,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <Tooltip title="Gửi tin nhắn">
                <IconButton
                  size="small"
                  onClick={handleSend}
                  sx={{
                    backgroundColor: '#38bdf8',
                    color: '#0f172a',
                    width: 30,
                    height: 30,
                    '&:hover': { backgroundColor: '#0284c7' },
                  }}
                >
                  <SendRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

