import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RoomState from '@/models/RoomState';
import { verifyJwtToken } from '@/lib/auth';

// GET: Lấy trạng thái đồng bộ của phòng (nhạc/space, đồng hồ pomodoro, danh sách người tham gia)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');

    if (!roomCode) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp roomCode.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let state = await RoomState.findOne({ roomCode });

    // Lấy thông tin user nếu có token
    const authHeader = request.headers.get('Authorization');
    let currentUser: { userId: string; tenDangNhap: string } | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        currentUser = { userId: decoded.userId, tenDangNhap: decoded.tenDangNhap };
      }
    }

    if (!state) {
      // Nếu chưa có, tạo mặc định
      const hostDisplayName = currentUser?.tenDangNhap || "Trường";
      state = await RoomState.create({
        roomCode,
        hostId: currentUser?.userId || '',
        hostName: currentUser?.tenDangNhap ? `${currentUser.tenDangNhap}'s Room` : "Trường's Room",
        spaceId: 'yt-lofi-room-chill',
        timer: {
          mode: 'pomodoro',
          timeLeft: 25 * 60,
          isActive: false,
          lastUpdated: Date.now(),
        },
        participants: [
          {
            userId: currentUser?.userId || 'host',
            name: hostDisplayName,
            isHost: true,
            joinedAt: new Date(),
            lastSeen: new Date(),
          },
        ],
      });
    } else {
      const now = new Date();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      // Cập nhật người dùng hiện tại nếu có
      if (currentUser) {
        const existingPartIndex = state.participants.findIndex(
          (p) => p.userId === currentUser!.userId || p.name === currentUser!.tenDangNhap
        );

        const isHost =
          state.hostId === currentUser.userId ||
          state.roomCode.includes(currentUser.userId) ||
          state.hostName.includes(currentUser.tenDangNhap);

        if (existingPartIndex !== -1) {
          state.participants[existingPartIndex].lastSeen = now;
          state.participants[existingPartIndex].userId = currentUser.userId;
          state.participants[existingPartIndex].name = currentUser.tenDangNhap;
          state.participants[existingPartIndex].isHost = isHost;
        } else {
          state.participants.push({
            userId: currentUser.userId,
            name: currentUser.tenDangNhap,
            isHost,
            joinedAt: now,
            lastSeen: now,
          });
        }
      }

      // Lọc bỏ những người không heartbeat trong 2 phút
      state.participants = state.participants.filter(
        (p) => new Date(p.lastSeen) >= twoMinutesAgo
      );

      // Deduplicate theo userId hoặc name
      const seenUsers = new Set<string>();
      state.participants = state.participants.filter((p) => {
        const key = p.userId || p.name;
        if (!key || seenUsers.has(key)) return false;
        seenUsers.add(key);
        return true;
      });

      // Nếu danh sách trống, giữ lại ít nhất chủ phòng
      if (state.participants.length === 0) {
        const fallbackHostName = state.hostName ? state.hostName.replace("'s Room", "") : 'Chủ phòng';
        state.participants.push({
          userId: state.hostId || 'host',
          name: fallbackHostName,
          isHost: true,
          joinedAt: now,
          lastSeen: now,
        });
      }

      await state.save();
    }

    return NextResponse.json({
      success: true,
      roomCode: state.roomCode,
      hostId: state.hostId,
      hostName: state.hostName,
      spaceId: state.spaceId,
      timer: state.timer,
      participants: state.participants,
    });
  } catch (error: any) {
    console.error('Lỗi lấy room state:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

// POST: Cập nhật trạng thái phòng (Chủ phòng đổi nhạc/space hoặc bấm đồng hồ)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, spaceId, timer, hostName, hostId } = body;

    if (!roomCode) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp roomCode.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateData: any = {};
    if (spaceId) updateData.spaceId = spaceId;
    if (timer) updateData.timer = timer;
    if (hostName) updateData.hostName = hostName;
    if (hostId) updateData.hostId = hostId;

    const state = await RoomState.findOneAndUpdate(
      { roomCode },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      roomState: state,
    });
  } catch (error: any) {
    console.error('Lỗi cập nhật room state:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

