import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NhaNguoiChoi, { ensureDefaultStarterHouse } from '@/models/PlayerHouse';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token không hợp lệ.' }, { status: 401 });
    }

    await connectToDatabase();
    const house = await ensureDefaultStarterHouse(decoded.userId, decoded.tenDangNhap || 'Bạn');

    return NextResponse.json({ thanhCong: true, nhaNguoiChoi: house });
  } catch (error: any) {
    return NextResponse.json(
      { thanhCong: false, message: error.message || 'Lỗi tải thông tin nhà.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token không hợp lệ.' }, { status: 401 });
    }

    const body = await request.json();
    const { tenNha, mauTuong, mauMai, randomizePlot } = body;

    await connectToDatabase();
    if (randomizePlot) {
      const randomized = await ensureDefaultStarterHouse(
        decoded.userId,
        decoded.tenDangNhap || 'Bạn',
        true
      );
      return NextResponse.json({
        thanhCong: true,
        nhaNguoiChoi: randomized,
      });
    }
    await ensureDefaultStarterHouse(decoded.userId, decoded.tenDangNhap || 'Bạn');

    const updated = await NhaNguoiChoi.findOneAndUpdate(
      { maNguoiChoi: decoded.userId },
      {
        ...(tenNha ? { tenNha } : {}),
        ...(mauTuong ? { mauTuong } : {}),
        ...(mauMai ? { mauMai } : {}),
      },
      { new: true }
    );

    return NextResponse.json({
      thanhCong: true,
      nhaNguoiChoi: updated
        ? {
            id: updated._id.toString(),
            tenNha: updated.tenNha,
            loaiNha: updated.loaiNha,
            maLoDat: updated.maLoDat,
            capDoNha: updated.capDoNha,
            moHinhNgoaiThat: updated.moHinhNgoaiThat,
            mauTuong: updated.mauTuong,
            mauMai: updated.mauMai,
            kichThuocLuoiNoiThat: updated.kichThuocLuoiNoiThat,
            danhSachNoiThat: updated.danhSachNoiThat,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { thanhCong: false, message: error.message || 'Lỗi cập nhật nhà.' },
      { status: 500 }
    );
  }
}

