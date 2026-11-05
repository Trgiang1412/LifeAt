import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomTimer {
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  timeLeft: number;
  isActive: boolean;
  lastUpdated: number;
}

export interface IRoomParticipant {
  userId?: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  joinedAt: Date;
  lastSeen: Date;
}

export interface IRoomState extends Document {
  roomCode: string;
  hostId: string;
  hostName: string;
  spaceId: string;
  timer: IRoomTimer;
  participants: IRoomParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomTimerSchema = new Schema<IRoomTimer>(
  {
    mode: {
      type: String,
      enum: ['pomodoro', 'shortBreak', 'longBreak'],
      default: 'pomodoro',
    },
    timeLeft: {
      type: Number,
      default: 25 * 60,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Number,
      default: () => Date.now(),
    },
  },
  { _id: false }
);

const RoomParticipantSchema = new Schema<IRoomParticipant>(
  {
    userId: { type: String },
    name: { type: String, required: true },
    avatar: { type: String },
    isHost: { type: Boolean, default: false },
    joinedAt: { type: Date, default: () => new Date() },
    lastSeen: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const RoomStateSchema = new Schema<IRoomState>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    hostId: {
      type: String,
      default: '',
    },
    hostName: {
      type: String,
      default: "Trường's Room",
    },
    spaceId: {
      type: String,
      default: 'yt-lofi-room-chill',
    },
    timer: {
      type: RoomTimerSchema,
      default: () => ({
        mode: 'pomodoro',
        timeLeft: 25 * 60,
        isActive: false,
        lastUpdated: Date.now(),
      }),
    },
    participants: {
      type: [RoomParticipantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const RoomState: Model<IRoomState> =
  mongoose.models.RoomState || mongoose.model<IRoomState>('RoomState', RoomStateSchema);

export default RoomState;

