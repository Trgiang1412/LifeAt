import mongoose, { Schema, Document, Model } from 'mongoose';
import type { EnglishDatabaseSourceId, MultiSourceEnglishItem } from '@/data/englishQuestionDatabase';

export interface ICauHoiTiengAnh extends Document {
  maCauHoi: string;
  nguonDuLieu: EnglishDatabaseSourceId;
  baiHocHoacChuDe: string;
  trinhDoCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  doKho: 'easy' | 'medium' | 'hard';
  loaiCauHoi: 'multiple_choice' | 'essay_fill';
  danhMucDiaDiem: MultiSourceEnglishItem['category'];
  noiDungCauHoiEn: string;
  goiYTiengViet: string;
  danhSachDapAn: string[];
  dapAnDung: string;
  cacDapAnChapNhan: string[];
  giaiThichChiTietVi: string;
  thuongXu: number;
  thuongExp: number;
  createdAt: Date;
  updatedAt: Date;
}

const CauHoiTiengAnhSchema = new Schema<ICauHoiTiengAnh>(
  {
    maCauHoi: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    nguonDuLieu: {
      type: String,
      enum: [
        'DESTINATION_B1_B2',
        'CAMBRIDGE_GRAMMAR',
        'OXFORD_3000_VOCAB',
        'IELTS_ACADEMIC',
        'TOEIC_BUSINESS',
        'BRITISH_COUNCIL_CULTURE',
      ],
      default: 'DESTINATION_B1_B2',
      index: true,
    },
    baiHocHoacChuDe: {
      type: String,
      required: true,
      trim: true,
    },
    trinhDoCefr: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1'],
      default: 'B1',
    },
    doKho: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    loaiCauHoi: {
      type: String,
      enum: ['multiple_choice', 'essay_fill'],
      default: 'multiple_choice',
    },
    danhMucDiaDiem: {
      type: String,
      default: 'daily_social',
      index: true,
    },
    noiDungCauHoiEn: {
      type: String,
      required: true,
      trim: true,
    },
    goiYTiengViet: {
      type: String,
      default: '',
      trim: true,
    },
    danhSachDapAn: {
      type: [String],
      default: [],
    },
    dapAnDung: {
      type: String,
      required: true,
      trim: true,
    },
    cacDapAnChapNhan: {
      type: [String],
      default: [],
    },
    giaiThichChiTietVi: {
      type: String,
      default: '',
      trim: true,
    },
    thuongXu: {
      type: Number,
      default: 45,
    },
    thuongExp: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

export const CauHoiTiengAnh: Model<ICauHoiTiengAnh> =
  mongoose.models.CauHoiTiengAnh ||
  mongoose.model<ICauHoiTiengAnh>('CauHoiTiengAnh', CauHoiTiengAnhSchema);

export default CauHoiTiengAnh;

