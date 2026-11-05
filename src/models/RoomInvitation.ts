import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRoomInvitation extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRoomId: string;
  senderRoomName: string;
  roomUrl: string;
  recipientId: Types.ObjectId;
  recipientUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const RoomInvitationSchema = new Schema<IRoomInvitation>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRoomId: {
      type: String,
      required: true,
      trim: true,
    },
    senderRoomName: {
      type: String,
      required: true,
      trim: true,
    },
    roomUrl: {
      type: String,
      required: true,
      trim: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: Tự động dọn dẹp các lời mời sau 2 giờ
RoomInvitationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

export const RoomInvitation: Model<IRoomInvitation> =
  mongoose.models.RoomInvitation ||
  mongoose.model<IRoomInvitation>('RoomInvitation', RoomInvitationSchema);

export default RoomInvitation;

