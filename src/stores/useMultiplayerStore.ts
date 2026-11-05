'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface RemotePlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  avatarColor: string;
  currentChat?: string;
  chatTime?: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatarColor?: string;
  text: string;
  timestamp: number;
}

export interface MultiplayerState {
  socket: Socket | null;
  isConnected: boolean;
  myId: string | null;
  remotePlayers: Map<string, RemotePlayerData>;
  chatMessages: ChatMessage[];

  // Actions
  connect: (username?: string, avatarColor?: string) => void;
  disconnect: () => void;
  sendPosition: (x: number, y: number, z: number, rotationY: number) => void;
  sendMessage: (text: string) => void;
}

// Biến lưu mốc thời gian để throttle gói tin vị trí lên server (50ms ~ 20Hz)
let lastSendTime = 0;
const THROTTLE_MS = 50;

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  socket: null,
  isConnected: false,
  myId: null,
  remotePlayers: new Map(),
  chatMessages: [
    {
      id: 'system-welcome',
      username: 'System',
      avatarColor: '#38bdf8',
      text: 'Welcome to the English-speaking World! Practice English with other players in real-time.',
      timestamp: Date.now(),
    },
  ],

  connect: (username = 'Student', avatarColor = '#38bdf8') => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      return;
    }

    // Kết nối đến Socket.io server
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Multiplayer] Đã kết nối Socket.io với ID:', socket.id);
      set({ socket, isConnected: true, myId: socket.id });

      // Đăng ký thông tin người chơi
      socket.emit('playerJoin', {
        username,
        avatarColor,
        x: 0,
        y: 1.0,
        z: 0,
      });
    });

    // Nhận gói tin đồng bộ thế giới 20Hz (worldUpdate)
    socket.on('worldUpdate', (allPlayers: RemotePlayerData[]) => {
      const currentMyId = get().myId || socket.id;
      const newMap = new Map<string, RemotePlayerData>();

      for (const p of allPlayers) {
        // Không lưu chính mình vào danh sách remote players
        if (p.id !== currentMyId) {
          newMap.set(p.id, p);
        }
      }

      set({ remotePlayers: newMap });
    });

    // Nhận tin nhắn chat từ bất kỳ người chơi nào
    socket.on('chatMessage', (msg: ChatMessage) => {
      set((state) => ({
        chatMessages: [...state.chatMessages.slice(-49), msg], // Giữ 50 tin nhắn gần nhất
      }));

      // Cập nhật bong bóng chat cho remote player nếu có
      const remotes = new Map(get().remotePlayers);
      const target = remotes.get(msg.id);
      if (target) {
        target.currentChat = msg.text;
        target.chatTime = msg.timestamp;
        remotes.set(msg.id, target);
        set({ remotePlayers: remotes });
      }
    });

    // Khi người chơi khác rời đi
    socket.on('playerLeft', (leftId: string) => {
      set((state) => {
        const updated = new Map(state.remotePlayers);
        updated.delete(leftId);
        return { remotePlayers: updated };
      });
    });

    socket.on('disconnect', () => {
      console.log('[Multiplayer] Đã ngắt kết nối Socket.io');
      set({ isConnected: false, myId: null });
    });
  },

  disconnect: () => {
    const s = get().socket;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
      set({ socket: null, isConnected: false, myId: null, remotePlayers: new Map() });
    }
  },

  // Gửi vị trí tọa độ với cơ chế Throttle 50ms chống tràn băng thông
  sendPosition: (x: number, y: number, z: number, rotationY: number) => {
    const now = performance.now();
    if (now - lastSendTime < THROTTLE_MS) {
      return;
    }
    lastSendTime = now;

    const s = get().socket;
    if (s && s.connected) {
      s.emit('playerMove', { x, y, z, rotationY });
    }
  },

  // Gửi tin nhắn chat
  sendMessage: (text: string) => {
    const s = get().socket;
    if (s && s.connected && text.trim().length > 0) {
      s.emit('sendChat', { text: text.trim() });
    }
  },
}));

export default useMultiplayerStore;

