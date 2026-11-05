import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RoomChatMessage from '@/models/RoomChatMessage';
import { verifyJwtToken } from '@/lib/auth';

// GET: Lấy lịch sử chat của phòng
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');

    if (!roomCode) {
      return NextResponse.json({ messages: [] });
    }

    await connectToDatabase();

    const messages = await RoomChatMessage.find({ roomCode })
      .sort({ createdAt: 1 })
      .limit(60);

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.clientMsgId || m._id.toString(),
        clientMsgId: m.clientMsgId || m._id.toString(),
        roomCode: m.roomCode,
        senderId: m.senderId,
        senderName: m.senderName,
        avatar: m.avatar,
        text: m.text,
        timestamp: m.timestamp,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi lấy lịch sử chat:', error);
    return NextResponse.json({ messages: [] });
  }
}

// POST: Lưu tin nhắn chat vào DB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, text, senderName, avatar, senderId, clientMsgId } = body;

    if (!roomCode || !text || !text.trim()) {
      return NextResponse.json(
        { message: 'Nội dung tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    let realSenderName = senderName || 'Anonymous';
    let realSenderId = senderId || '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.tenDangNhap) {
        realSenderName = decoded.tenDangNhap;
        realSenderId = decoded.userId;
      }
    }

    await connectToDatabase();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const created = await RoomChatMessage.create({
      roomCode,
      senderId: realSenderId,
      senderName: realSenderName,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
      text: text.trim(),
      timestamp: timeStr,
      clientMsgId: clientMsgId || '',
    });

    return NextResponse.json({
      success: true,
      message: {
        id: created._id.toString(),
        roomCode: created.roomCode,
        senderId: created.senderId,
        senderName: created.senderName,
        avatar: created.avatar,
        text: created.text,
        timestamp: created.timestamp,
        createdAt: created.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Lỗi lưu tin nhắn:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

