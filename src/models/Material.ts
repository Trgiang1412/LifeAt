import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  ten: string;
  giaTien: number;
  thoiGianTao: Date;
}

const MaterialSchema: Schema<IMaterial> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ten: {
      type: String,
      required: [true, 'Tên vật phẩm/nguyên liệu là bắt buộc'],
      trim: true,
    },
    giaTien: {
      type: Number,
      required: [true, 'Giá tiền là bắt buộc'],
      default: 0,
      min: 0,
    },
    thoiGianTao: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Material: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;

