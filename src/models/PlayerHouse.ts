import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { HOUSE_PLOTS, pickRandomAvailablePlot } from '@/data/housePlots';

export interface INoiThatItem {
  maVatPham: string;
  tenVatPham?: string;
  toaDoLuoiX: number;
  toaDoLuoiZ: number;
  gocXoayDo: number; // 0, 90, 180, 270
}

export interface INhaNguoiChoi extends Document {
  _id: Types.ObjectId;
  maNguoiChoi: Types.ObjectId;
  tenNha: string;
  loaiNha: string; // 'Nhà Cấp 4 Mái Ngói'
  maLoDat: string;
  capDoNha: number;
  capDoGara: number;
  moHinhNgoaiThat: string;
  mauTuong: string;
  mauMai: string;
  kichThuocLuoiNoiThat: [number, number]; // [chieuRong, chieuDai]
  danhSachNoiThat: INoiThatItem[];
  danhSachPhuongTienSoHuu: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_STARTER_FURNITURE: INoiThatItem[] = [
  { maVatPham: 'GIUONG_GO_DON', tenVatPham: 'Giường Gỗ Đơn Ấm Cúng', toaDoLuoiX: 2, toaDoLuoiZ: 2, gocXoayDo: 0 },
  { maVatPham: 'BAN_HOC_DEN_LED', tenVatPham: 'Bàn Học Tiếng Anh & Laptop', toaDoLuoiX: 7, toaDoLuoiZ: 2, gocXoayDo: 0 },
  { maVatPham: 'KE_SACH_OXFORD', tenVatPham: 'Kệ Sách Gỗ Sồi', toaDoLuoiX: 8, toaDoLuoiZ: 2, gocXoayDo: 0 },
  { maVatPham: 'SOFA_GO_PHONG_KHACH', tenVatPham: 'Bộ Trường Kỷ & Bàn Trà', toaDoLuoiX: 3, toaDoLuoiZ: 6, gocXoayDo: 90 },
  { maVatPham: 'KE_TIVI_CO_DIEN', tenVatPham: 'Kệ Tivi Gỗ & Loa Lo-Fi', toaDoLuoiX: 7, toaDoLuoiZ: 6, gocXoayDo: 270 },
  { maVatPham: 'THAM_DET_THO_CAM', tenVatPham: 'Thảm Trải Sàn Phòng Khách', toaDoLuoiX: 5, toaDoLuoiZ: 6, gocXoayDo: 0 },
];

const NoiThatItemSchema = new Schema<INoiThatItem>(
  {
    maVatPham: {
      type: String,
      required: true,
      trim: true,
    },
    tenVatPham: {
      type: String,
      default: '',
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
    tenNha: {
      type: String,
      default: 'Nhà Cấp 4 Khởi Đầu',
      trim: true,
    },
    loaiNha: {
      type: String,
      default: 'Nhà Cấp 4 Mái Ngói',
      trim: true,
    },
    maLoDat: {
      type: String,
      required: [true, 'Mã lô đất là bắt buộc'],
      trim: true,
      default: 'PLOT_CAP4_01',
    },
    capDoNha: {
      type: Number,
      default: 1,
      min: 1,
    },
    capDoGara: {
      type: Number,
      default: 1,
      min: 0,
    },
    moHinhNgoaiThat: {
      type: String,
      default: 'NHA_CAP_4_VN_REALISTIC',
      trim: true,
    },
    mauTuong: {
      type: String,
      default: '#f5ebd6',
    },
    mauMai: {
      type: String,
      default: '#b93829',
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
      default: () => DEFAULT_STARTER_FURNITURE,
    },
    danhSachPhuongTienSoHuu: {
      type: [String],
      default: ['SKATEBOARD_STARTER'],
    },
  },
  {
    timestamps: true,
  }
);

export const NhaNguoiChoi: Model<INhaNguoiChoi> =
  mongoose.models.NhaNguoiChoi || mongoose.model<INhaNguoiChoi>('NhaNguoiChoi', NhaNguoiChoiSchema);

/**
 * Đảm bảo mọi người chơi khi đăng ký hoặc đăng nhập đều được cấp 1 Ngôi Nhà Cấp 4
 * tại 1 lô đất ngẫu nhiên không trùng với người chơi khác.
 */
export async function ensureDefaultStarterHouse(
  userId: Types.ObjectId | string,
  tenDangNhap: string,
  randomizeOnLogin: boolean = false
) {
  try {
    // Lấy danh sách các lô đất đang được người chơi khác sử dụng
    const otherHouses = await NhaNguoiChoi.find({
      maNguoiChoi: { $ne: userId },
    })
      .select('maLoDat')
      .lean();

    const occupiedPlotCodes = otherHouses.map((h: any) => h.maLoDat).filter(Boolean);
    const validPlotCodes = new Set(HOUSE_PLOTS.map((p) => p.maLoDat));

    let house = await NhaNguoiChoi.findOne({ maNguoiChoi: userId });

    if (!house) {
      const randomPlot = pickRandomAvailablePlot(occupiedPlotCodes);
      house = await NhaNguoiChoi.create({
        maNguoiChoi: userId,
        tenNha: `Nhà Cấp 4 của ${tenDangNhap}`,
        loaiNha: 'Nhà Cấp 4 Mái Ngói',
        maLoDat: randomPlot.maLoDat,
        capDoNha: 1,
        capDoGara: 1,
        moHinhNgoaiThat: 'NHA_CAP_4_VN_REALISTIC',
        mauTuong: randomPlot.defaultWallColor,
        mauMai: randomPlot.defaultRoofColor,
        kichThuocLuoiNoiThat: [10, 10],
        danhSachNoiThat: DEFAULT_STARTER_FURNITURE,
        danhSachPhuongTienSoHuu: ['SKATEBOARD_STARTER'],
      });
    } else if (
      randomizeOnLogin ||
      !validPlotCodes.has(house.maLoDat) ||
      occupiedPlotCodes.includes(house.maLoDat)
    ) {
      // Khi đăng nhập hoặc khi lô đất cũ bị trùng/không hợp lệ -> Random 1 lô đất mới không trùng
      const randomPlot = pickRandomAvailablePlot(occupiedPlotCodes);
      house.maLoDat = randomPlot.maLoDat;
      await house.save();
    }

    return {
      id: house._id.toString(),
      tenNha: house.tenNha || `Nhà Cấp 4 của ${tenDangNhap}`,
      loaiNha: house.loaiNha || 'Nhà Cấp 4 Mái Ngói',
      maLoDat: house.maLoDat,
      capDoNha: house.capDoNha,
      moHinhNgoaiThat: house.moHinhNgoaiThat,
      mauTuong: house.mauTuong || '#f5ebd6',
      mauMai: house.mauMai || '#b93829',
      kichThuocLuoiNoiThat: house.kichThuocLuoiNoiThat,
      danhSachNoiThat: house.danhSachNoiThat,
      danhSachPhuongTienSoHuu: house.danhSachPhuongTienSoHuu || ['SKATEBOARD_STARTER'],
    };
  } catch (err) {
    console.error('Lỗi khởi tạo Nhà Cấp 4 mặc định:', err);
    const randomPlot = pickRandomAvailablePlot([]);
    return {
      id: 'default-cap4',
      tenNha: `Nhà Cấp 4 của ${tenDangNhap}`,
      loaiNha: 'Nhà Cấp 4 Mái Ngói',
      maLoDat: randomPlot.maLoDat,
      capDoNha: 1,
      moHinhNgoaiThat: 'NHA_CAP_4_VN_REALISTIC',
      mauTuong: randomPlot.defaultWallColor,
      mauMai: randomPlot.defaultRoofColor,
      kichThuocLuoiNoiThat: [10, 10] as [number, number],
      danhSachNoiThat: DEFAULT_STARTER_FURNITURE,
      danhSachPhuongTienSoHuu: ['SKATEBOARD_STARTER'],
    };
  }
}

export default NhaNguoiChoi;
