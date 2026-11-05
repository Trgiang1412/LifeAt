import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = (searchParams.get('target') || '').trim();

    if (!target) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp link phòng hoặc mã phòng.' },
        { status: 400 }
      );
    }

    // 1. Nếu là URL đầy đủ hoặc đường dẫn /room/...
    if (target.includes('/room/')) {
      try {
        const urlObj = target.startsWith('http')
          ? new URL(target)
          : new URL(target, 'http://localhost');

        const pathname = urlObj.pathname;
        const search = urlObj.search;

        const pathParts = pathname.split('/').filter(Boolean);
        const roomIndex = pathParts.indexOf('room');
        const rawRoomId = roomIndex !== -1 && pathParts[roomIndex + 1] ? pathParts[roomIndex + 1] : '';

        const spaceParam = urlObj.searchParams.get('space') || rawRoomId || 'M7KQ-ILKC';
        const hostParam = urlObj.searchParams.get('host') || 'LifeAt Room';

        return NextResponse.json({
          success: true,
          roomUrl: `${pathname}${search}`,
          roomId: rawRoomId,
          roomCode: spaceParam,
          hostName: hostParam,
        });
      } catch {
        // Fallback parse
      }
    }

    // 2. Nếu là mã phòng hoặc tên đăng nhập hoặc ObjectId
    await connectToDatabase();

    // Thử tìm user có roomId trùng khớp
    let user = await User.findOne({ roomId: { $regex: new RegExp(`^${target}$`, 'i') } });

    // Nếu không tìm thấy, thử tìm theo _id
    if (!user && mongoose.Types.ObjectId.isValid(target)) {
      user = await User.findById(target);
    }

    // Nếu không tìm thấy, thử tìm theo tenDangNhap
    if (!user) {
      user = await User.findOne({
        tenDangNhap: { $regex: new RegExp(`^${target}$`, 'i') },
      });
    }

    if (user) {
      const roomHost = `${user.tenDangNhap}'s Room`;
      const roomCode = user.roomId;
      const roomUrl = `/room/${user._id}?space=${roomCode}&host=${encodeURIComponent(roomHost)}`;

      return NextResponse.json({
        success: true,
        roomUrl,
        roomId: user._id.toString(),
        roomCode,
        hostName: roomHost,
      });
    }

    // 3. Nếu không tìm thấy trong DB nhưng có dạng mã phòng (ví dụ M7KQ-XXXX)
    const fallbackCode = target.toUpperCase();
    const fallbackUrl = `/room/${fallbackCode}?space=${fallbackCode}&host=${encodeURIComponent(`Phòng ${fallbackCode}`)}`;

    return NextResponse.json({
      success: true,
      roomUrl: fallbackUrl,
      roomId: fallbackCode,
      roomCode: fallbackCode,
      hostName: `Phòng ${fallbackCode}`,
    });
  } catch (error: any) {
    console.error('Lỗi phân giải phòng:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi phân giải phòng.' },
      { status: 500 }
    );
  }
}

