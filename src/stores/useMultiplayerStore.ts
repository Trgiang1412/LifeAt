'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface RemotePlayerData {
  id: string;
  clientId?: string;
  userId?: string;
  username: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  avatarColor: string;
  isSkateboarding?: boolean;
  activeVehicle?: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
  isFishing?: boolean;
  currentEmote?: string | null;
  maLoDat?: string;
  houseTitle?: string;
  houseWallColor?: string;
  houseRoofColor?: string;
  houseFurniture?: Array<{
    maVatPham: string;
    tenVatPham?: string;
    toaDoLuoiX: number;
    toaDoLuoiZ: number;
    gocXoayDo: number;
  }>;
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

export interface LocalPlayerProfile {
  userId?: string;
  username: string;
  avatarColor: string;
  maLoDat: string;
  houseTitle: string;
  houseWallColor: string;
  houseRoofColor: string;
  houseFurniture?: Array<{
    maVatPham: string;
    tenVatPham?: string;
    toaDoLuoiX: number;
    toaDoLuoiZ: number;
    gocXoayDo: number;
  }>;
}

export interface MultiplayerState {
  socket: Socket | null;
  isConnected: boolean;
  myId: string | null;
  myClientId: string;
  myPlotCode: string;
  remotePlayers: Map<string, RemotePlayerData>;
  chatMessages: ChatMessage[];

  // Actions
  connect: (profile?: Partial<LocalPlayerProfile>) => void;
  updateProfile: (profile: Partial<LocalPlayerProfile>) => void;
  randomizeMyPlot: () => Promise<string | null>;
  disconnect: () => void;
  sendPosition: (
    x: number,
    y: number,
    z: number,
    rotationY: number,
    extra?: {
      isSkateboarding?: boolean;
      activeVehicle?: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
      isFishing?: boolean;
      currentEmote?: string | null;
    }
  ) => void;
  sendMessage: (text: string) => void;
}

const AVATAR_PALETTE = [
  '#38bdf8',
  '#f43f5e',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
];

function getOrCreateTabClientId(): string {
  if (typeof window === 'undefined') return 'ssr-client';
  let cid = sessionStorage.getItem('lifeat_world_client_id');
  if (!cid) {
    cid = 'client_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    sessionStorage.setItem('lifeat_world_client_id', cid);
  }
  return cid;
}

