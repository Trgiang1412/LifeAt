import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduleItem extends Document {
  userId?: any;
  roomCode?: string;
  title: string;
  startTime: string; // ví dụ: "09:00"
  endTime: string;   // ví dụ: "10:30"
  type: 'focus' | 'break' | 'meeting';
  done: boolean;
  order: number;
  dateStr?: string;  // ví dụ "2026-11-07"
  createdAt?: Date;
  updatedAt?: Date;
}

const ScheduleItemSchema: Schema<IScheduleItem> = new Schema(
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
    title: {
      type: String,
      required: [true, 'Tiêu đề lịch trình là bắt buộc'],
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    endTime: {
      type: String,
      required: true,
      default: '10:00',
    },
    type: {
      type: String,
      enum: ['focus', 'break', 'meeting'],
      default: 'focus',
    },
    done: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    dateStr: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduleItem: Model<IScheduleItem> =
  mongoose.models.ScheduleItem || mongoose.model<IScheduleItem>('ScheduleItem', ScheduleItemSchema);

export default ScheduleItem;

