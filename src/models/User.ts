import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TrinhDoTiengAnhCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ITuiDoItem {
  maVatPham: string;
  loaiVatPham: string; // 'vat_pham_nha_cua' | 'trang_bi' | 'tieu_hao' | 'phuong_tien'
  soLuong: number;
}

export interface IThongKeNhiemVu {
  soNhiemVuDaHoanThanh: number;
  soHoiThoaiThanhCong: number;
  tongDiemKinhNghiemTichLuy: number;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  taiKhoan: string;
  matKhau: string;
  tenDangNhap: string;
  tien: number;
  roomId: string;
  // Các trường mới cho game học tiếng Anh & kinh tế
  diemKinhNghiem: number;
  trinhDoTiengAnh: TrinhDoTiengAnhCefr;
  danhSachCoNhiemVu: string[];
  tuiDo: ITuiDoItem[];
  thongKeNhiemVu: IThongKeNhiemVu;
  createdAt: Date;
  updatedAt: Date;
}

// Alias định danh hồ sơ người chơi theo kiến trúc dự án game
export type IHoSoNguoiChoi = IUser;

const TuiDoItemSchema = new Schema<ITuiDoItem>(
  {
    maVatPham: {
      type: String,
      required: true,
      trim: true,
    },
    loaiVatPham: {
      type: String,
      required: true,
      trim: true,
      default: 'vat_pham_nha_cua',
    },
    soLuong: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const ThongKeNhiemVuSchema = new Schema<IThongKeNhiemVu>(
  {
    soNhiemVuDaHoanThanh: {
      type: Number,
      default: 0,
      min: 0,
    },
    soHoiThoaiThanhCong: {
      type: Number,
      default: 0,
      min: 0,
    },
    tongDiemKinhNghiemTichLuy: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
  {
    taiKhoan: {
      type: String,
      required: [true, 'Tài khoản là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    matKhau: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
    },
    tenDangNhap: {
      type: String,
      required: [true, 'Tên đăng nhập là bắt buộc'],
      trim: true,
    },
    tien: {
      type: Number,
      default: 100, // Tặng sẵn 100 xu khởi đầu
      min: 0,
    },
    roomId: {
      type: String,
      default: () => 'M7KQ-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    },
    // Trường kinh tế & kỹ năng ngôn ngữ
    diemKinhNghiem: {
      type: Number,
      default: 0,
      min: 0,
    },
    trinhDoTiengAnh: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      default: 'A1',
    },
    danhSachCoNhiemVu: {
      type: [String],
      default: [],
    },
    tuiDo: {
      type: [TuiDoItemSchema],
      default: [],
    },
    thongKeNhiemVu: {
      type: ThongKeNhiemVuSchema,
      default: () => ({
        soNhiemVuDaHoanThanh: 0,
        soHoiThoaiThanhCong: 0,
        tongDiemKinhNghiemTichLuy: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Export alias HoSoNguoiChoi đồng nhất với nghiệp vụ game
export const HoSoNguoiChoi: Model<IHoSoNguoiChoi> = User;

export default User;
