import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RoomInvitation from '@/models/RoomInvitation';
import { verifyJwtToken } from '@/lib/auth';

// GET: Lấy danh sách lời mời đang chờ (pending) của user hiện tại
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ invitations: [] });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ invitations: [] });
    }

    await connectToDatabase();

    // Lấy các lời mời mới nhất trong vòng 2 giờ có trạng thái pending
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const invitations = await RoomInvitation.find({
      recipientId: decoded.userId,
      status: 'pending',
      createdAt: { $gte: twoHoursAgo },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv._id.toString(),
        senderId: inv.senderId.toString(),
        senderName: inv.senderName,
        senderRoomId: inv.senderRoomId,
        senderRoomName: inv.senderRoomName,
        roomUrl: inv.roomUrl,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lời mời:', error);
    return NextResponse.json({ invitations: [] });
  }
}

// POST: Phản hồi lời mời (Chấp nhận / Từ chối)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Vui lòng đăng nhập.' },
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

    const body = await request.json();
    const { invitationId, action } = body;

    if (!invitationId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { message: 'Dữ liệu phản hồi không hợp lệ.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const invitation = await RoomInvitation.findOne({
      _id: invitationId,
      recipientId: decoded.userId,
    });

    if (!invitation) {
      return NextResponse.json(
        { message: 'Không tìm thấy lời mời hoặc lời mời đã hết hạn.' },
        { status: 404 }
      );
    }

    invitation.status = action === 'accept' ? 'accepted' : 'declined';
    await invitation.save();

    return NextResponse.json({
      success: true,
      action,
      roomUrl: invitation.roomUrl,
      senderRoomId: invitation.senderRoomId,
      senderRoomName: invitation.senderRoomName,
      message:
        action === 'accept'
          ? `Đã chấp nhận lời mời vào phòng của ${invitation.senderName}!`
          : `Đã từ chối lời mời của ${invitation.senderName}.`,
    });
  } catch (error: any) {
    console.error('Lỗi khi phản hồi lời mời:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

