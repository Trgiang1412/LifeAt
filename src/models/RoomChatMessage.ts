import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomChatMessage extends Document {
  roomCode: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  clientMsgId?: string;
  createdAt: Date;
}

const RoomChatMessageSchema = new Schema<IRoomChatMessage>(
  {
    roomCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    senderId: {
      type: String,
      default: '',
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: String,
      default: '',
    },
    clientMsgId: {
      type: String,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tự động xóa tin nhắn sau 24 giờ
RoomChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const RoomChatMessage: Model<IRoomChatMessage> =
  mongoose.models.RoomChatMessage ||
  mongoose.model<IRoomChatMessage>('RoomChatMessage', RoomChatMessageSchema);

export default RoomChatMessage;

