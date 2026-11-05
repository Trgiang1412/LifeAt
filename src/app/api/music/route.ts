import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ListMusic from '@/models/ListMusic';
import { verifyJwtToken } from '@/lib/auth';

// GET: Lấy danh sách video/nhạc YouTube từ DB
export async function GET() {
  try {
    await connectToDatabase();

    const musicList = await ListMusic.find()
      .sort({ thoiGianTao: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: musicList.map((m) => ({
        id: m._id.toString(),
        link: m.link,
        loai: m.loai || 'Lofi',
        ten: m.ten || '4K YouTube Video',
        thumbnailUrl: m.thumbnailUrl || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg` : ''),
        youtubeId: m.youtubeId || '',
        thoiGianTao: m.thoiGianTao,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách nhạc:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

// POST: Thêm video YouTube mới vào DB ListMusic
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { link, loai, ten, thumbnailUrl, youtubeId } = body;

    if (!link || !link.trim()) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp link video YouTube.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Lấy userId nếu có đăng nhập
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        userId = decoded.userId;
      }
    }

    const createData: any = {
      link: link.trim(),
      loai: loai || 'Lofi',
      ten: ten?.trim() || `4K ${loai || 'YouTube'} Focus Stream`,
      thumbnailUrl: thumbnailUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ''),
      youtubeId: youtubeId || '',
      thoiGianTao: new Date(),
    };

    if (userId) {
      createData.userId = userId;
    }

    const created: any = await ListMusic.create(createData);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu video vào danh mục nhạc!',
      item: {
        id: created._id.toString(),
        link: created.link,
        loai: created.loai,
        ten: created.ten,
        thumbnailUrl: created.thumbnailUrl,
        youtubeId: created.youtubeId,
        thoiGianTao: created.thoiGianTao,
      },
    });
  } catch (error: any) {
    console.error('Lỗi lưu video vào ListMusic:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi khi lưu video vào DB.' },
      { status: 500 }
    );
  }
}
