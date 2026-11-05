import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
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

    return NextResponse.json({
      user: {
        id: user._id,
        taiKhoan: user.taiKhoan,
        tenDangNhap: user.tenDangNhap,
        tien: user.tien,
        roomId: user.roomId,
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

