import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IListMusic extends Document {
  userId?: mongoose.Types.ObjectId;
  link: string;
  thoiGianTao: Date;
  loai: string;
  ten?: string;
  thumbnailUrl?: string;
  youtubeId?: string;
}

const ListMusicSchema: Schema<IListMusic> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    link: {
      type: String,
      required: [true, 'Link âm nhạc là bắt buộc'],
      trim: true,
    },
    thoiGianTao: {
      type: Date,
      default: Date.now,
    },
    loai: {
      type: String,
      default: 'Lofi',
      index: true,
    },
    ten: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    youtubeId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ListMusic: Model<IListMusic> =
  mongoose.models.ListMusic || mongoose.model<IListMusic>('ListMusic', ListMusicSchema);

export default ListMusic;


