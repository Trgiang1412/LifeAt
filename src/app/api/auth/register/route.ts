import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, signJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taiKhoan, matKhau, tenDangNhap } = body;

    if (!taiKhoan || !matKhau || !tenDangNhap) {
      return NextResponse.json(
        { message: 'Vui lòng điền đầy đủ tài khoản, mật khẩu và tên đăng nhập.' },
        { status: 400 }
      );
    }

    if (taiKhoan.length < 3) {
      return NextResponse.json(
        { message: 'Tài khoản phải có ít nhất 3 ký tự.' },
        { status: 400 }
      );
    }

    if (matKhau.length < 6) {
      return NextResponse.json(
        { message: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if account already exists
    const existingUser = await User.findOne({ taiKhoan: taiKhoan.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Tài khoản này đã tồn tại. Vui lòng chọn tài khoản khác.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(matKhau);

    // Create user
    const newUser = await User.create({
      taiKhoan: taiKhoan.toLowerCase().trim(),
      matKhau: hashedPassword,
      tenDangNhap: tenDangNhap.trim(),
      tien: 100, // Khuyến mãi 100 xu lo-fi cho thành viên mới
    });

    // Sign JWT token
    const token = signJwtToken({
      userId: newUser._id.toString(),
      taiKhoan: newUser.taiKhoan,
      tenDangNhap: newUser.tenDangNhap,
      roomId: newUser.roomId,
    });

    return NextResponse.json(
      {
        message: 'Đăng ký tài khoản thành công! Chào mừng đến với LifeAt.',
        user: {
          id: newUser._id,
          taiKhoan: newUser.taiKhoan,
          tenDangNhap: newUser.tenDangNhap,
          tien: newUser.tien,
          roomId: newUser.roomId,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi kết nối máy chủ / cơ sở dữ liệu MongoDB.' },
      { status: 500 }
    );
  }
}

