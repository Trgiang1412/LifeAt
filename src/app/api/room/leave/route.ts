import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RoomState from '@/models/RoomState';
import { verifyJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode } = body;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: true });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: true });
    }

    if (!roomCode) {
      return NextResponse.json({ success: true });
    }

    await connectToDatabase();

    await RoomState.updateOne(
      { roomCode },
      { $pull: { participants: { userId: decoded.userId } } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi khi rời phòng:', error);
    return NextResponse.json({ success: true });
  }
}

