import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INoiThatItem {
  maVatPham: string;
  toaDoLuoiX: number;
  toaDoLuoiZ: number;
  gocXoayDo: number; // 0, 90, 180, 270
}

export interface INhaNguoiChoi extends Document {
  _id: Types.ObjectId;
  maNguoiChoi: Types.ObjectId;
  maLoDat: string;
  capDoNha: number;
  capDoGara: number;
  moHinhNgoaiThat: string;
  kichThuocLuoiNoiThat: [number, number]; // [chieuRong, chieuDai]
  danhSachNoiThat: INoiThatItem[];
  danhSachPhuongTienSoHuu: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoiThatItemSchema = new Schema<INoiThatItem>(
  {
    maVatPham: {
      type: String,
      required: true,
      trim: true,
    },
    toaDoLuoiX: {
      type: Number,
      required: true,
      min: 0,
    },
    toaDoLuoiZ: {
      type: Number,
      required: true,
      min: 0,
    },
    gocXoayDo: {
      type: Number,
      default: 0,
      enum: [0, 90, 180, 270],
    },
  },
  { _id: false }
);

const NhaNguoiChoiSchema = new Schema<INhaNguoiChoi>(
  {
    maNguoiChoi: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mã người chơi là bắt buộc'],
      unique: true,
      index: true,
    },
    maLoDat: {
      type: String,
      required: [true, 'Mã lô đất là bắt buộc'],
      trim: true,
      default: 'PLOT_A01_SUBURB',
    },
    capDoNha: {
      type: Number,
      default: 1,
      min: 1,
    },
    capDoGara: {
      type: Number,
      default: 0,
      min: 0,
    },
    moHinhNgoaiThat: {
      type: String,
      default: 'HOUSE_MODEL_COZY_COTTAGE_V1',
      trim: true,
    },
    kichThuocLuoiNoiThat: {
      type: [Number],
      validate: {
        validator: function (val: number[]) {
          return val.length === 2 && val.every((n) => typeof n === 'number' && n > 0);
        },
        message: 'Kích thước lưới nội thất phải là mảng gồm 2 số dương [chieuRong, chieuDai]',
      },
      default: [10, 10],
    },
    danhSachNoiThat: {
      type: [NoiThatItemSchema],
      default: [],
    },
    danhSachPhuongTienSoHuu: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const NhaNguoiChoi: Model<INhaNguoiChoi> =
  mongoose.models.NhaNguoiChoi || mongoose.model<INhaNguoiChoi>('NhaNguoiChoi', NhaNguoiChoiSchema);

export default NhaNguoiChoi;

