'use client';

import React from 'react';
import { Box } from '@mui/material';
import PomodoroWidget from '@/components/widgets/PomodoroWidget';
import SoundscapeWidget from '@/components/widgets/SoundscapeWidget';
import TodoWidget from '@/components/widgets/TodoWidget';
import NotesWidget from '@/components/widgets/NotesWidget';
import MusicPlayerWidget from '@/components/widgets/MusicPlayerWidget';
import RoomChatWidget from '@/components/widgets/RoomChatWidget';
import CalendarWidget from '@/components/widgets/CalendarWidget';
import { ActiveWidget, PomodoroSettings, PomodoroMode } from '@/types';

interface WidgetsContainerProps {
  activeWidgets: Set<ActiveWidget>;
  onCloseWidget: (w: ActiveWidget) => void;
  settings: PomodoroSettings;
  hostName: string;
  roomCode: string;
  isZenMode: boolean;
  isHost?: boolean;
  syncedTimer?: {
    mode: PomodoroMode;
    timeLeft: number;
    isActive: boolean;
    lastUpdated: number;
  } | null;
  onTimerUpdate?: (timer: {
    mode: PomodoroMode;
    timeLeft: number;
    isActive: boolean;
    lastUpdated: number;
  }) => void;
  onLeaveRoom?: () => void;
  participantsList?: any[];
}

export default function WidgetsContainer({
  activeWidgets,
  onCloseWidget,
  settings,
  hostName,
  roomCode,
  isZenMode,
  isHost = true,
  syncedTimer,
  onTimerUpdate,
  onLeaveRoom,
  participantsList,
}: WidgetsContainerProps) {
  if (isZenMode) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: { xs: 2, md: 5 },
        pt: { xs: 10, md: 10 },
        pb: { xs: 14, md: 14 },
        overflowY: 'auto',
      }}
    >
      {activeWidgets.has('timer') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <PomodoroWidget
            onClose={() => onCloseWidget('timer')}
            settings={settings}
            isHost={isHost}
            hostName={hostName}
            syncedTimer={syncedTimer}
            onTimerUpdate={onTimerUpdate}
          />
        </Box>
      )}

      {activeWidgets.has('sounds') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <SoundscapeWidget onClose={() => onCloseWidget('sounds')} />
        </Box>
      )}

      {activeWidgets.has('tasks') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <TodoWidget onClose={() => onCloseWidget('tasks')} roomCode={roomCode} />
        </Box>
      )}

      {activeWidgets.has('notes') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <NotesWidget onClose={() => onCloseWidget('notes')} roomCode={roomCode} />
        </Box>
      )}

      {activeWidgets.has('music') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <MusicPlayerWidget onClose={() => onCloseWidget('music')} />
        </Box>
      )}

      {activeWidgets.has('chat') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <RoomChatWidget
            onClose={() => onCloseWidget('chat')}
            hostName={hostName}
            roomCode={roomCode}
            isHost={isHost}
            onLeaveRoom={onLeaveRoom}
            participantsList={participantsList}
          />
        </Box>
      )}

      {activeWidgets.has('calendar') && (
        <Box sx={{ pointerEvents: 'auto', transition: 'all 0.3s ease' }}>
          <CalendarWidget onClose={() => onCloseWidget('calendar')} />
        </Box>
      )}
    </Box>
  );
}

