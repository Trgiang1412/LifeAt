import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TrangThaiHoiThoai = 'DANG_TIEN_HANH' | 'HOAN_THANH' | 'THAT_BAI';

export interface ILichSuDoiThoaiItem {
  maNut: Types.ObjectId;
  maLuaChonDaChon: string;
  thoiDiemChon: Date;
}

export interface ITrangThaiHoiThoaiNguoiChoi extends Document {
  _id: Types.ObjectId;
  maNguoiChoi: Types.ObjectId;
  maNpc: string;
  maDoThiDangChay: string;
  maNutHienTai: Types.ObjectId;
  trangThai: TrangThaiHoiThoai;
  lichSuDoiThoai: ILichSuDoiThoaiItem[];
  phienBanXuLy: number;
  createdAt: Date;
  updatedAt: Date;
}

const LichSuDoiThoaiItemSchema = new Schema<ILichSuDoiThoaiItem>(
  {
    maNut: {
      type: Schema.Types.ObjectId,
      ref: 'NutHoiThoai',
      required: true,
    },
    maLuaChonDaChon: {
      type: String,
      required: true,
      trim: true,
    },
    thoiDiemChon: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const TrangThaiHoiThoaiNguoiChoiSchema = new Schema<ITrangThaiHoiThoaiNguoiChoi>(
  {
    maNguoiChoi: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mã người chơi là bắt buộc'],
      index: true,
    },
    maNpc: {
      type: String,
      required: [true, 'Mã NPC là bắt buộc'],
      trim: true,
    },
    maDoThiDangChay: {
      type: String,
      required: [true, 'Mã đồ thị đang chạy là bắt buộc'],
      trim: true,
    },
    maNutHienTai: {
      type: Schema.Types.ObjectId,
      ref: 'NutHoiThoai',
      required: [true, 'Mã nút hiện tại là bắt buộc'],
    },
    trangThai: {
      type: String,
      enum: ['DANG_TIEN_HANH', 'HOAN_THANH', 'THAT_BAI'],
      default: 'DANG_TIEN_HANH',
    },
    lichSuDoiThoai: {
      type: [LichSuDoiThoaiItemSchema],
      default: [],
    },
    phienBanXuLy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique composite index: Một người chơi tại một thời điểm chỉ có 1 trạng thái phiên với 1 NPC
TrangThaiHoiThoaiNguoiChoiSchema.index({ maNguoiChoi: 1, maNpc: 1 }, { unique: true });

export const TrangThaiHoiThoaiNguoiChoi: Model<ITrangThaiHoiThoaiNguoiChoi> =
  mongoose.models.TrangThaiHoiThoaiNguoiChoi ||
  mongoose.model<ITrangThaiHoiThoaiNguoiChoi>('TrangThaiHoiThoaiNguoiChoi', TrangThaiHoiThoaiNguoiChoiSchema);

export default TrangThaiHoiThoaiNguoiChoi;

