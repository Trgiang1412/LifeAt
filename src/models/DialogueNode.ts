import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TrinhDoCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface IDieuKienLuaChon {
  trinhDoToiThieu: TrinhDoCefr;
  coNhiemVuYeuCau: string[];
}

export interface IHanhDongLuaChon {
  diemKinhNghiemCong: number;
  tienXuCong: number;
  coNhiemVuKichHoat: string[];
  maNhiemVuKichHoat?: string;
}

export interface ILuaChonHoiThoai {
  maLuaChon: string;
  noiDungTiengAnh: string;
  laDapAnDung: boolean;
  nhanXetNguPhapCefr: string;
  maNutTiepTheo?: Types.ObjectId;
  dieuKien: IDieuKienLuaChon;
  hanhDong: IHanhDongLuaChon;
}

export interface INutHoiThoai extends Document {
  _id: Types.ObjectId;
  maDoThiHoiThoai: string;
  khoaNut: string;
  maNpc: string;
  tenNguoiNoi: string;
  noiDungTiengAnh: string;
  duongDanAmThanh?: string;
  laNutKetThuc: boolean;
  danhSachLuaChon: ILuaChonHoiThoai[];
  createdAt: Date;
  updatedAt: Date;
}

const DieuKienLuaChonSchema = new Schema<IDieuKienLuaChon>(
  {
    trinhDoToiThieu: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      default: 'A1',
    },
    coNhiemVuYeuCau: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const HanhDongLuaChonSchema = new Schema<IHanhDongLuaChon>(
  {
    diemKinhNghiemCong: {
      type: Number,
      default: 0,
      min: 0,
    },
    tienXuCong: {
      type: Number,
      default: 0,
      min: 0,
    },
    coNhiemVuKichHoat: {
      type: [String],
      default: [],
    },
    maNhiemVuKichHoat: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const LuaChonHoiThoaiSchema = new Schema<ILuaChonHoiThoai>(
  {
    maLuaChon: {
      type: String,
      required: [true, 'Mã lựa chọn là bắt buộc'],
      trim: true,
    },
    noiDungTiengAnh: {
      type: String,
      required: [true, 'Nội dung tiếng Anh là bắt buộc'],
      trim: true,
    },
    laDapAnDung: {
      type: Boolean,
      default: true,
    },
    nhanXetNguPhapCefr: {
      type: String,
      default: '',
      trim: true,
    },
    maNutTiepTheo: {
      type: Schema.Types.ObjectId,
      ref: 'NutHoiThoai',
    },
    dieuKien: {
      type: DieuKienLuaChonSchema,
      default: () => ({ trinhDoToiThieu: 'A1', coNhiemVuYeuCau: [] }),
    },
    hanhDong: {
      type: HanhDongLuaChonSchema,
      default: () => ({ diemKinhNghiemCong: 0, tienXuCong: 0, coNhiemVuKichHoat: [] }),
    },
  },
  { _id: false }
);

const NutHoiThoaiSchema = new Schema<INutHoiThoai>(
  {
    maDoThiHoiThoai: {
      type: String,
      required: [true, 'Mã đồ thị hội thoại là bắt buộc'],
      index: true,
      trim: true,
    },
    khoaNut: {
      type: String,
      required: [true, 'Khóa nút hội thoại là bắt buộc'],
      trim: true,
    },
    maNpc: {
      type: String,
      required: [true, 'Mã NPC là bắt buộc'],
      index: true,
      trim: true,
    },
    tenNguoiNoi: {
      type: String,
      required: [true, 'Tên người nói là bắt buộc'],
      trim: true,
    },
    noiDungTiengAnh: {
      type: String,
      required: [true, 'Nội dung tiếng Anh là bắt buộc'],
      trim: true,
    },
    duongDanAmThanh: {
      type: String,
      trim: true,
    },
    laNutKetThuc: {
      type: Boolean,
      default: false,
    },
    danhSachLuaChon: {
      type: [LuaChonHoiThoaiSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index
NutHoiThoaiSchema.index({ maDoThiHoiThoai: 1, khoaNut: 1 }, { unique: true });

export const NutHoiThoai: Model<INutHoiThoai> =
  mongoose.models.NutHoiThoai || mongoose.model<INutHoiThoai>('NutHoiThoai', NutHoiThoaiSchema);

export default NutHoiThoai;

