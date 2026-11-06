import { NextResponse } from 'next/server';
import { HOUSE_PLOTS, pickRandomAvailablePlot } from '@/data/housePlots';

export interface ActiveWorldPlayer {
  id: string; // clientId duy nhất cho mỗi tab/phiên người dùng
  userId?: string;
  username: string;
  avatarColor: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  isSkateboarding?: boolean;
  activeVehicle?: 'none' | 'skateboard' | 'vespa' | 'motorbike' | 'sportscar';
  isFishing?: boolean;
  currentEmote?: string | null;
  currentChat?: string;
  chatTime?: number;
  // Thông tin Ngôi Nhà Cấp 4 của người chơi này
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
  lastSeen: number;
}

export interface WorldChatMessage {
  id: string;
  senderClientId: string;
  username: string;
  avatarColor: string;
  text: string;
  timestamp: number;
}

interface GlobalWorldStore {
  players: Map<string, ActiveWorldPlayer>;
  chatMessages: WorldChatMessage[];
}

const globalForWorld = globalThis as unknown as {
  __LIFEAT_WORLD_STORE__?: GlobalWorldStore;
};

if (!globalForWorld.__LIFEAT_WORLD_STORE__) {
  globalForWorld.__LIFEAT_WORLD_STORE__ = {
    players: new Map<string, ActiveWorldPlayer>(),
    chatMessages: [
      {
        id: 'system-welcome',
        senderClientId: 'system',
        username: 'System',
        avatarColor: '#38bdf8',
        text: 'Chào mừng đến Thành phố 3D! Bạn có thể gặp gỡ người chơi khác và ghé thăm Nhà Cấp 4 của nhau.',
        timestamp: Date.now(),
      },
    ],
  };
}

const PLAYER_TIMEOUT_MS = 12000; // Tự động xóa người chơi nếu tắt tab sau 12 giây

function pruneInactivePlayers(store: GlobalWorldStore) {
  const now = Date.now();
  for (const [id, p] of store.players.entries()) {
    if (now - p.lastSeen > PLAYER_TIMEOUT_MS) {
      store.players.delete(id);
    }
  }
}

export async function POST(request: Request) {
  try {
    const store = globalForWorld.__LIFEAT_WORLD_STORE__!;
    pruneInactivePlayers(store);

    const body = await request.json();
    const {
      clientId,
      userId,
      username,
      avatarColor,
      x,
      y,
      z,
      rotationY,
      isSkateboarding,
      activeVehicle,
      isFishing,
      currentEmote,
      maLoDat,
      houseTitle,
      houseWallColor,
      houseRoofColor,
      houseFurniture,
      newChatText,
      forceRandomPlot,
    } = body;

    if (!clientId) {
      return NextResponse.json({ message: 'Thiếu clientId' }, { status: 400 });
    }

    const existing = store.players.get(clientId);

    // Tập hợp các lô đất đã có người chơi ĐANG ONLINE khác chiếm giữ
    const occupiedByOthers: string[] = [];
    for (const [otherId, otherPlayer] of store.players.entries()) {
      if (otherId !== clientId && otherPlayer.maLoDat) {
        occupiedByOthers.push(otherPlayer.maLoDat);
      }
    }

    const validCodes = new Set(HOUSE_PLOTS.map((p) => p.maLoDat));
    let assignedPlotCode = existing?.maLoDat || maLoDat || '';

    // Nếu người chơi mới vào, yêu cầu random lại, hoặc lô đất đang bị trùng với người chơi khác đang online -> Random ngay lô đất trống!
    if (
      forceRandomPlot ||
      !assignedPlotCode ||
      !validCodes.has(assignedPlotCode) ||
      occupiedByOthers.includes(assignedPlotCode)
    ) {
      const picked = pickRandomAvailablePlot(occupiedByOthers);
      assignedPlotCode = picked.maLoDat;
    }

    const now = Date.now();
    let currentChat = existing?.currentChat || '';
    let chatTime = existing?.chatTime || 0;

    if (newChatText && String(newChatText).trim().length > 0) {
      const cleanText = String(newChatText).trim().slice(0, 180);
      currentChat = cleanText;
      chatTime = now;
      store.chatMessages.push({
        id: `${now}_${Math.random().toString(36).slice(2, 7)}`,
        senderClientId: clientId,
        username: username || existing?.username || 'Cư dân',
        avatarColor: avatarColor || existing?.avatarColor || '#38bdf8',
        text: cleanText,
        timestamp: now,
      });
      if (store.chatMessages.length > 50) {
        store.chatMessages = store.chatMessages.slice(-50);
      }
    }

    const updatedPlayer: ActiveWorldPlayer = {
      id: clientId,
      userId: userId || existing?.userId,
      username: username || existing?.username || 'Cư dân',
      avatarColor: avatarColor || existing?.avatarColor || '#38bdf8',
      x: typeof x === 'number' ? x : existing?.x ?? 0,
      y: typeof y === 'number' ? y : existing?.y ?? 1.2,
      z: typeof z === 'number' ? z : existing?.z ?? 5,
      rotationY: typeof rotationY === 'number' ? rotationY : existing?.rotationY ?? 0,
      isSkateboarding: Boolean(isSkateboarding),
      activeVehicle: activeVehicle || existing?.activeVehicle || (isSkateboarding ? 'skateboard' : 'none'),
      isFishing: Boolean(isFishing),
      currentEmote: currentEmote ?? null,
      currentChat,
      chatTime,
      maLoDat: assignedPlotCode,
      houseTitle: houseTitle || existing?.houseTitle || `Nhà Cấp 4 của ${username || 'Cư dân'}`,
      houseWallColor: houseWallColor || existing?.houseWallColor || '#f5ebd6',
      houseRoofColor: houseRoofColor || existing?.houseRoofColor || '#b93829',
      houseFurniture: Array.isArray(houseFurniture) ? houseFurniture : existing?.houseFurniture,
      lastSeen: now,
    };

    store.players.set(clientId, updatedPlayer);

    return NextResponse.json({
      thanhCong: true,
      assignedPlotCode,
      players: Array.from(store.players.values()),
      chatMessages: store.chatMessages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { thanhCong: false, message: error.message || 'Lỗi đồng bộ thế giới.' },
      { status: 500 }
    );
  }
}

