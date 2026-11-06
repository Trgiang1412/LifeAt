import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { ensureDefaultStarterHouse } from '@/models/PlayerHouse';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Chưa đăng nhập hoặc token không hợp lệ.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Phiên đăng nhập đã hết hạn.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(decoded.userId).select('-matKhau');
    if (!user) {
      return NextResponse.json(
        { message: 'Không tìm thấy người dùng.' },
        { status: 404 }
      );
    }

    // Tự động kiểm tra và cấp mặc định Ngôi Nhà Cấp 4 nếu tài khoản chưa có
    const nhaNguoiChoi = await ensureDefaultStarterHouse(user._id, user.tenDangNhap);

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}
