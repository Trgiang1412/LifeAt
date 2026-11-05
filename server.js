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
  const players = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Người chơi kết nối: ${socket.id}`);

    // 1. Khởi tạo trạng thái mặc định cho người chơi mới
    players.set(socket.id, {
      id: socket.id,
      username: `Student_${socket.id.slice(0, 4)}`,
      x: (Math.random() - 0.5) * 3,
      y: 1.0,
      z: (Math.random() - 0.5) * 3,
      rotationY: 0,
      avatarColor: '#38bdf8',
      currentChat: '',
      chatTime: 0,
    });

    // Nhận thông tin đăng ký profile của người chơi
    socket.on('playerJoin', (data) => {
      const player = players.get(socket.id);
      if (player && data) {
        if (data.username) player.username = String(data.username).slice(0, 24);
        if (data.avatarColor) player.avatarColor = data.avatarColor;
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        players.set(socket.id, player);
      }
      socket.broadcast.emit('playerJoined', players.get(socket.id));
    });

    // 2. Lắng nghe event playerMove (tọa độ x, y, z, rotationY)
    socket.on('playerMove', (data) => {
      const player = players.get(socket.id);
      if (player && data) {
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        if (typeof data.rotationY === 'number') player.rotationY = data.rotationY;
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
      if (roomCode) {
        socket.join(`room_${roomCode}`);
        console.log(`[Socket.io] ${socket.id} đã vào room_${roomCode}`);
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

    // Người chơi ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Người chơi rời phòng: ${socket.id}`);
      players.delete(socket.id);
      io.emit('playerLeft', socket.id);
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

  httpServer.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`\n  ▲ LifeAt Space Development Server ready:`);
    console.log(`  - Local:   http://localhost:${port}`);
    if (localIp) {
      console.log(`  - Network: http://${localIp}:${port}`);
    }
    console.log(`  > [Multiplayer Server] Socket.io 20Hz World Broadcast Engine running on 0.0.0.0:${port}\n`);
  });
});

