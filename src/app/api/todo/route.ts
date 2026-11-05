import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import ToDoList from '@/models/ToDoList';
import { verifyJwtToken } from '@/lib/auth';

// Helper trích xuất user từ header Authorization
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

// GET: Lấy danh sách nhiệm vụ từ MongoDB Model ToDoList
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
      return NextResponse.json({ success: true, tasks: [] });
    }

    const tasks = await ToDoList.find(query).sort({ thoiGianTao: -1 });

    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.noiDung,
        completed: t.trangThai === 'hoan_thanh',
        estimatedPomodoros: t.estimatedPomodoros || 1,
        completedPomodoros: t.completedPomodoros || 0,
        trangThai: t.trangThai,
        mucDo: t.mucDo || 'trung_binh',
        createdAt: t.thoiGianTao ? new Date(t.thoiGianTao).getTime() : Date.now(),
      })),
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách ToDoList:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi lấy ToDoList.' },
      { status: 500 }
    );
  }
}

// POST: Tạo nhiệm vụ mới vào ToDoList
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, roomCode, estimatedPomodoros, mucDo } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nội dung nhiệm vụ không được để trống.' },
        { status: 400 }
      );
    }

    const user = getAuthUser(request);
    await connectToDatabase();

    let targetUserId = null;
    if (user?.userId) {
      targetUserId = mongoose.Types.ObjectId.isValid(user.userId)
        ? new mongoose.Types.ObjectId(user.userId)
        : user.userId;
    }

    const created = await ToDoList.create({
      userId: targetUserId,
      roomCode: roomCode || '',
      noiDung: title.trim(),
      trangThai: 'chua_lam',
      mucDo: mucDo || 'trung_binh',
      estimatedPomodoros: Number(estimatedPomodoros) || 1,
      completedPomodoros: 0,
      thoiGianTao: new Date(),
    });

    return NextResponse.json({
      success: true,
      task: {
        id: created._id.toString(),
        title: created.noiDung,
        completed: false,
        estimatedPomodoros: created.estimatedPomodoros,
        completedPomodoros: created.completedPomodoros,
        trangThai: created.trangThai,
        mucDo: created.mucDo,
        createdAt: created.thoiGianTao ? new Date(created.thoiGianTao).getTime() : Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Lỗi tạo nhiệm vụ ToDoList:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi tạo nhiệm vụ.' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật trạng thái hoàn thành hoặc nội dung nhiệm vụ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, completed, title, completedPomodoros } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu id nhiệm vụ cần cập nhật.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (completed !== undefined) {
      updateFields.trangThai = completed ? 'hoan_thanh' : 'chua_lam';
      updateFields.thoiGianHoanThanh = completed ? new Date() : null;
    }
    if (title !== undefined && title.trim()) {
      updateFields.noiDung = title.trim();
    }
    if (completedPomodoros !== undefined) {
      updateFields.completedPomodoros = Number(completedPomodoros);
    }

    const updated = await ToDoList.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy nhiệm vụ.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updated._id.toString(),
        title: updated.noiDung,
        completed: updated.trangThai === 'hoan_thanh',
        estimatedPomodoros: updated.estimatedPomodoros,
        completedPomodoros: updated.completedPomodoros,
        trangThai: updated.trangThai,
        mucDo: updated.mucDo,
        createdAt: updated.thoiGianTao ? new Date(updated.thoiGianTao).getTime() : Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Lỗi cập nhật nhiệm vụ ToDoList:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi cập nhật nhiệm vụ.' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa một hoặc nhiều nhiệm vụ đã hoàn thành
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearCompleted = searchParams.get('clearCompleted');
    const roomCode = searchParams.get('roomCode');
    const user = getAuthUser(request);

    await connectToDatabase();

    if (clearCompleted === 'true') {
      const deleteQuery: any = { trangThai: 'hoan_thanh' };
      if (user?.userId) {
        const orConditions: any[] = [{ userId: user.userId }];
        if (mongoose.Types.ObjectId.isValid(user.userId)) {
          orConditions.push({ userId: new mongoose.Types.ObjectId(user.userId) });
        }
        deleteQuery.$or = orConditions;
      } else if (roomCode) {
        deleteQuery.roomCode = roomCode;
      }
      await ToDoList.deleteMany(deleteQuery);
      return NextResponse.json({ success: true, message: 'Đã xóa tất cả nhiệm vụ đã hoàn thành.' });
    }

    if (id) {
      await ToDoList.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Đã xóa nhiệm vụ thành công.' });
    }

    return NextResponse.json(
      { success: false, message: 'Yêu cầu không hợp lệ.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Lỗi xóa nhiệm vụ ToDoList:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi xóa nhiệm vụ.' },
      { status: 500 }
    );
  }
}

