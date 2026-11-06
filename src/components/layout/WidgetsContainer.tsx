'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import DraggableWidgetWrapper from '@/components/layout/DraggableWidgetWrapper';
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
  isTimerMinimized?: boolean;
  onMinimizeTimer?: () => void;
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

const DEFAULT_POSITIONS: Record<ActiveWidget, { x: number; y: number }> = {
  timer: { x: 30, y: 110 },
  sounds: { x: 370, y: 100 },
  tasks: { x: 750, y: 110 },
  notes: { x: 1120, y: 100 },
  music: { x: 1480, y: 110 },
  chat: { x: 740, y: 110 },
  calendar: { x: 550, y: 110 },
};

export default function WidgetsContainer({
  activeWidgets,
  onCloseWidget,
  isTimerMinimized,
  onMinimizeTimer,
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
  const [zIndices, setZIndices] = useState<Record<string, number>>({});
  const highestZRef = useRef(20);

  const bringToFront = useCallback((id: string) => {
    highestZRef.current += 1;
    setZIndices((prev) => ({ ...prev, [id]: highestZRef.current }));
  }, []);

  if (isZenMode) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {activeWidgets.has('timer') && (
        <DraggableWidgetWrapper
          id="timer"
          defaultPosition={DEFAULT_POSITIONS.timer}
          zIndex={zIndices.timer || 20}
          onBringToFront={bringToFront}
          visible={!isTimerMinimized}
        >
          <PomodoroWidget
            onClose={() => onCloseWidget('timer')}
            onMinimize={onMinimizeTimer}
            settings={settings}
            isHost={isHost}
            hostName={hostName}
            syncedTimer={syncedTimer}
            onTimerUpdate={onTimerUpdate}
          />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('sounds') && (
        <DraggableWidgetWrapper
          id="sounds"
          defaultPosition={DEFAULT_POSITIONS.sounds}
          zIndex={zIndices.sounds || 20}
          onBringToFront={bringToFront}
        >
          <SoundscapeWidget onClose={() => onCloseWidget('sounds')} />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('tasks') && (
        <DraggableWidgetWrapper
          id="tasks"
          defaultPosition={DEFAULT_POSITIONS.tasks}
          zIndex={zIndices.tasks || 20}
          onBringToFront={bringToFront}
        >
          <TodoWidget onClose={() => onCloseWidget('tasks')} roomCode={roomCode} />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('notes') && (
        <DraggableWidgetWrapper
          id="notes"
          defaultPosition={DEFAULT_POSITIONS.notes}
          zIndex={zIndices.notes || 20}
          onBringToFront={bringToFront}
        >
          <NotesWidget onClose={() => onCloseWidget('notes')} roomCode={roomCode} />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('music') && (
        <DraggableWidgetWrapper
          id="music"
          defaultPosition={DEFAULT_POSITIONS.music}
          zIndex={zIndices.music || 20}
          onBringToFront={bringToFront}
        >
          <MusicPlayerWidget onClose={() => onCloseWidget('music')} />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('chat') && (
        <DraggableWidgetWrapper
          id="chat"
          defaultPosition={DEFAULT_POSITIONS.chat}
          zIndex={zIndices.chat || 20}
          onBringToFront={bringToFront}
        >
          <RoomChatWidget
            onClose={() => onCloseWidget('chat')}
            hostName={hostName}
            roomCode={roomCode}
            isHost={isHost}
            onLeaveRoom={onLeaveRoom}
            participantsList={participantsList}
          />
        </DraggableWidgetWrapper>
      )}

      {activeWidgets.has('calendar') && (
        <DraggableWidgetWrapper
          id="calendar"
          defaultPosition={DEFAULT_POSITIONS.calendar}
          zIndex={zIndices.calendar || 20}
          onBringToFront={bringToFront}
        >
          <CalendarWidget onClose={() => onCloseWidget('calendar')} />
        </DraggableWidgetWrapper>
      )}
    </Box>
  );
}
