import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import RoomInvitation from '@/models/RoomInvitation';
import { verifyJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Vui lòng đăng nhập để gửi lời mời.' },
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
    const { recipientName, senderRoomId, senderRoomName, roomUrl } = body;

    if (!recipientName || !recipientName.trim()) {
      return NextResponse.json(
        { message: 'Vui lòng nhập tên người dùng cần mời.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json(
        { message: 'Không tìm thấy thông tin tài khoản người mời.' },
        { status: 404 }
      );
    }

    const trimmedRecipient = recipientName.trim();

    // Tìm kiếm người được mời theo tên đăng nhập hoặc tài khoản (không phân biệt chữ hoa thường)
    const recipient = await User.findOne({
      $or: [
        { tenDangNhap: { $regex: new RegExp(`^${trimmedRecipient}$`, 'i') } },
        { taiKhoan: { $regex: new RegExp(`^${trimmedRecipient}$`, 'i') } },
      ],
    });

    if (!recipient) {
      return NextResponse.json(
        { message: `Không tìm thấy người dùng có tên "${trimmedRecipient}".` },
        { status: 404 }
      );
    }

    if (recipient._id.toString() === sender._id.toString()) {
      return NextResponse.json(
        { message: 'Bạn không thể tự mời chính mình vào phòng.' },
        { status: 400 }
      );
    }

    const finalRoomId = senderRoomId || sender.roomId || 'M7KQ-ILKC';
    const finalRoomName = senderRoomName || `${sender.tenDangNhap}'s Room`;
    const finalRoomUrl =
      roomUrl ||
      `/room/${sender._id}?space=${finalRoomId}&host=${encodeURIComponent(finalRoomName)}`;

    // Tạo lời mời mới
    const invitation = await RoomInvitation.create({
      senderId: sender._id,
      senderName: sender.tenDangNhap,
      senderRoomId: finalRoomId,
      senderRoomName: finalRoomName,
      roomUrl: finalRoomUrl,
      recipientId: recipient._id,
      recipientUsername: recipient.tenDangNhap.toLowerCase(),
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: `Đã gửi lời mời thành công tới "${recipient.tenDangNhap}"!`,
      invitationId: invitation._id,
      recipient: {
        id: recipient._id,
        tenDangNhap: recipient.tenDangNhap,
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi lời mời vào phòng:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi hệ thống khi gửi lời mời.' },
      { status: 500 }
    );
  }
}

