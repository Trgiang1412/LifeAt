import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import NhaNguoiChoi, { ensureDefaultStarterHouse } from '@/models/PlayerHouse';
import { verifyJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { thanhCong: false, message: 'Vui lòng đăng nhập để thực hiện thao tác này.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { thanhCong: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    await connectToDatabase();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { thanhCong: false, message: 'Không tìm thấy tài khoản người chơi.' },
        { status: 404 }
      );
    }

    await ensureDefaultStarterHouse(user._id, user.tenDangNhap, false);
    const house = await NhaNguoiChoi.findOne({ maNguoiChoi: user._id });

    // 1. NHẬN THƯỞNG XU & EXP (Câu cá trả lời tiếng Anh, Làm thêm tại các quán)
    if (action === 'reward') {
      const coins = Math.max(0, Number(body.coins) || 0);
      const exp = Math.max(0, Number(body.exp) || 0);

      user.tien = (user.tien || 0) + coins;
      user.diemKinhNghiem = (user.diemKinhNghiem || 0) + exp;
      if (user.thongKeNhiemVu) {
        user.thongKeNhiemVu.soHoiThoaiThanhCong = (user.thongKeNhiemVu.soHoiThoaiThanhCong || 0) + 1;
        user.thongKeNhiemVu.tongDiemKinhNghiemTichLuy =
          (user.thongKeNhiemVu.tongDiemKinhNghiemTichLuy || 0) + exp;
      }
      await user.save();

      return NextResponse.json({
        thanhCong: true,
        tien: user.tien,
        diemKinhNghiem: user.diemKinhNghiem,
      });
    }

    // 2. MUA NỘI THẤT BẰNG XU TRONG NHÀ
    if (action === 'buy_furniture') {
      const { maVatPham, tenVatPham, price, toaDoLuoiX, toaDoLuoiZ, gocXoayDo } = body;
      const cost = Math.max(0, Number(price) || 0);

      if ((user.tien || 0) < cost) {
        return NextResponse.json(
          {
            thanhCong: false,
            message: `Bạn không đủ Xu! Cần ${cost} Xu nhưng hiện có ${user.tien || 0} Xu. Hãy đi câu cá hoặc làm việc tại các quán để kiếm thêm Xu nhé!`,
          },
          { status: 400 }
        );
      }

      user.tien = (user.tien || 0) - cost;
      user.diemKinhNghiem = (user.diemKinhNghiem || 0) + 15;
      await user.save();

      if (house) {
        house.danhSachNoiThat.push({
          maVatPham: String(maVatPham),
          tenVatPham: String(tenVatPham || maVatPham),
          toaDoLuoiX: Math.min(9, Math.max(0, Number(toaDoLuoiX) || 4)),
          toaDoLuoiZ: Math.min(9, Math.max(0, Number(toaDoLuoiZ) || 4)),
          gocXoayDo: [0, 90, 180, 270].includes(Number(gocXoayDo)) ? Number(gocXoayDo) : 0,
        });
        await house.save();
      }

      return NextResponse.json({
        thanhCong: true,
        tien: user.tien,
        diemKinhNghiem: user.diemKinhNghiem,
        danhSachNoiThat: house?.danhSachNoiThat || [],
      });
    }

    // 3. CẬP NHẬT VỊ TRÍ / XOAY / XÓA NỘI THẤT TRONG NHÀ
    if (action === 'update_furniture') {
      const { danhSachNoiThat, mauTuong, mauMai } = body;
      if (house && Array.isArray(danhSachNoiThat)) {
        house.danhSachNoiThat = danhSachNoiThat.map((item: any) => ({
          maVatPham: String(item.maVatPham),
          tenVatPham: String(item.tenVatPham || item.maVatPham),
          toaDoLuoiX: Math.min(9, Math.max(0, Number(item.toaDoLuoiX) || 0)),
          toaDoLuoiZ: Math.min(9, Math.max(0, Number(item.toaDoLuoiZ) || 0)),
          gocXoayDo: [0, 90, 180, 270].includes(Number(item.gocXoayDo)) ? Number(item.gocXoayDo) : 0,
        }));
        if (mauTuong) house.mauTuong = String(mauTuong);
        if (mauMai) house.mauMai = String(mauMai);
        await house.save();
      }

      return NextResponse.json({
        thanhCong: true,
        danhSachNoiThat: house?.danhSachNoiThat || [],
      });
    }

    // 4. MUA ĐỒ ĂN UỐNG, QUẦN ÁO, XE CỘ TẠI CÁC QUÁN
    if (action === 'buy_shop_item') {
      const { code, price, category, expReward } = body;
      const cost = Math.max(0, Number(price) || 0);
      const expGain = Math.max(0, Number(expReward) || 10);

      if ((user.tien || 0) < cost) {
        return NextResponse.json(
          {
            thanhCong: false,
            message: `Không đủ Xu! Món này có giá ${cost} Xu (bạn đang có ${user.tien || 0} Xu). Hãy chuyển sang tab "Làm Việc Kiếm Tiền" hoặc đi câu cá nhé!`,
          },
          { status: 400 }
        );
      }

      user.tien = (user.tien || 0) - cost;
      user.diemKinhNghiem = (user.diemKinhNghiem || 0) + expGain;

      const loaiMap: Record<string, string> = {
        food_drink: 'tieu_hao',
        clothing: 'trang_bi',
        vehicle: 'phuong_tien',
      };
      const loaiVatPham = loaiMap[category] || 'tieu_hao';

      const existingItem = user.tuiDo.find((i) => i.maVatPham === code);
      if (existingItem) {
        existingItem.soLuong += 1;
      } else {
        user.tuiDo.push({
          maVatPham: String(code),
          loaiVatPham,
          soLuong: 1,
        });
      }

      await user.save();

      if (category === 'vehicle' && house) {
        if (!house.danhSachPhuongTienSoHuu.includes(String(code))) {
          house.danhSachPhuongTienSoHuu.push(String(code));
          await house.save();
        }
      }

      return NextResponse.json({
        thanhCong: true,
        tien: user.tien,
        diemKinhNghiem: user.diemKinhNghiem,
        tuiDo: user.tuiDo,
        danhSachPhuongTienSoHuu: house?.danhSachPhuongTienSoHuu || ['SKATEBOARD_STARTER'],
      });
    }

    return NextResponse.json(
      { thanhCong: false, message: 'Hành động không hợp lệ.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Lỗi xử lý world action:', error);
    return NextResponse.json(
      { thanhCong: false, message: error.message || 'Lỗi máy chủ.' },
      { status: 500 }
    );
  }
}

