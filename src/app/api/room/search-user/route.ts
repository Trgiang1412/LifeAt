import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json({ users: [] });
    }

    const authHeader = request.headers.get('Authorization');
    let currentUserId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded) currentUserId = decoded.userId;
    }

    await connectToDatabase();

    const queryFilter: any = {
      $or: [
        { tenDangNhap: { $regex: q.trim(), $options: 'i' } },
        { taiKhoan: { $regex: q.trim(), $options: 'i' } },
      ],
    };

    if (currentUserId) {
      queryFilter._id = { $ne: currentUserId };
    }

    const users = await User.find(queryFilter)
      .select('tenDangNhap taiKhoan roomId')
      .limit(6);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        tenDangNhap: u.tenDangNhap,
        taiKhoan: u.taiKhoan,
        roomId: u.roomId,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi tìm kiếm người dùng:', error);
    return NextResponse.json({ users: [] });
  }
}

