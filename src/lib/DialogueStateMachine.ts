import mongoose, { Types, ClientSession } from 'mongoose';
import NutHoiThoai, { INutHoiThoai, ILuaChonHoiThoai, TrinhDoCefr } from '@/models/DialogueNode';
import TrangThaiHoiThoaiNguoiChoi, {
  ITrangThaiHoiThoaiNguoiChoi,
  TrangThaiHoiThoai,
} from '@/models/PlayerDialogueState';
import HoSoNguoiChoi, { IHoSoNguoiChoi, TrinhDoTiengAnhCefr } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

// ============================================================================
// Custom Exception Classes (Phân cấp lỗi nghiệp vụ chi tiết)
// ============================================================================
export class DialogueException extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DialogueException';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DialogueStateNotFoundException extends DialogueException {
  constructor(maNguoiChoi: string) {
    super(
      `Không tìm thấy phiên hội thoại đang tiến hành cho người chơi [${maNguoiChoi}].`,
      'DIALOGUE_STATE_NOT_FOUND'
    );
  }
}

export class DialogueNodeNotFoundException extends DialogueException {
  constructor(maNut: string) {
    super(`Nút hội thoại [${maNut}] không tồn tại trong hệ thống đồ thị.`, 'DIALOGUE_NODE_NOT_FOUND');
  }
}

export class OptionNotFoundException extends DialogueException {
  constructor(maLuaChon: string) {
    super(`Lựa chọn [${maLuaChon}] không tồn tại trong nút hội thoại hiện tại.`, 'OPTION_NOT_FOUND');
  }
}

export class CefrLevelInsufficientException extends DialogueException {
  constructor(trinhDoHienTai: string, trinhDoYeuCau: string) {
    super(
      `Trình độ CEFR không đủ. Yêu cầu tối thiểu [${trinhDoYeuCau}], trình độ người chơi hiện tại [${trinhDoHienTai}].`,
      'CEFR_LEVEL_INSUFFICIENT'
    );
  }
}

export class QuestConditionNotMetException extends DialogueException {
  constructor(cacCoConThieu: string[]) {
    super(
      `Chưa đáp ứng điều kiện cờ nhiệm vụ bắt buộc: [${cacCoConThieu.join(', ')}].`,
      'QUEST_CONDITION_NOT_MET'
    );
  }
}

export class OptimisticLockException extends DialogueException {
  constructor(maTrangThai: string, phienBanKyVong: number) {
    super(
      `Xung đột xử lý phiên hội thoại [${maTrangThai}] tại phiên bản [${phienBanKyVong}]. Phát hiện click đúp hoặc yêu cầu trùng lặp!`,
      'CONCURRENCY_OPTIMISTIC_LOCK_CONFLICT'
    );
  }
}

// ============================================================================
// Payload Interfaces (Strict TypeScript Type Safety - No Any)
// ============================================================================
export interface IPhanThuongNhanDuoc {
  tienXuCong: number;
  diemKinhNghiemCong: number;
  coNhiemVuKichHoat: string[];
  maNhiemVuKichHoat?: string;
}

export interface IKetQuaChonLuaChonPayload {
  thanhCong: boolean;
  thongDiep: string;
  maNutTruocDo: Types.ObjectId;
  maNutTiepTheo: Types.ObjectId | null;
  trangThaiMoi: TrangThaiHoiThoai;
  laDapAnDung: boolean;
  nhanXetNguPhapCefr: string;
  phanThuong: IPhanThuongNhanDuoc;
  duLieuNutTiepTheo: INutHoiThoai | null;
  phienBanMoi: number;
}

export interface IKetQuaKhoiTaoHoiThoaiPayload {
  thanhCong: boolean;
  maTrangThai: Types.ObjectId;
  maNpc: string;
  maDoThiDangChay: string;
  nutHienTai: INutHoiThoai;
  trangThai: TrangThaiHoiThoai;
}

// ============================================================================
// CEFR Rank Hierarchy Comparison Utility
// ============================================================================
const CEFR_LEVEL_WEIGHT: Record<TrinhDoCefr, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function kiemTraTrinhDoCefrHopLe(trinhDoNguoiChoi: TrinhDoTiengAnhCefr, trinhDoToiThieu: TrinhDoCefr): boolean {
  const diemNguoiChoi = CEFR_LEVEL_WEIGHT[trinhDoNguoiChoi] ?? 1;
  const diemToiThieu = CEFR_LEVEL_WEIGHT[trinhDoToiThieu] ?? 1;
  return diemNguoiChoi >= diemToiThieu;
}

