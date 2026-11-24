import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { generateRoomId } from '@/models/User';
import RoomState from '@/models/RoomState';
import { ensureDefaultStarterHouse } from '@/models/PlayerHouse';
import { comparePassword, signJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taiKhoan, matKhau } = body;

    if (!taiKhoan || !matKhau) {
      return NextResponse.json(
        { message: 'Vui lòng nhập tài khoản và mật khẩu.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ taiKhoan: taiKhoan.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { message: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(matKhau, user.matKhau);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Mỗi lần đăng nhập thành công, tự động random lại mã phòng (roomId) mới
    let newRoomId = generateRoomId();
    while (await User.exists({ roomId: newRoomId, _id: { $ne: user._id } })) {
      newRoomId = generateRoomId();
    }
    user.roomId = newRoomId;
    await user.save();

    // Đồng bộ RoomState cũ của Host sang mã phòng mới nếu có
    try {
      await RoomState.updateMany(
        { hostId: user._id.toString() },
        { $set: { roomCode: newRoomId } }
      );
    } catch {}

    // Khi mới tạo tài khoản/chưa có nhà thì hệ thống tự random 1 lô đất, lần sau đăng nhập giữ nguyên lô đất đó
    const nhaNguoiChoi = await ensureDefaultStarterHouse(user._id, user.tenDangNhap, false);

    const token = signJwtToken({
      userId: user._id.toString(),
      taiKhoan: user.taiKhoan,
      tenDangNhap: user.tenDangNhap,
      roomId: user.roomId,
    });

    return NextResponse.json({
      message: 'Đăng nhập thành công!',
      user: {
        id: user._id,
        taiKhoan: user.taiKhoan,
        tenDangNhap: user.tenDangNhap,
        tien: user.tien,
        roomId: user.roomId,
        diemKinhNghiem: user.diemKinhNghiem || 0,
        trinhDoTiengAnh: user.trinhDoTiengAnh || 'A1',
        tuiDo: user.tuiDo || [],
        nhaNguoiChoi,
      },
      token,
    });
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi kết nối máy chủ / cơ sở dữ liệu MongoDB.' },
      { status: 500 }
    );
  }
}
