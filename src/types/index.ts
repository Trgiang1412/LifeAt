export interface Space {
  id: string;
  name: string;
  category: 'Lofi' | 'Cafe' | 'Nature' | 'City' | 'Fantasy' | 'Library';
  sourceType?: 'youtube' | 'video';
  youtubeId?: string;
  is4K?: boolean;
  videoUrl?: string;
  fallbackGradient: string;
  thumbnailUrl: string;
  description: string;
  recommendedSounds: string[];
}

export type PomodoroMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  pomodoroTime: number; // in minutes
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface SoundTrack {
  id: string;
  name: string;
  icon: string;
  type: 'rain' | 'fire' | 'waves' | 'birds' | 'cafe' | 'keyboard' | 'whitenoise' | 'lofi';
  volume: number; // 0 - 100
  isPlaying: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  status: 'Focusing' | 'Break' | 'Idle';
  isHost: boolean;
  micOn: boolean;
  camOn: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export type ActiveWidget = 'timer' | 'sounds' | 'tasks' | 'notes' | 'music' | 'chat' | 'calendar';

