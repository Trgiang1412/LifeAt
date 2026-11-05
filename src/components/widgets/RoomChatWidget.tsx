'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Chip,
  Paper,
  Tabs,
  Tab,
  Button,
  Badge,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import { RoomParticipant, ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60',
];

interface RoomChatWidgetProps {
  onClose: () => void;
  hostName: string;
  roomCode: string;
  isHost?: boolean;
  onLeaveRoom?: () => void;
  participantsList?: any[];
}

export default function RoomChatWidget({
  onClose,
  hostName,
  roomCode,
  isHost = true,
  onLeaveRoom,
  participantsList,
}: RoomChatWidgetProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
  const [myMic, setMyMic] = useState(false);
  const [myCam, setMyCam] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputMsg, setInputMsg] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Danh sách thành viên hiển thị chính xác theo số người thực tế trong phòng
  const participants = React.useMemo<RoomParticipant[]>(() => {
    // 1. Khi có danh sách đồng bộ từ server
    if (participantsList && participantsList.length > 0) {
      return participantsList.map((p, idx) => {
        const isCurrentAuthUser =
          (user?.id && p.userId === user.id) ||
          (user?.tenDangNhap && p.name === user.tenDangNhap) ||
          (isHost && p.isHost);

        let displayName = p.name;
        if (!displayName) {
          displayName = p.isHost ? (hostName || 'Chủ phòng') : `Thành viên ${idx + 1}`;
        }
        if (isCurrentAuthUser && !displayName.includes('(You)')) {
          displayName = `${displayName} (You)`;
        }

        return {
          id: p.userId || `p-${idx}`,
          name: displayName,
          avatar: p.avatar || AVATAR_POOL[idx % AVATAR_POOL.length],
          status: 'Focusing',
          isHost: Boolean(p.isHost),
          micOn: isCurrentAuthUser ? myMic : false,
          camOn: isCurrentAuthUser ? myCam : false,
        };
      });
    }

    // 2. Fallback: Nếu là chủ phòng ở 1 mình thì chỉ hiển thị đúng 1 mình chủ phòng
    if (isHost) {
      const currentHostDisplayName = user?.tenDangNhap || hostName?.replace("'s Room", "") || 'Chủ phòng';
      return [
        {
          id: user?.id || 'host',
          name: `${currentHostDisplayName} (You)`,
          avatar: AVATAR_POOL[0],
          status: 'Focusing',
          isHost: true,
          micOn: myMic,
          camOn: myCam,
        },
      ];
    } else {
      // Khách ghé thăm phòng
      const hostDisplayName = hostName || 'Chủ phòng';
      const myDisplayName = user?.tenDangNhap ? `${user.tenDangNhap} (You)` : 'Bạn (You)';
      return [
        {
          id: 'host',
          name: hostDisplayName,
          avatar: AVATAR_POOL[0],
          status: 'Focusing',
          isHost: true,
          micOn: false,
          camOn: false,
        },
        {
          id: user?.id || 'me',
          name: myDisplayName,
          avatar: AVATAR_POOL[1],
          status: 'Focusing',
          isHost: false,
          micOn: myMic,
          camOn: myCam,
        },
      ];
    }
  }, [participantsList, user, hostName, isHost, myMic, myCam]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Đồng bộ tin nhắn liên tục từ Database (Live Sync Polling)
  const syncChatFromDb = React.useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/room/chat?roomCode=${encodeURIComponent(roomCode)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.messages && Array.isArray(data.messages)) {
        setMessages((prev) => {
          if (prev.length === 0) {
            if (data.messages.length > 0) return data.messages;
            return [
              {
                id: 'welcome-1',
                senderId: 'host',
                senderName: hostName || 'Trường',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
                text: 'Chào mọi người! Cùng hoàn thành các pomodoros hôm nay nhé 🚀',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ];
          }

          // Kiểm tra và gộp tin nhắn mới từ người khác
          const existingIds = new Set(prev.map((m: any) => m.clientMsgId || m.id));
          const newMsgs = data.messages.filter(
            (m: any) => !existingIds.has(m.clientMsgId || m.id) && !existingIds.has(m.id)
          );

          if (newMsgs.length === 0) return prev;

          setTimeout(scrollToBottom, 60);
          return [...prev, ...newMsgs];
        });
      }
    } catch {
      // Bỏ qua lỗi mạng nền
    }
  }, [roomCode, hostName]);

  // Polling chu kỳ 1.2s đảm bảo tin nhắn luôn luôn nhảy realtime ngay cả khi Socket ngắt kết nối
  useEffect(() => {
    if (!roomCode) return;

    syncChatFromDb();
    const interval = setInterval(syncChatFromDb, 1200);

    return () => clearInterval(interval);
  }, [roomCode, syncChatFromDb]);

  // 2. Kết nối Socket.io để nhận và broadcast tin nhắn tức thì (sub-50ms)
  useEffect(() => {
    if (!roomCode) return;

    let socket: Socket | null = null;
    try {
      socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket?.emit('joinRoom', { roomCode });
      });

      if (socket.connected) {
        socket.emit('joinRoom', { roomCode });
      }

      const handleIncomingMessage = (msg: any) => {
        if (!msg) return;
        if (msg.roomCode && msg.roomCode !== roomCode) return;

        setMessages((prev) => {
          const matchId = msg.clientMsgId || msg.id;
          if (prev.some((m: any) => (m.clientMsgId && m.clientMsgId === matchId) || m.id === matchId)) {
            return prev;
          }
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      };

      socket.on('roomChatMessage', handleIncomingMessage);
      socket.on(`roomChatMessage_${roomCode}`, handleIncomingMessage);
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    return () => {
      if (socket) {
        socket.off('roomChatMessage');
        socket.off(`roomChatMessage_${roomCode}`);
        socket.disconnect();
      }
    };
  }, [roomCode]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages.length, activeTab]);

  // Gửi tin nhắn chat
  const sendMessage = async () => {
    if (!inputMsg.trim() || !roomCode) return;
    const textToSend = inputMsg.trim();
    setInputMsg('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mySenderId = user?.id || 'me';
    const mySenderName = user?.tenDangNhap || 'Bạn';
    const myAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';
    const msgId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: mySenderId,
      senderName: mySenderName,
      avatar: myAvatar,
      text: textToSend,
      timestamp: timeStr,
    };

    // Cập nhật ngay tức thì trên giao diện
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(scrollToBottom, 50);

    // Phát sóng real-time qua Socket.io
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendRoomChat', {
        id: msgId,
        clientMsgId: msgId,
        roomCode,
        senderId: mySenderId,
        senderName: mySenderName,
        avatar: myAvatar,
        text: textToSend,
        timestamp: timeStr,
      });
    }

    // Lưu vào database
    try {
      await fetch('/api/room/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientMsgId: msgId,
          roomCode,
          senderId: mySenderId,
          senderName: mySenderName,
          avatar: myAvatar,
          text: textToSend,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi lưu tin nhắn:', err);
    }
  };

  // Gửi biểu tượng cảm xúc nhanh
  const sendReaction = async (emoji: string) => {
    if (!roomCode) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mySenderId = user?.id || 'me';
    const mySenderName = user?.tenDangNhap || 'Bạn';
    const myAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';
    const msgId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: mySenderId,
      senderName: mySenderName,
      avatar: myAvatar,
      text: emoji,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTimeout(scrollToBottom, 50);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendRoomChat', {
        id: msgId,
        clientMsgId: msgId,
        roomCode,
        senderId: mySenderId,
        senderName: mySenderName,
        avatar: myAvatar,
        text: emoji,
        timestamp: timeStr,
      });
    }

    try {
      await fetch('/api/room/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientMsgId: msgId,
          roomCode,
          senderId: mySenderId,
          senderName: mySenderName,
          avatar: myAvatar,
          text: emoji,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi gửi reaction:', err);
    }
  };

  const copyRoomCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(roomCode || 'M7KQ-ILKC');
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        width: 360,
        height: 520,
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
          <GroupRoundedIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#e2e8f0' }}>
            STUDY ROOM
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Room Code Banner - Bỏ nút mời bạn, chỉ hiển thị mã & icon copy */}
      <Box
        sx={{
          mx: 2,
          mb: 1.5,
          p: 1.2,
          borderRadius: 2.5,
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#67e8f9', display: 'block', fontSize: '0.68rem' }}>
            MÃ PHÒNG (SPACE CODE)
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
            {roomCode || 'M7KQ-ILKC'}
          </Typography>
        </Box>
        <Tooltip title={copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã phòng'}>
          <IconButton
            size="small"
            onClick={copyRoomCode}
            sx={{
              color: copiedCode ? '#34d399' : '#67e8f9',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 2,
              p: 0.8,
              '&:hover': { backgroundColor: 'rgba(6, 182, 212, 0.3)' },
            }}
          >
            {copiedCode ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          '& .MuiTab-root': {
            minHeight: 38,
            py: 0.5,
            fontSize: '0.78rem',
            color: '#94a3b8',
            '&.Mui-selected': { color: '#06b6d4', fontWeight: 700 },
          },
          '& .MuiTabs-indicator': { backgroundColor: '#06b6d4' },
        }}
      >
        <Tab label={`Thành viên (${participants.length})`} value="members" />
        <Tab label="Trò chuyện" value="chat" />
      </Tabs>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {participants.map((userItem) => (
            <Box
              key={userItem.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                borderRadius: 2.5,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: userItem.status === 'Focusing' ? '#10b981' : '#f59e0b',
                      color: userItem.status === 'Focusing' ? '#10b981' : '#f59e0b',
                    },
                  }}
                >
                  <Avatar src={userItem.avatar} sx={{ width: 34, height: 34 }} />
                </Badge>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                      {userItem.name}
                    </Typography>
                    {userItem.isHost && (
                      <Chip
                        label="Host"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.62rem',
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    {userItem.status === 'Focusing' ? '🎯 Đang tập trung' : '☕ Đang nghỉ ngơi'}
                  </Typography>
                </Box>
              </Box>

              {/* Nếu là bản thân người dùng -> Cho phép điều khiển Mic & Camera */}
              {(() => {
                const isSelf =
                  userItem.id === 'me' ||
                  userItem.id === user?.id ||
                  userItem.name.includes('(You)');

                return isSelf ? (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setMyMic(!myMic)}
                      sx={{ color: myMic ? '#10b981' : '#64748b', p: 0.6 }}
                    >
                      {myMic ? <MicRoundedIcon fontSize="small" /> : <MicOffRoundedIcon fontSize="small" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setMyCam(!myCam)}
                      sx={{ color: myCam ? '#10b981' : '#64748b', p: 0.6 }}
                    >
                      {myCam ? <VideocamRoundedIcon fontSize="small" /> : <VideocamOffRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5, color: '#64748b' }}>
                    {userItem.micOn ? <MicRoundedIcon sx={{ fontSize: 18, color: '#10b981' }} /> : <MicOffRoundedIcon sx={{ fontSize: 18 }} />}
                    {userItem.camOn ? <VideocamRoundedIcon sx={{ fontSize: 18, color: '#10b981' }} /> : <VideocamOffRoundedIcon sx={{ fontSize: 18 }} />}
                  </Box>
                );
              })()}
            </Box>
          ))}

          {/* Nút rời phòng nếu là khách */}
          {!isHost && onLeaveRoom && (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={onLeaveRoom}
              startIcon={<ExitToAppRoundedIcon />}
              sx={{
                mt: 1,
                py: 0.8,
                borderRadius: 2.5,
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                '&:hover': {
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                },
              }}
            >
              🚪 Rời phòng học
            </Button>
          )}
        </Box>
      )}

      {/* Chat Tab - Dùng Socket.io Realtime */}
      {activeTab === 'chat' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Reaction Emojis */}
          <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            {['🔥', '☕', '👏', '💡', '🚀', '💯'].map((emoji) => (
              <Chip
                key={emoji}
                label={emoji}
                size="small"
                clickable
                onClick={() => sendReaction(emoji)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  fontSize: '0.85rem',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                }}
              />
            ))}
          </Box>

          {/* Messages list */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {messages.map((msg) => {
              const isMe =
                msg.senderId === 'me' ||
                (user?.id && msg.senderId === user.id) ||
                (user?.tenDangNhap && msg.senderName === user.tenDangNhap);

              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    gap: 1.2,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  {!isMe && <Avatar src={msg.avatar} sx={{ width: 28, height: 28, mt: 0.5 }} />}
                  <Box>
                    {!isMe && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', mb: 0.2 }}>
                        {msg.senderName}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2.5,
                        backgroundColor: isMe ? 'rgba(6, 182, 212, 0.85)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', wordBreak: 'break-word' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.65rem',
                        display: 'block',
                        mt: 0.2,
                        textAlign: isMe ? 'right' : 'left',
                      }}
                    >
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input field */}
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Gửi lời động viên..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2.5,
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: '#06b6d4' },
                  '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                },
                '& input': { color: '#f8fafc', py: 0.8 },
              }}
            />
            <IconButton
              onClick={sendMessage}
              sx={{
                backgroundColor: 'rgba(6, 182, 212, 0.85)',
                color: '#fff',
                borderRadius: 2.5,
                '&:hover': { backgroundColor: '#0891b2' },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
