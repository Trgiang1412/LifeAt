import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notes from '@/models/Notes';
import { verifyJwtToken } from '@/lib/auth';

// GET: Lấy ghi chú của người dùng hoặc phòng học
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');

    const authHeader = request.headers.get('Authorization');
    let currentUser: { userId: string; taiKhoan: string } | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        currentUser = { userId: decoded.userId, taiKhoan: decoded.taiKhoan };
      }
    }

    await connectToDatabase();

    let note = null;

    if (currentUser?.userId) {
      note = await Notes.findOne({
        $or: [{ userId: currentUser.userId }, { taiKhoan: currentUser.taiKhoan }],
      });
    } else if (roomCode) {
      note = await Notes.findOne({ roomCode });
    }

    if (!note) {
      return NextResponse.json({
        success: true,
        note: null,
      });
    }

    return NextResponse.json({
      success: true,
      note: {
        id: note._id.toString(),
        content: note.content,
        title: note.title,
        roomCode: note.roomCode,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy ghi chú:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi lấy ghi chú.' },
      { status: 500 }
    );
  }
}

// POST: Lưu hoặc cập nhật ghi chú
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, title, roomCode } = body;

    const authHeader = request.headers.get('Authorization');
    let currentUser: { userId: string; taiKhoan: string } | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        currentUser = { userId: decoded.userId, taiKhoan: decoded.taiKhoan };
      }
    }

    await connectToDatabase();

    const noteTitle = title || 'Scratchpad Notes';
    const noteContent = typeof content === 'string' ? content : '';

    let updatedNote = null;

    if (currentUser?.userId) {
      updatedNote = await Notes.findOneAndUpdate(
        {
          $or: [{ userId: currentUser.userId }, { taiKhoan: currentUser.taiKhoan }],
        },
        {
          userId: currentUser.userId,
          taiKhoan: currentUser.taiKhoan,
          content: noteContent,
          title: noteTitle,
          roomCode: roomCode || '',
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (roomCode) {
      updatedNote = await Notes.findOneAndUpdate(
        { roomCode },
        {
          roomCode,
          content: noteContent,
          title: noteTitle,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Cần đăng nhập hoặc roomCode để lưu ghi chú vào DB.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      note: {
        id: updatedNote._id.toString(),
        content: updatedNote.content,
        title: updatedNote.title,
        roomCode: updatedNote.roomCode,
        updatedAt: updatedNote.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Lỗi lưu ghi chú:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi lưu ghi chú.' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa nội dung ghi chú
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');

    const authHeader = request.headers.get('Authorization');
    let currentUser: { userId: string; taiKhoan: string } | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        currentUser = { userId: decoded.userId, taiKhoan: decoded.taiKhoan };
      }
    }

    await connectToDatabase();

    if (currentUser?.userId) {
      await Notes.deleteOne({
        $or: [{ userId: currentUser.userId }, { taiKhoan: currentUser.taiKhoan }],
      });
    } else if (roomCode) {
      await Notes.deleteOne({ roomCode });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa ghi chú thành công.',
    });
  } catch (error: any) {
    console.error('Lỗi xóa ghi chú:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi xóa ghi chú.' },
      { status: 500 }
    );
  }
}

