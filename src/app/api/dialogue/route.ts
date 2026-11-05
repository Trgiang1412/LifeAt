import { NextResponse } from 'next/server';
import { DialogueStateMachine, DialogueException } from '@/lib/DialogueStateMachine';
import { verifyJwtToken } from '@/lib/auth';
import NutHoiThoai from '@/models/DialogueNode';
import TrangThaiHoiThoaiNguoiChoi from '@/models/PlayerDialogueState';
import { connectToDatabase } from '@/lib/mongodb';

// Helper: lấy thông tin user từ JWT Authorization header
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyJwtToken(token);
  return decoded?.userId || null;
}

// GET: Lấy trạng thái đối thoại hiện tại hoặc khởi tạo đối thoại mẫu
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const userId = getUserIdFromRequest(request);

    const { searchParams } = new URL(request.url);
    const maNpc = searchParams.get('maNpc') || 'NPC_EMMA_LONDON_CAFE';
    const maDoThi = searchParams.get('maDoThi') || 'GRAPH_CAFE_ORDER_A2';

    // Đảm bảo có ít nhất 1 node mẫu nếu DB chưa có
    const existingNode = await NutHoiThoai.findOne({ maDoThiHoiThoai: maDoThi });
    if (!existingNode) {
      // Khởi tạo đồ thị đối thoại mẫu chuẩn CEFR A2
      const nodeEndA = await NutHoiThoai.create({
        maDoThiHoiThoai: maDoThi,
        khoaNut: 'NODE_SUCCESS_END',
        maNpc,
        tenNguoiNoi: 'Emma (London Barista)',
        noiDungTiengAnh: 'Splendid! Here is your hot cappuccino with oat milk. Have a wonderful study session!',
        laNutKetThuc: true,
        danhSachLuaChon: [],
      });

      const nodeEndB = await NutHoiThoai.create({
        maDoThiHoiThoai: maDoThi,
        khoaNut: 'NODE_FAIL_END',
        maNpc,
        tenNguoiNoi: 'Emma (London Barista)',
        noiDungTiengAnh: 'Pardon me? I could not quite understand your order. Could you repeat that more politely, please?',
        laNutKetThuc: true,
        danhSachLuaChon: [],
      });

      await NutHoiThoai.create({
        maDoThiHoiThoai: maDoThi,
        khoaNut: 'NODE_START',
        maNpc,
        tenNguoiNoi: 'Emma (London Barista)',
        noiDungTiengAnh: 'Good afternoon! Welcome to the London Focus Cafe. What can I get started for you today?',
        laNutKetThuc: false,
        danhSachLuaChon: [
          {
            maLuaChon: 'OPT_POLITE_ORDER',
            noiDungTiengAnh: 'Could I please have a hot cappuccino with oat milk?',
            laDapAnDung: true,
            nhanXetNguPhapCefr: 'Chuẩn ngữ pháp CEFR A2: Sử dụng câu hỏi gián tiếp lịch sự "Could I please have...".',
            maNutTiepTheo: nodeEndA._id,
            dieuKien: { trinhDoToiThieu: 'A1', coNhiemVuYeuCau: [] },
            hanhDong: {
              diemKinhNghiemCong: 50,
              tienXuCong: 30,
              coNhiemVuKichHoat: ['FLAG_ORDERED_COFFEE_FIRST_TIME'],
              maNhiemVuKichHoat: 'QUEST_CAFE_INTRO',
            },
          },
          {
            maLuaChon: 'OPT_IMPOLITE_ORDER',
            noiDungTiengAnh: 'Give me coffee now.',
            laDapAnDung: false,
            nhanXetNguPhapCefr: 'Chưa phù hợp: Câu mệnh lệnh trực tiếp gây cảm giác thô lỗ trong văn hóa giao tiếp tiếng Anh.',
            maNutTiepTheo: nodeEndB._id,
            dieuKien: { trinhDoToiThieu: 'A1', coNhiemVuYeuCau: [] },
            hanhDong: {
              diemKinhNghiemCong: 10,
              tienXuCong: 0,
              coNhiemVuKichHoat: [],
            },
          },
        ],
      });
    }

    if (!userId) {
      // Trả về node mẫu cho khách tham quan
      const startNode = await NutHoiThoai.findOne({ maDoThiHoiThoai: maDoThi, khoaNut: 'NODE_START' });
      return NextResponse.json({
        thanhCong: true,
        khachThamQuan: true,
        nutHienTai: startNode,
      });
    }

    // Khởi tạo hoặc tìm phiên đối thoại của người chơi
    let state = await TrangThaiHoiThoaiNguoiChoi.findOne({
      maNguoiChoi: userId,
      maNpc,
      trangThai: 'DANG_TIEN_HANH',
    }).populate('maNutHienTai');

    if (!state) {
      const khoiTao = await DialogueStateMachine.startDialogue(userId, maDoThi, maNpc, 'NODE_START');
      return NextResponse.json({
        thanhCong: true,
        trangThai: khoiTao,
      });
    }

    return NextResponse.json({
      thanhCong: true,
      trangThai: {
        maTrangThai: state._id,
        maNpc: state.maNpc,
        maDoThiDangChay: state.maDoThiDangChay,
        nutHienTai: state.maNutHienTai,
        trangThai: state.trangThai,
        phienBanXuLy: state.phienBanXuLy,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { thanhCong: false, thongDiep: error.message || 'Lỗi xử lý đối thoại.' },
      { status: 500 }
    );
  }
}

// POST: Chọn đáp án phân nhánh đối thoại
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { thanhCong: false, thongDiep: 'Yêu cầu đăng nhập để lưu trữ tiến độ đối thoại.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { maLuaChon } = body;

    if (!maLuaChon) {
      return NextResponse.json(
        { thanhCong: false, thongDiep: 'Thiếu tham số maLuaChon.' },
        { status: 400 }
      );
    }

    const ketQua = await DialogueStateMachine.selectOption(userId, maLuaChon);
    return NextResponse.json(ketQua);
  } catch (error: any) {
    const statusCode = error instanceof DialogueException ? 400 : 500;
    return NextResponse.json(
      {
        thanhCong: false,
        maLoi: error.code || 'UNKNOWN_ERROR',
        thongDiep: error.message || 'Lỗi xử lý lựa chọn đối thoại.',
      },
      { status: statusCode }
    );
  }
}