// ============================================================================
// Dialogue State Machine Class
// ============================================================================
export class DialogueStateMachine {
  /**
   * Khởi tạo hoặc tải lại phiên đối thoại với NPC
   */
  public static async startDialogue(
    maNguoiChoiInput: string | Types.ObjectId,
    maDoThiHoiThoai: string,
    maNpc: string,
    khoaNutKhoiDau: string = 'NODE_START'
  ): Promise<IKetQuaKhoiTaoHoiThoaiPayload> {
    await connectToDatabase();
    const maNguoiChoi =
      typeof maNguoiChoiInput === 'string' ? new Types.ObjectId(maNguoiChoiInput) : maNguoiChoiInput;

    const nutKhoiDau = await NutHoiThoai.findOne({
      maDoThiHoiThoai,
      khoaNut: khoaNutKhoiDau,
    });

    if (!nutKhoiDau) {
      throw new DialogueNodeNotFoundException(`${maDoThiHoiThoai}:${khoaNutKhoiDau}`);
    }

    // Upsert trạng thái hội thoại của người chơi với NPC này
    const trangThai = await TrangThaiHoiThoaiNguoiChoi.findOneAndUpdate(
      { maNguoiChoi, maNpc },
      {
        $set: {
          maDoThiDangChay: maDoThiHoiThoai,
          maNutHienTai: nutKhoiDau._id,
          trangThai: 'DANG_TIEN_HANH',
          lichSuDoiThoai: [],
        },
        $inc: { phienBanXuLy: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      thanhCong: true,
      maTrangThai: trangThai._id,
      maNpc: trangThai.maNpc,
      maDoThiDangChay: trangThai.maDoThiDangChay,
      nutHienTai: nutKhoiDau,
      trangThai: trangThai.trangThai,
    };
  }

  /**
   * Thực thi lựa chọn câu trả lời trong đối thoại:
   * 1. Khởi động ACID Transaction với MongoDB ClientSession.
   * 2. Kiểm tra điều kiện tiên quyết CEFR & cờ nhiệm vụ.
   * 3. Áp dụng Optimistic Concurrency Control (OCC) thông qua phienBanXuLy chống double-click.
   * 4. Cộng thưởng kinh tế (tiền xu, EXP) và kích hoạt cờ nhiệm vụ mới.
   * 5. Chuyển trạng thái sang nút kế tiếp hoặc kết thúc đồ thị đối thoại.
   */
  public static async selectOption(
    maNguoiChoiInput: string | Types.ObjectId,
    maLuaChonDuocChon: string
  ): Promise<IKetQuaChonLuaChonPayload> {
    await connectToDatabase();
    const maNguoiChoi =
      typeof maNguoiChoiInput === 'string' ? new Types.ObjectId(maNguoiChoiInput) : maNguoiChoiInput;

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Tìm phiên hội thoại đang diễn ra của người chơi
      const trangThaiHienTai = await TrangThaiHoiThoaiNguoiChoi.findOne({
        maNguoiChoi,
        trangThai: 'DANG_TIEN_HANH',
      }).session(session);

      if (!trangThaiHienTai) {
        throw new DialogueStateNotFoundException(maNguoiChoi.toString());
      }

      // 2. Tìm nút hội thoại hiện tại
      const nutHienTai = await NutHoiThoai.findById(trangThaiHienTai.maNutHienTai).session(session);
      if (!nutHienTai) {
        throw new DialogueNodeNotFoundException(trangThaiHienTai.maNutHienTai.toString());
      }

      // 3. Tìm thông tin lựa chọn mà người chơi chọn
      const luaChon = nutHienTai.danhSachLuaChon.find(
        (opt: ILuaChonHoiThoai) => opt.maLuaChon === maLuaChonDuocChon
      );

      if (!luaChon) {
        throw new OptionNotFoundException(maLuaChonDuocChon);
      }

      // 4. Lấy hồ sơ người chơi để kiểm tra điều kiện & cộng thưởng
      const hoSo = await HoSoNguoiChoi.findById(maNguoiChoi).session(session);
      if (!hoSo) {
        throw new DialogueException(`Hồ sơ người chơi [${maNguoiChoi}] không tồn tại.`, 'PLAYER_NOT_FOUND');
      }

      // 5. Kiểm tra điều kiện CEFR
      if (luaChon.dieuKien.trinhDoToiThieu) {
        const duDieuKienCefr = kiemTraTrinhDoCefrHopLe(
          hoSo.trinhDoTiengAnh,
          luaChon.dieuKien.trinhDoToiThieu
        );
        if (!duDieuKienCefr) {
          throw new CefrLevelInsufficientException(
            hoSo.trinhDoTiengAnh,
            luaChon.dieuKien.trinhDoToiThieu
          );
        }
      }

      // 6. Kiểm tra điều kiện cờ nhiệm vụ bắt buộc
      if (luaChon.dieuKien.coNhiemVuYeuCau && luaChon.dieuKien.coNhiemVuYeuCau.length > 0) {
        const danhSachCoHienCo = new Set(hoSo.danhSachCoNhiemVu || []);
        const cacCoThieu = luaChon.dieuKien.coNhiemVuYeuCau.filter((co) => !danhSachCoHienCo.has(co));
        if (cacCoThieu.length > 0) {
          throw new QuestConditionNotMetException(cacCoThieu);
        }
      }

      // 7. Xác định nút kế tiếp và trạng thái mới của đồ thị
      let maNutTiepTheoMoi: Types.ObjectId | null = null;
      let duLieuNutTiepTheo: INutHoiThoai | null = null;
      let trangThaiMoi: TrangThaiHoiThoai = 'DANG_TIEN_HANH';

      if (luaChon.maNutTiepTheo) {
        duLieuNutTiepTheo = await NutHoiThoai.findById(luaChon.maNutTiepTheo).session(session);
        if (duLieuNutTiepTheo) {
          maNutTiepTheoMoi = duLieuNutTiepTheo._id;
          if (duLieuNutTiepTheo.laNutKetThuc) {
            trangThaiMoi = luaChon.laDapAnDung ? 'HOAN_THANH' : 'THAT_BAI';
          }
        } else {
          trangThaiMoi = luaChon.laDapAnDung ? 'HOAN_THANH' : 'THAT_BAI';
        }
      } else if (nutHienTai.laNutKetThuc) {
        trangThaiMoi = luaChon.laDapAnDung ? 'HOAN_THANH' : 'THAT_BAI';
      } else {
        trangThaiMoi = luaChon.laDapAnDung ? 'HOAN_THANH' : 'THAT_BAI';
      }

      // 8. Áp dụng Optimistic Concurrency Control (OCC)
      const phienBanHienTai = trangThaiHienTai.phienBanXuLy;
      const phienBanMoi = phienBanHienTai + 1;

      const trangThaiCapNhat = await TrangThaiHoiThoaiNguoiChoi.findOneAndUpdate(
        {
          _id: trangThaiHienTai._id,
          phienBanXuLy: phienBanHienTai, // Điều kiện phiên bản: Chặn đứng hoàn toàn race condition / click đúp
        },
        {
          $set: {
            maNutHienTai: maNutTiepTheoMoi || trangThaiHienTai.maNutHienTai,
            trangThai: trangThaiMoi,
            phienBanXuLy: phienBanMoi,
          },
          $push: {
            lichSuDoiThoai: {
              maNut: nutHienTai._id,
              maLuaChonDaChon: luaChon.maLuaChon,
              thoiDiemChon: new Date(),
            },
          },
        },
        { session, new: true }
      );

      if (!trangThaiCapNhat) {
        throw new OptimisticLockException(trangThaiHienTai._id.toString(), phienBanHienTai);
      }

      // 9. Cập nhật hồ sơ kinh tế & phần thưởng người chơi
      const diemKinhNghiemCong = luaChon.hanhDong.diemKinhNghiemCong || 0;
      const tienXuCong = luaChon.hanhDong.tienXuCong || 0;
      const coKichHoat = luaChon.hanhDong.coNhiemVuKichHoat || [];

      const hoSoUpdateOps: mongoose.UpdateQuery<IHoSoNguoiChoi> = {
        $inc: {
          tien: tienXuCong,
          diemKinhNghiem: diemKinhNghiemCong,
          'thongKeNhiemVu.tongDiemKinhNghiemTichLuy': diemKinhNghiemCong,
          ...(trangThaiMoi === 'HOAN_THANH' ? { 'thongKeNhiemVu.soHoiThoaiThanhCong': 1 } : {}),
        },
      };

      if (coKichHoat.length > 0) {
        hoSoUpdateOps.$addToSet = {
          danhSachCoNhiemVu: { $each: coKichHoat },
        };
      }

      await HoSoNguoiChoi.findByIdAndUpdate(maNguoiChoi, hoSoUpdateOps, { session });

      // 10. Hoàn tất giao dịch ACID
      await session.commitTransaction();

      return {
        thanhCong: true,
        thongDiep: luaChon.laDapAnDung ? 'Lựa chọn chính xác!' : 'Đáp án chưa chuẩn ngữ pháp CEFR.',
        maNutTruocDo: nutHienTai._id,
        maNutTiepTheo: maNutTiepTheoMoi,
        trangThaiMoi,
        laDapAnDung: luaChon.laDapAnDung,
        nhanXetNguPhapCefr: luaChon.nhanXetNguPhapCefr,
        phanThuong: {
          tienXuCong,
          diemKinhNghiemCong,
          coNhiemVuKichHoat: coKichHoat,
          maNhiemVuKichHoat: luaChon.hanhDong.maNhiemVuKichHoat,
        },
        duLieuNutTiepTheo,
        phienBanMoi,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default DialogueStateMachine;

