import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotes extends Document {
  userId?: string;
  taiKhoan?: string;
  roomCode?: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotesSchema: Schema<INotes> = new Schema(
  {
    userId: {
      type: String,
      index: true,
      default: '',
    },
    taiKhoan: {
      type: String,
      index: true,
      default: '',
    },
    roomCode: {
      type: String,
      index: true,
      default: '',
    },
    title: {
      type: String,
      default: 'Scratchpad Notes',
    },
    content: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Notes: Model<INotes> =
  mongoose.models.Notes || mongoose.model<INotes>('Notes', NotesSchema);

export default Notes;

