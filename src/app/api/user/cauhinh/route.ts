import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyJwtToken } from '@/lib/auth';

/**
 * GET /api/user/cauhinh
 * Lấy danh sách cấu hình của người dùng từ MongoDB
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập hoặc token không hợp lệ.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(decoded.userId).select('cauHinh tenDangNhap taiKhoan');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cauHinh: user.cauHinh || [],
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy cấu hình user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/cauhinh
 * Cập nhật/Lưu danh sách cấu hình vào Model User trong MongoDB (không lưu trên local)
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập hoặc token không hợp lệ.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectToDatabase();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng.' },
        { status: 404 }
      );
    }

    // Xử lý dữ liệu cấu hình đầu vào:
    // 1. Nếu body có trường cauHinh là mảng
    // 2. Nếu body trực tiếp là một mảng
    // 3. Nếu body là một object cấu hình đơn lẻ (ví dụ PomodoroSettings)
    let newCauHinhList: any[] = [];

    if (Array.isArray(body.cauHinh)) {
      newCauHinhList = body.cauHinh;
    } else if (Array.isArray(body)) {
      newCauHinhList = body;
    } else if (body && typeof body === 'object') {
      // Trường hợp gửi trực tiếp object cài đặt
      const existing = Array.isArray(user.cauHinh) ? [...user.cauHinh] : [];
      const loai = body.loai || (body.pomodoroTime !== undefined ? 'pomodoro' : 'general');
      const itemToSave = { ...body, loai, capNhatLuc: new Date().toISOString() };
      
      const foundIdx = existing.findIndex((it: any) => it?.loai === loai);
      if (foundIdx >= 0) {
        existing[foundIdx] = itemToSave;
      } else {
        existing.push(itemToSave);
      }
      newCauHinhList = existing;
    }

    user.cauHinh = newCauHinhList;
    user.markModified('cauHinh');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình vào tài khoản thành công.',
      cauHinh: user.cauHinh,
    });
  } catch (error: any) {
    console.error('Lỗi khi lưu cấu hình user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/cauhinh
 * Alias hỗ trợ phương thức PUT
 */
export async function PUT(request: Request) {
  return POST(request);
}

