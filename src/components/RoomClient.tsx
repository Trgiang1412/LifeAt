'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { io, Socket } from 'socket.io-client';
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
  const [isTimerMinimized, setIsTimerMinimized] = useState<boolean>(false);
  const isTimerMinimizedRef = useRef(isTimerMinimized);
  isTimerMinimizedRef.current = isTimerMinimized;
  const activeWidgetsRef = useRef(activeWidgets);
  activeWidgetsRef.current = activeWidgets;
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
  const [isActuallyHost, setIsActuallyHost] = useState<boolean>(() => {
    if (!user) return false;
    return Boolean(user.roomId === effectiveCode || (user.id && roomId === user.id));
  });

  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const hasHostSyncedInitialSpaceRef = useRef<boolean>(false);

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

  // Kết nối Socket.io để đồng bộ không gian / video tức thời 0ms giữa chủ phòng và khách
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io({
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket?.emit('joinRoom', { roomCode: effectiveCode });
      });

      const handleRemoteSpace = (data: any) => {
        // Chỉ khách mới nhận lệnh đồng bộ từ chủ phòng
        if (!isActuallyHost) {
          const remoteSpace = data.space || data;
          if (remoteSpace && remoteSpace.id) {
            currentSpaceIdRef.current = remoteSpace.id;
            setCurrentSpace(remoteSpace);
            if (typeof data.spaceStartedAt === 'number') {
              const elapsed = Math.max(0, Math.floor((Date.now() - data.spaceStartedAt) / 1000));
              setVideoStartTime(elapsed);
            }
          }
        }
      };

      socket.on('roomSpaceChanged', handleRemoteSpace);
      socket.on(`roomSpaceChanged_${effectiveCode}`, handleRemoteSpace);
    } catch {}

    return () => {
      if (socket) {
        socket.off('roomSpaceChanged');
        socket.off(`roomSpaceChanged_${effectiveCode}`);
        socket.disconnect();
      }
    };
  }, [effectiveCode, isActuallyHost]);

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

        if (data.hostId) {
          const userIsHost = Boolean(user && user.id === data.hostId) || Boolean(user && user.roomId === effectiveCode);
          setIsActuallyHost(userIsHost);
        }

        // Nếu là khách -> Đồng bộ nhạc & space và đồng hồ theo chủ phòng
        if (!isActuallyHost) {
          if (data.currentSpace && data.currentSpace.id) {
            if (data.currentSpace.id !== currentSpaceIdRef.current) {
              currentSpaceIdRef.current = data.currentSpace.id;
              setCurrentSpace(data.currentSpace);
              if (typeof data.spaceStartedAt === 'number') {
                const elapsed = Math.max(0, Math.floor((Date.now() - data.spaceStartedAt) / 1000));
                setVideoStartTime(elapsed);
              }
            }
          } else if (data.spaceId && data.spaceId !== currentSpaceIdRef.current) {
            const matchedSpace = SPACES_DATA.find((s) => s.id === data.spaceId);
            if (matchedSpace) {
              currentSpaceIdRef.current = matchedSpace.id;
              setCurrentSpace(matchedSpace);
              if (typeof data.spaceStartedAt === 'number') {
                const elapsed = Math.max(0, Math.floor((Date.now() - data.spaceStartedAt) / 1000));
                setVideoStartTime(elapsed);
              }
            }
          }

          if (data.timer) {
            setSyncedTimer(data.timer);
          }
        } else {
          // Nếu là chủ phòng và DB chưa có space (hoặc space cũ), đồng bộ space hiện tại lên DB ngay!
          if (!hasHostSyncedInitialSpaceRef.current && (!data.spaceId || data.spaceId === 'yt-lofi-room-chill' || !data.currentSpace)) {
            hasHostSyncedInitialSpaceRef.current = true;
            fetch('/api/room/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomCode: effectiveCode,
                spaceId: currentSpace.id,
                currentSpace,
                spaceStartedAt: Date.now(),
                hostName: effectiveHost,
                hostId: user?.id || '',
              }),
            }).catch(() => {});
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
  }, [effectiveCode, token, isActuallyHost, user, currentSpace, effectiveHost]);

  // Chủ phòng chọn không gian -> cập nhật cho toàn bộ phòng
  const handleSelectSpace = useCallback(
    (space: Space) => {
      hasHostSyncedInitialSpaceRef.current = true;
      currentSpaceIdRef.current = space.id;
      setCurrentSpace(space);
      setVideoStartTime(0);

      const now = Date.now();
      if (isActuallyHost) {
        // 1. Lưu vào Database
        fetch('/api/room/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: effectiveCode,
            spaceId: space.id,
            currentSpace: space,
            spaceStartedAt: now,
            hostName: effectiveHost,
            hostId: user?.id || '',
          }),
        }).catch(() => {});

        // 2. Broadcast tức thời qua Socket.io
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('syncRoomSpace', {
            roomCode: effectiveCode,
            space,
            spaceStartedAt: now,
          });
        }
      }
    },
    [isActuallyHost, effectiveCode, effectiveHost, user]
  );

  // Chủ phòng cập nhật đồng hồ -> cập nhật cho toàn bộ phòng
  const handleTimerUpdate = useCallback(
    (timer: any) => {
      if (isActuallyHost) {
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
    [isActuallyHost, effectiveCode, effectiveHost, user]
  );

  // Toggle widget in set
  const toggleWidget = useCallback((w: ActiveWidget) => {
    if (w === 'timer') {
      const isOpen = activeWidgetsRef.current.has('timer');
      const isMin = isTimerMinimizedRef.current;

      if (!isOpen) {
        // Chưa mở -> Mở lên và hiển thị
        setActiveWidgets((prev) => new Set(prev).add('timer'));
        setIsTimerMinimized(false);
      } else if (isMin) {
        // Đang mở nhưng bị ẩn -> HIỆN LÊN NGAY LẬP TỨC
        setIsTimerMinimized(false);
      } else {
        // Đang hiển thị -> Thu nhỏ ẩn đi
        setIsTimerMinimized(true);
      }
      return;
    }

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
    if (w === 'timer') {
      setIsTimerMinimized(false);
    }
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
      <BackgroundPlayer currentSpace={currentSpace} isZenMode={isZenMode} startTime={videoStartTime} />

      {/* Top Navigation Bar */}
      <TopBar
        roomHost={isActuallyHost ? effectiveHost : hostRoomName}
        roomCode={effectiveCode}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        onOpenSpaces={() => setIsSpacesOpen(true)}
        isHost={isActuallyHost}
        onLeaveRoom={handleLeaveRoom}
        participantCount={participantCount}
      />

      {/* Floating Productivity Widgets */}
      <WidgetsContainer
        activeWidgets={activeWidgets}
        onCloseWidget={closeWidget}
        isTimerMinimized={isTimerMinimized}
        onMinimizeTimer={() => setIsTimerMinimized(true)}
        settings={settings}
        hostName={isActuallyHost ? effectiveHost : hostRoomName}
        roomCode={effectiveCode}
        isZenMode={isZenMode}
        isHost={isActuallyHost}
        syncedTimer={syncedTimer}
        onTimerUpdate={handleTimerUpdate}
        onLeaveRoom={handleLeaveRoom}
        participantsList={participantsList}
      />

      {/* Bottom Command Dock */}
      <BottomDock
        activeWidgets={activeWidgets}
        isTimerMinimized={isTimerMinimized}
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
        isHost={isActuallyHost}
        hostName={isActuallyHost ? effectiveHost : hostRoomName}
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

