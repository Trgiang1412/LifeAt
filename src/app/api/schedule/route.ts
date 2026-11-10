import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import ScheduleItem from '@/models/ScheduleItem';
import { verifyJwtToken } from '@/lib/auth';

function getAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (decoded && decoded.userId) {
      return decoded;
    }
  }
  return null;
}

// GET: Lấy danh sách lịch trình
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');
    const user = getAuthUser(request);

    await connectToDatabase();

    const query: any = {};
    if (user?.userId) {
      const orConditions: any[] = [{ userId: user.userId }];
      if (mongoose.Types.ObjectId.isValid(user.userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(user.userId) });
      }
      query.$or = orConditions;
    } else if (roomCode) {
      query.roomCode = roomCode;
    } else {
      return NextResponse.json({ success: true, items: [] });
    }

    const items = await ScheduleItem.find(query).sort({ startTime: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        time: `${item.startTime} - ${item.endTime}`,
        type: item.type,
        done: item.done,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi lấy schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi lấy lịch trình.' },
      { status: 500 }
    );
  }
}

// POST: Tạo lịch trình mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, startTime, endTime, type, roomCode } = body;
    const user = getAuthUser(request);

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Tiêu đề không được để trống.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newItem = await ScheduleItem.create({
      userId: user?.userId || null,
      roomCode: roomCode || '',
      title: title.trim(),
      startTime: startTime || '09:00',
      endTime: endTime || '10:00',
      type: type || 'focus',
      done: false,
    });

    return NextResponse.json({
      success: true,
      item: {
        id: newItem._id.toString(),
        title: newItem.title,
        startTime: newItem.startTime,
        endTime: newItem.endTime,
        time: `${newItem.startTime} - ${newItem.endTime}`,
        type: newItem.type,
        done: newItem.done,
      },
    });
  } catch (error: any) {
    console.error('Lỗi tạo schedule item:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi tạo lịch trình.' },
      { status: 500 }
    );
  }
}

// PUT / PATCH: Cập nhật trạng thái hoàn thành hoặc nội dung
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, done, title, startTime, endTime, type } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID không hợp lệ.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (typeof done === 'boolean') updateFields.done = done;
    if (title !== undefined) updateFields.title = title.trim();
    if (startTime !== undefined) updateFields.startTime = startTime;
    if (endTime !== undefined) updateFields.endTime = endTime;
    if (type !== undefined) updateFields.type = type;

    const updated = await ScheduleItem.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy mục lịch trình.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: {
        id: updated._id.toString(),
        title: updated.title,
        startTime: updated.startTime,
        endTime: updated.endTime,
        time: `${updated.startTime} - ${updated.endTime}`,
        type: updated.type,
        done: updated.done,
      },
    });
  } catch (error: any) {
    console.error('Lỗi cập nhật schedule item:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi cập nhật lịch trình.' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa mục lịch trình
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp ID cần xóa.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    await ScheduleItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Đã xóa mục lịch trình.' });
  } catch (error: any) {
    console.error('Lỗi xóa schedule item:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi xóa mục lịch trình.' },
      { status: 500 }
    );
  }
}

