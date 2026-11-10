import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import RoomState from '@/models/RoomState';
import mongoose from 'mongoose';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = (searchParams.get('target') || '').trim();
    const spaceParamQuery = (searchParams.get('space') || '').trim();

    if (!target && !spaceParamQuery) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp link phòng hoặc mã phòng.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Thu thập danh sách các mã ứng viên cần kiểm tra
    const candidates: string[] = [];

    if (spaceParamQuery) {
      candidates.push(spaceParamQuery);
    }

    // Nếu target chứa đường dẫn /room/
    if (target.includes('/room/')) {
      try {
        const urlObj = target.startsWith('http')
          ? new URL(target)
          : new URL(target, 'http://localhost');

        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const roomIndex = pathParts.indexOf('room');
        const rawRoomId = roomIndex !== -1 && pathParts[roomIndex + 1] ? pathParts[roomIndex + 1] : '';
        const spaceFromUrl = urlObj.searchParams.get('space') || '';

        if (spaceFromUrl) candidates.push(spaceFromUrl);
        if (rawRoomId) candidates.push(rawRoomId);
      } catch {
        // Parse error fallback
      }
    } else if (target) {
      candidates.push(target);
    }

    // Loại bỏ chuỗi rỗng và trùng lặp
    const uniqueCandidates = Array.from(new Set(candidates.map((c) => c.trim()).filter(Boolean)));

    let matchedUser = null;
    let matchedRoomState = null;

    for (const candidate of uniqueCandidates) {
      // 1. Tìm theo roomId của User (vd: M7KQ-AQ07)
      matchedUser = await User.findOne({
        roomId: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, 'i') },
      });
      if (matchedUser) break;

      // 2. Tìm theo _id của User (nếu là ObjectId hợp lệ)
      if (mongoose.Types.ObjectId.isValid(candidate)) {
        matchedUser = await User.findById(candidate);
        if (matchedUser) break;
      }

      // 3. Tìm theo tenDangNhap của User
      matchedUser = await User.findOne({
        tenDangNhap: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, 'i') },
      });
      if (matchedUser) break;

      // 4. Tìm theo taiKhoan của User
      matchedUser = await User.findOne({
        taiKhoan: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, 'i') },
      });
      if (matchedUser) break;

      // 5. Tìm trong RoomState đã lưu
      matchedRoomState = await RoomState.findOne({
        roomCode: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, 'i') },
      });
      if (matchedRoomState) break;

      // 6. Kiểm tra phòng demo mặc định của hệ thống
      if (candidate.toUpperCase() === 'M7KQ-ILKC') {
        return NextResponse.json({
          success: true,
          roomUrl: `/room/M7KQ-ILKC?space=M7KQ-ILKC&host=${encodeURIComponent("Trường's Room")}`,
          roomId: 'M7KQ-ILKC',
          roomCode: 'M7KQ-ILKC',
          hostName: "Trường's Room",
        });
      }
    }

    if (matchedUser) {
      const roomHost = `${matchedUser.tenDangNhap}'s Room`;
      const roomCode = matchedUser.roomId;
      const roomUrl = `/room/${matchedUser._id}?space=${encodeURIComponent(roomCode)}&host=${encodeURIComponent(roomHost)}`;

      return NextResponse.json({
        success: true,
        roomUrl,
        roomId: matchedUser._id.toString(),
        roomCode,
        hostName: roomHost,
      });
    }

    if (matchedRoomState) {
      const roomHost = matchedRoomState.hostName || `Phòng ${matchedRoomState.roomCode}`;
      const roomCode = matchedRoomState.roomCode;
      const roomId = matchedRoomState.hostId || roomCode;
      const roomUrl = `/room/${roomId}?space=${encodeURIComponent(roomCode)}&host=${encodeURIComponent(roomHost)}`;

      return NextResponse.json({
        success: true,
        roomUrl,
        roomId,
        roomCode,
        hostName: roomHost,
      });
    }

    // Không tìm thấy bất kỳ phòng nào hợp lệ -> Báo lỗi 404
    return NextResponse.json(
      {
        success: false,
        message: 'Mã phòng hoặc link phòng không tồn tại trên hệ thống. Vui lòng kiểm tra lại!',
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Lỗi phân giải phòng:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi phân giải phòng.' },
      { status: 500 }
    );
  }
}