function getTabColor(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

let lastSendTime = 0;
const THROTTLE_MS = 50;
let syncIntervalId: ReturnType<typeof setInterval> | null = null;

// Lưu tọa độ hiện tại của local player để đồng bộ qua cả Socket.io và HTTP Sync
const localState = {
  x: 0,
  y: 1.2,
  z: 5,
  rotationY: 0,
  nearbyStreetNpcId: null as string | null,
  isSkateboarding: false,
  activeVehicle: 'none' as 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar',
  isFishing: false,
  currentEmote: null as string | null,
  profile: {
    userId: '',
    username: 'Cư dân',
    avatarColor: '#38bdf8',
    maLoDat: '',
    houseTitle: 'Nhà Cấp 4',
    houseWallColor: '#f5ebd6',
    houseRoofColor: '#b93829',
    houseFurniture: undefined as
      | Array<{
          maVatPham: string;
          tenVatPham?: string;
          toaDoLuoiX: number;
          toaDoLuoiZ: number;
          gocXoayDo: number;
        }>
      | undefined,
  },
  pendingChatText: '',
};

export function getLocalPlayerPosition(): { x: number; y: number; z: number } {
  return { x: localState.x, y: localState.y, z: localState.z };
}

export function getNearbyStreetNpcId(): string | null {
  return localState.nearbyStreetNpcId;
}

export function setNearbyStreetNpcId(npcId: string | null): void {
  localState.nearbyStreetNpcId = npcId;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  socket: null,
  isConnected: false,
  myId: null,
  myClientId: typeof window !== 'undefined' ? getOrCreateTabClientId() : 'ssr',
  myPlotCode: '',
  remotePlayers: new Map(),
  chatMessages: [
    {
      id: 'system-welcome',
      username: 'System',
      avatarColor: '#38bdf8',
      text: 'Chào mừng đến Thành phố 3D! Bạn có thể gặp gỡ người chơi khác và ghé thăm Nhà Cấp 4 của nhau.',
      timestamp: Date.now(),
    },
  ],

  updateProfile: (profile) => {
    const clientId = getOrCreateTabClientId();
    localState.profile = {
      ...localState.profile,
      ...profile,
      avatarColor: profile.avatarColor || localState.profile.avatarColor || getTabColor(clientId),
    };
    if (profile.maLoDat && !get().myPlotCode) {
      set({ myPlotCode: profile.maLoDat });
    }
    const s = get().socket;
    if (s && s.connected) {
      s.emit('playerJoin', {
        clientId,
        ...localState.profile,
        maLoDat: get().myPlotCode || localState.profile.maLoDat,
        x: localState.x,
        y: localState.y,
        z: localState.z,
      });
    }
  },

  randomizeMyPlot: async () => {
    const clientId = getOrCreateTabClientId();
    try {
      const res = await fetch('/api/world/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...localState.profile,
          x: localState.x,
          y: localState.y,
          z: localState.z,
          rotationY: localState.rotationY,
          forceRandomPlot: true,
        }),
      });
      const data = await res.json();
      if (data?.assignedPlotCode) {
        localState.profile.maLoDat = data.assignedPlotCode;
        set({ myPlotCode: data.assignedPlotCode });
        return data.assignedPlotCode as string;
      }
    } catch {}
    return null;
  },

  connect: (initialProfile) => {
    const clientId = getOrCreateTabClientId();
    localState.profile.avatarColor = getTabColor(clientId);
    if (initialProfile) {
      localState.profile = {
        ...localState.profile,
        ...initialProfile,
        avatarColor: initialProfile.avatarColor || getTabColor(clientId),
      };
    }
    set({ myClientId: clientId, isConnected: true });

    // 1. Khởi chạy vòng lặp đồng bộ HTTP (/api/world/sync) đảm bảo 100% các user luôn gặp nhau
    // và không bao giờ trùng vị trí Nhà Cấp 4 ngay cả khi chạy next dev hoặc nhiều tab
    const runHttpSync = async () => {
      try {
        const chatToSend = localState.pendingChatText;
        localState.pendingChatText = '';

        const res = await fetch('/api/world/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            userId: localState.profile.userId,
            username: localState.profile.username,
            avatarColor: localState.profile.avatarColor,
            x: localState.x,
            y: localState.y,
            z: localState.z,
            rotationY: localState.rotationY,
            isSkateboarding: localState.isSkateboarding,
            activeVehicle: localState.activeVehicle,
            isFishing: localState.isFishing,
            currentEmote: localState.currentEmote,
            maLoDat: get().myPlotCode || localState.profile.maLoDat,
            houseTitle: localState.profile.houseTitle,
            houseWallColor: localState.profile.houseWallColor,
            houseRoofColor: localState.profile.houseRoofColor,
            houseFurniture: localState.profile.houseFurniture,
            newChatText: chatToSend || undefined,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.assignedPlotCode && data.assignedPlotCode !== get().myPlotCode) {
          localState.profile.maLoDat = data.assignedPlotCode;
          set({ myPlotCode: data.assignedPlotCode });
        }

        if (Array.isArray(data.players)) {
          const newMap = new Map<string, RemotePlayerData>();
          for (const p of data.players) {
            const pKey = p.clientId || p.id;
            if (pKey && pKey !== clientId) {
              newMap.set(pKey, {
                ...p,
                id: pKey,
              });
            }
          }
          set({ remotePlayers: newMap, isConnected: true });
        }

        if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
          set({ chatMessages: data.chatMessages });
        }
      } catch {}
    };

    runHttpSync();
    if (syncIntervalId) clearInterval(syncIntervalId);
    syncIntervalId = setInterval(runHttpSync, 400);

    // 2. Kết nối thêm Socket.io (nếu chạy qua server.js) để tăng tốc độ phản hồi 20Hz
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      return;
    }

    try {
      const socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        reconnectionDelay: 1500,
      });

      socket.on('connect', () => {
        set({ socket, isConnected: true, myId: socket.id });
        socket.emit('playerJoin', {
          clientId,
          ...localState.profile,
          maLoDat: get().myPlotCode || localState.profile.maLoDat,
          x: localState.x,
          y: localState.y,
          z: localState.z,
        });
      });

      socket.on('plotAssigned', (payload: { maLoDat?: string }) => {
        if (payload?.maLoDat && !get().myPlotCode) {
          localState.profile.maLoDat = payload.maLoDat;
          set({ myPlotCode: payload.maLoDat });
        }
      });

      socket.on('worldUpdate', (allPlayers: RemotePlayerData[]) => {
        const currentMySocketId = get().myId || socket.id;
        const currentRemotes = new Map(get().remotePlayers);

        for (const p of allPlayers) {
          const pKey = p.clientId || p.id;
          if (p.id !== currentMySocketId && pKey !== clientId) {
            currentRemotes.set(pKey, {
              ...currentRemotes.get(pKey),
              ...p,
              id: pKey,
            });
          }
        }
        set({ remotePlayers: currentRemotes });
      });

      socket.on('chatMessage', (msg: ChatMessage) => {
        set((state) => {
          const exists = state.chatMessages.some(
            (m) => m.text === msg.text && Math.abs(m.timestamp - msg.timestamp) < 1500
          );
          if (exists) return state;
          return {
            chatMessages: [...state.chatMessages.slice(-49), msg],
          };
        });
      });

      socket.on('playerLeft', (leftId: string) => {
        set((state) => {
          const updated = new Map(state.remotePlayers);
          updated.delete(leftId);
          return { remotePlayers: updated };
        });
      });

      set({ socket });
    } catch {}
  },

  disconnect: () => {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
    const s = get().socket;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    set({ socket: null, isConnected: false, myId: null, remotePlayers: new Map() });
  },

  sendPosition: (x, y, z, rotationY, extra) => {
    localState.x = x;
    localState.y = y;
    localState.z = z;
    localState.rotationY = rotationY;
    if (extra) {
      if (typeof extra.isSkateboarding === 'boolean') {
        localState.isSkateboarding = extra.isSkateboarding;
      }
      if (extra.activeVehicle) {
        localState.activeVehicle = extra.activeVehicle;
      }
      if (typeof extra.isFishing === 'boolean') {
        localState.isFishing = extra.isFishing;
      }
      if (extra.currentEmote !== undefined) {
        localState.currentEmote = extra.currentEmote;
      }
    }

    const now = performance.now();
    if (now - lastSendTime < THROTTLE_MS) {
      return;
    }
    lastSendTime = now;

    const s = get().socket;
    if (s && s.connected) {
      s.emit('playerMove', {
        x,
        y,
        z,
        rotationY,
        username: localState.profile.username,
        isSkateboarding: localState.isSkateboarding,
        isFishing: localState.isFishing,
        currentEmote: localState.currentEmote,
        houseTitle: localState.profile.houseTitle,
        houseWallColor: localState.profile.houseWallColor,
        houseRoofColor: localState.profile.houseRoofColor,
      });
    }
  },

  sendMessage: (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    localState.pendingChatText = clean;

    const s = get().socket;
    if (s && s.connected) {
      s.emit('sendChat', { text: clean });
    }
  },
}));

export default useMultiplayerStore;
