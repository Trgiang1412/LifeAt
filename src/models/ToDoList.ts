import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToDoList extends Document {
  userId?: any;
  roomCode?: string;
  noiDung: string;
  trangThai: 'chua_lam' | 'dang_lam' | 'hoan_thanh';
  mucDo?: 'thap' | 'trung_binh' | 'cao';
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  thoiGianTao: Date;
  thoiGianHoanThanh?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ToDoListSchema: Schema<IToDoList> = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      ref: 'User',
      index: true,
      default: null,
    },
    roomCode: {
      type: String,
      index: true,
      default: '',
    },
    noiDung: {
      type: String,
      required: [true, 'Nội dung công việc là bắt buộc'],
      trim: true,
    },
    trangThai: {
      type: String,
      enum: ['chua_lam', 'dang_lam', 'hoan_thanh'],
      default: 'chua_lam',
    },
    mucDo: {
      type: String,
      enum: ['thap', 'trung_binh', 'cao'],
      default: 'trung_binh',
    },
    estimatedPomodoros: {
      type: Number,
      default: 1,
    },
    completedPomodoros: {
      type: Number,
      default: 0,
    },
    thoiGianTao: {
      type: Date,
      default: Date.now,
    },
    thoiGianHoanThanh: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ToDoList: Model<IToDoList> =
  mongoose.models.ToDoList || mongoose.model<IToDoList>('ToDoList', ToDoListSchema);

export default ToDoList;
