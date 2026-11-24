const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const os = require('os');

// Hàm lấy địa chỉ IP mạng nội bộ (LAN)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // Khởi tạo Socket.io với hỗ trợ CORS và WebSocket transport
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  /**
   * Lưu trữ danh sách người chơi trong RAM: Map<socketId, PlayerData>
   * @type {Map<string, {
   *   id: string,
   *   username: string,
   *   x: number,
   *   y: number,
   *   z: number,
   *   rotationY: number,
   *   avatarColor: string,
   *   currentChat: string,
   *   chatTime: number
   * }>}
   */
  const ALL_PLOT_CODES = [
    'PLOT_CAP4_01',
    'PLOT_CAP4_02',
    'PLOT_CAP4_03',
    'PLOT_CAP4_04',
    'PLOT_CAP4_05',
    'PLOT_CAP4_06',
    'PLOT_CAP4_07',
    'PLOT_CAP4_08',
    'PLOT_CAP4_09',
    'PLOT_CAP4_10',
  ];

  function pickSocketPlot(excludeSocketId, preferredPlot) {
    const used = new Set();
    for (const [sid, p] of players.entries()) {
      if (sid !== excludeSocketId && p.maLoDat) {
        used.add(p.maLoDat);
      }
    }
    if (preferredPlot && ALL_PLOT_CODES.includes(preferredPlot) && !used.has(preferredPlot)) {
      return preferredPlot;
    }
    const available = ALL_PLOT_CODES.filter((code) => !used.has(code));
    const pool = available.length > 0 ? available : ALL_PLOT_CODES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const players = new Map();
  // Quản lý thành viên trong từng Study Room cho WebRTC Audio & Video: Map<roomCode, Map<socketId, PeerInfo>>
  const roomMembers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Người chơi kết nối: ${socket.id}`);

    const initialPlot = pickSocketPlot(socket.id, null);

    // 1. Khởi tạo trạng thái mặc định cho người chơi mới (vị trí trên lối đi dạo quảng trường, không rơi vào đài phun nước)
    players.set(socket.id, {
      id: socket.id,
      clientId: socket.id,
      username: `Student_${socket.id.slice(0, 4)}`,
      x: (Math.random() - 0.5) * 2,
      y: 1.2,
      z: 11.5 + (Math.random() - 0.5) * 1.5,
      rotationY: 0,
      avatarColor: '#38bdf8',
      isSkateboarding: false,
      isFishing: false,
      currentEmote: null,
      maLoDat: initialPlot,
      houseTitle: `Nhà Cấp 4`,
      houseWallColor: '#f5ebd6',
      houseRoofColor: '#b93829',
      currentChat: '',
      chatTime: 0,
    });

    // Nhận thông tin đăng ký profile của người chơi
    socket.on('playerJoin', (data) => {
      const player = players.get(socket.id);
      if (player && data) {
        if (data.clientId) player.clientId = String(data.clientId);
        if (data.username) player.username = String(data.username).slice(0, 24);
        if (data.avatarColor) player.avatarColor = data.avatarColor;
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        player.maLoDat = pickSocketPlot(socket.id, data.maLoDat);
        if (data.houseTitle) player.houseTitle = String(data.houseTitle).slice(0, 40);
        if (data.houseWallColor) player.houseWallColor = data.houseWallColor;
        if (data.houseRoofColor) player.houseRoofColor = data.houseRoofColor;
        players.set(socket.id, player);
      }
      socket.emit('plotAssigned', { maLoDat: player?.maLoDat });
      socket.broadcast.emit('playerJoined', players.get(socket.id));
    });

    // 2. Lắng nghe event playerMove (tọa độ x, y, z, rotationY + trạng thái)
    socket.on('playerMove', (data) => {
      const player = players.get(socket.id);
      if (player && data) {
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        if (typeof data.rotationY === 'number') player.rotationY = data.rotationY;
        if (data.username) player.username = String(data.username).slice(0, 24);
        if (typeof data.isSkateboarding === 'boolean') player.isSkateboarding = data.isSkateboarding;
        if (typeof data.isFishing === 'boolean') player.isFishing = data.isFishing;
        if (data.currentEmote !== undefined) player.currentEmote = data.currentEmote;
        if (data.houseTitle) player.houseTitle = data.houseTitle;
        if (data.houseWallColor) player.houseWallColor = data.houseWallColor;
        if (data.houseRoofColor) player.houseRoofColor = data.houseRoofColor;
      }
    });

    // 3. Lắng nghe event sendChat (nội dung chat)
    socket.on('sendChat', (data) => {
      const player = players.get(socket.id);
      if (player && data && data.text) {
        const text = String(data.text).slice(0, 160).trim();
        if (text.length > 0) {
          player.currentChat = text;
          player.chatTime = Date.now();

          // Phát sóng thông điệp chat tức thời đến tất cả người chơi
          io.emit('chatMessage', {
            id: socket.id,
            username: player.username,
            avatarColor: player.avatarColor,
            text,
            timestamp: Date.now(),
          });
        }
      }
    });

    // 3.1 Tham gia phòng học ảo (joinRoom)
    socket.on('joinRoom', (data) => {
      const roomCode = typeof data === 'string' ? data : data?.roomCode;
      const userId = data?.userId || socket.id;
      const userName = data?.userName || 'Anonymous';
      const isHost = Boolean(data?.isHost);
      const isWebRtcClient = Boolean(data?.isWebRtcClient || (data?.userName && data?.userName !== 'Anonymous'));

      if (roomCode) {
        socket.join(`room_${roomCode}`);
        socket.currentRoomCode = roomCode;
        socket.currentUserId = userId;
        socket.currentUserName = userName;
        socket.isWebRtcClient = isWebRtcClient;

        if (isWebRtcClient) {
          if (!roomMembers.has(roomCode)) {
            roomMembers.set(roomCode, new Map());
          }
          const members = roomMembers.get(roomCode);

          // Gửi danh sách các WebRTC peer đang có trong phòng cho người mới
          const existingPeers = Array.from(members.values()).filter((p) => p.socketId !== socket.id);
          socket.emit('roomPeerList', existingPeers);

          // Đăng ký người mới vào danh sách WebRTC peer
          members.set(socket.id, {
            socketId: socket.id,
            userId,
            userName,
            isHost,
          });

          // Báo cho các bạn học khác trong phòng
          socket.to(`room_${roomCode}`).emit('peerJoined', {
            socketId: socket.id,
            userId,
            userName,
            isHost,
          });

          console.log(`[Socket.io WebRTC] ${userName} (${socket.id}) đã tham gia WebRTC Hub trong room_${roomCode}. Phòng hiện có: ${members.size} peer(s).`);
        } else {
          console.log(`[Socket.io Sync] ${userName} (${socket.id}) đã đồng bộ room_${roomCode}.`);
        }
      }
    });

    // 3.2 Chat trong phòng học (sendRoomChat)
    socket.on('sendRoomChat', (data) => {
      if (data && data.roomCode && data.text) {
        const msgId = data.id || data.clientMsgId || (Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6));
        const messagePayload = {
          id: msgId,
          clientMsgId: msgId,
          roomCode: data.roomCode,
          senderId: data.senderId || socket.id,
          senderName: data.senderName || 'Anonymous',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
          text: String(data.text).slice(0, 500).trim(),
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        io.to(`room_${data.roomCode}`).emit('roomChatMessage', messagePayload);
        io.emit(`roomChatMessage_${data.roomCode}`, messagePayload);
        socket.broadcast.emit('roomChatMessage', messagePayload);
      }
    });

    // 3.3 Đồng bộ không gian / video phòng học tức thì (syncRoomSpace)
    socket.on('syncRoomSpace', (data) => {
      if (data && data.roomCode && data.space) {
        socket.to(`room_${data.roomCode}`).emit('roomSpaceChanged', data);
        io.emit(`roomSpaceChanged_${data.roomCode}`, data);
      }
    });

    // 3.4 Đồng bộ trạng thái Mic & Video Webcam trong phòng học ảo
    socket.on('roomMediaToggle', (data) => {
      if (data && data.roomCode) {
        const payload = {
          ...data,
          fromSocketId: socket.id,
        };
        socket.to(`room_${data.roomCode}`).emit('roomMediaChanged', payload);
        io.emit(`roomMediaChanged_${data.roomCode}`, payload);
      }
    });

    // 3.5 WebRTC Signaling cho truyền Mic Audio & Camera Video P2P giữa các thành viên
    socket.on('webrtc_signal', (data) => {
      if (data && data.roomCode) {
        const payload = {
          ...data,
          fromSocketId: socket.id,
        };
        if (data.toSocketId) {
          // Gửi trực tiếp đến người nhận đích danh
          io.to(data.toSocketId).emit('webrtc_signal', payload);
        } else {
          // Broadcast đến toàn bộ bạn học khác trong phòng
          socket.to(`room_${data.roomCode}`).emit('webrtc_signal', payload);
        }
      }
    });

    // Người chơi ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Người chơi rời phòng: ${socket.id}`);
      players.delete(socket.id);
      io.emit('playerLeft', socket.id);

      if (socket.currentRoomCode && roomMembers.has(socket.currentRoomCode)) {
        const members = roomMembers.get(socket.currentRoomCode);
        members.delete(socket.id);
        socket.to(`room_${socket.currentRoomCode}`).emit('peerLeft', {
          socketId: socket.id,
          userId: socket.currentUserId,
        });
        if (members.size === 0) {
          roomMembers.delete(socket.currentRoomCode);
        }
      }
    });
  });

  // 4. Tần số phát sóng đồng bộ vị trí: Chạy setInterval 50ms (20Hz) broadcast gói tin worldUpdate
  const BROADCAST_INTERVAL_MS = 50; // 20Hz (20 lần/giây)
  setInterval(() => {
    if (players.size === 0) return;
    const worldData = Array.from(players.values());
    io.emit('worldUpdate', worldData);
  }, BROADCAST_INTERVAL_MS);

  // Chuyển toàn bộ request web sang Next.js App Router (Tương thích Express v5)
  server.use((req, res) => {
    return handle(req, res);
  });

  const localIp = getLocalIp();

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [LỖI] Cổng ${port} đang bị chiếm bởi một ứng dụng hoặc tiến trình Node khác!`);
      console.error(`👉 Bạn hãy đóng tab terminal đang chạy server cũ, hoặc chạy lệnh: npx kill-port ${port}\n`);
      process.exit(1);
    } else {
      console.error('❌ Lỗi HTTP Server:', err);
      process.exit(1);
    }
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`\n  ▲ LifeAt Space Development Server ready:`);
    console.log(`  - Local:   http://localhost:${port}`);
    if (localIp) {
      console.log(`  - Network: http://${localIp}:${port}`);
    }
    console.log(`  > [Multiplayer Server] Socket.io 20Hz World Broadcast Engine running on 0.0.0.0:${port}\n`);
  });
}).catch((err) => {
  console.error('\n❌ [LỖI KHỞI ĐỘNG NEXT.JS]:', err);
  process.exit(1);
});

