'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import TopBar from '@/components/layout/TopBar';
import BottomDock from '@/components/layout/BottomDock';
import BackgroundPlayer from '@/components/layout/BackgroundPlayer';
import WidgetsContainer from '@/components/layout/WidgetsContainer';
import SpacesModal from '@/components/widgets/SpacesModal';
import SettingsModal from '@/components/widgets/SettingsModal';
import { SPACES_DATA } from '@/data/spaces';
import { Space, ActiveWidget, PomodoroSettings, PomodoroMode } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface RoomClientProps {
  roomId?: string;
  initialSpaceCode?: string;
  initialHost?: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export default function RoomClient({
  roomId = 'a7263e68-b5e5-4a63-8017-5defd71b31fc',
  initialSpaceCode = 'M7KQ-ILKC',
  initialHost = "Trường's Room",
}: RoomClientProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [currentSpace, setCurrentSpace] = useState<Space>(SPACES_DATA[0]);
  const [activeWidgets, setActiveWidgets] = useState<Set<ActiveWidget>>(new Set(['timer']));
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isSpacesOpen, setIsSpacesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);

  // Nếu có thông tin phòng cụ thể (khi được mời hoặc dán link vào phòng người khác)
  const isVisitingSpecificRoom = Boolean(
    initialHost &&
    initialHost !== "Trường's Room" &&
    initialSpaceCode &&
    initialSpaceCode !== 'M7KQ-ILKC'
  );

  const effectiveHost = isVisitingSpecificRoom
    ? initialHost!
    : user
    ? `${user.tenDangNhap}'s Room`
    : initialHost;

  const effectiveCode = isVisitingSpecificRoom
    ? initialSpaceCode!
    : user?.roomId || initialSpaceCode;

  // Xác định người dùng có phải là Host hay là Khách
  const isHost = !isVisitingSpecificRoom || Boolean(user && user.roomId === effectiveCode);

  // Trạng thái đồng bộ từ Chủ phòng
  const [hostRoomName, setHostRoomName] = useState<string>(effectiveHost);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [participantsList, setParticipantsList] = useState<any[]>([]);
  const [syncedTimer, setSyncedTimer] = useState<{
    mode: PomodoroMode;
    timeLeft: number;
    isActive: boolean;
    lastUpdated: number;
  } | null>(null);

  // Ref lưu space hiện tại để tránh stale closure khi sync
  const currentSpaceIdRef = useRef(currentSpace.id);
  currentSpaceIdRef.current = currentSpace.id;

  // Rời phòng và quay về phòng cá nhân
  const handleLeaveRoom = useCallback(async () => {
    try {
      await fetch('/api/room/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ roomCode: effectiveCode }),
      });
    } catch {
      // Bỏ qua lỗi mạng
    }

    if (user?.id) {
      router.push(`/room/${user.id}?space=${user.roomId}&host=${encodeURIComponent(`${user.tenDangNhap}'s Room`)}`);
    } else {
      router.push('/');
    }
  }, [effectiveCode, token, user, router]);

  // Đồng bộ trạng thái phòng (Nhạc, Không gian, Đồng hồ Pomodoro, Thành viên)
  useEffect(() => {
    let isMounted = true;

    const syncRoom = async () => {
      try {
        const res = await fetch(`/api/room/state?roomCode=${encodeURIComponent(effectiveCode)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || !isMounted) return;

        const data = await res.json();
        if (!data || !data.success) return;

        if (data.participants) {
          setParticipantCount(data.participants.length || 1);
          setParticipantsList(data.participants);
        }

        if (data.hostName) {
          setHostRoomName(data.hostName);
        }

        // Nếu là khách -> Đồng bộ nhạc & space và đồng hồ theo chủ phòng
        if (!isHost) {
          if (data.spaceId && data.spaceId !== currentSpaceIdRef.current) {
            const matchedSpace = SPACES_DATA.find((s) => s.id === data.spaceId);
            if (matchedSpace) {
              setCurrentSpace(matchedSpace);
            }
          }

          if (data.timer) {
            setSyncedTimer(data.timer);
          }
        }
      } catch {
        // Bỏ qua lỗi polling nền
      }
    };

    // Khởi tạo ngay
    syncRoom();

    // Chu kỳ polling mỗi 2.5 giây
    const interval = setInterval(syncRoom, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveCode, token, isHost]);

  // Chủ phòng chọn không gian -> cập nhật cho toàn bộ phòng
  const handleSelectSpace = useCallback(
    (space: Space) => {
      setCurrentSpace(space);
      if (isHost) {
        fetch('/api/room/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: effectiveCode,
            spaceId: space.id,
            hostName: effectiveHost,
            hostId: user?.id || '',
          }),
        }).catch(() => {});
      }
    },
    [isHost, effectiveCode, effectiveHost, user]
  );

  // Chủ phòng cập nhật đồng hồ -> cập nhật cho toàn bộ phòng
  const handleTimerUpdate = useCallback(
    (timer: any) => {
      if (isHost) {
        fetch('/api/room/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: effectiveCode,
            timer,
            hostName: effectiveHost,
            hostId: user?.id || '',
          }),
        }).catch(() => {});
      }
    },
    [isHost, effectiveCode, effectiveHost, user]
  );

  // Toggle widget in set
  const toggleWidget = useCallback((w: ActiveWidget) => {
    setActiveWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(w)) {
        next.delete(w);
      } else {
        next.add(w);
      }
      return next;
    });
  }, []);

  const closeWidget = useCallback((w: ActiveWidget) => {
    setActiveWidgets((prev) => {
      const next = new Set(prev);
      next.delete(w);
      return next;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#090a0f',
      }}
    >
      {/* Background Video & Scenery */}
      <BackgroundPlayer currentSpace={currentSpace} isZenMode={isZenMode} />

      {/* Top Navigation Bar */}
      <TopBar
        roomHost={isHost ? effectiveHost : hostRoomName}
        roomCode={effectiveCode}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        onOpenSpaces={() => setIsSpacesOpen(true)}
        isHost={isHost}
        onLeaveRoom={handleLeaveRoom}
        participantCount={participantCount}
      />

      {/* Floating Productivity Widgets */}
      <WidgetsContainer
        activeWidgets={activeWidgets}
        onCloseWidget={closeWidget}
        settings={settings}
        hostName={isHost ? effectiveHost : hostRoomName}
        roomCode={effectiveCode}
        isZenMode={isZenMode}
        isHost={isHost}
        syncedTimer={syncedTimer}
        onTimerUpdate={handleTimerUpdate}
        onLeaveRoom={handleLeaveRoom}
        participantsList={participantsList}
      />

      {/* Bottom Command Dock */}
      <BottomDock
        activeWidgets={activeWidgets}
        onToggleWidget={toggleWidget}
        onOpenSpaces={() => setIsSpacesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
      />

      {/* Spaces Background Switcher Modal */}
      <SpacesModal
        open={isSpacesOpen}
        onClose={() => setIsSpacesOpen(false)}
        currentSpace={currentSpace}
        onSelectSpace={handleSelectSpace}
        isHost={isHost}
        hostName={isHost ? effectiveHost : hostRoomName}
      />

      {/* Room Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </Box>
  );
}

