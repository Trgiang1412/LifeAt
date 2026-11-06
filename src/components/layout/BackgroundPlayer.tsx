'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import VideoControlsBar from '@/components/layout/VideoControlsBar';
import { Space } from '@/types';

interface BackgroundPlayerProps {
  currentSpace: Space;
  isZenMode?: boolean;
  startTime?: number;
}

export default function BackgroundPlayer({ currentSpace, isZenMode, startTime = 0 }: BackgroundPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trạng thái tắt âm thanh video (mặc định false hoặc đọc từ localStorage khi client mount)
  const [isYtAudioMuted, setIsYtAudioMuted] = useState(false);
  const isMutedRef = useRef(isYtAudioMuted);

  // Giữ initialMute và initialStart cố định cho mỗi khi đổi currentSpace
  // Để khi bấm tắt/bật âm thanh, `src` không bị thay đổi -> video không bị reload lại từ đầu!
  const currentYtIdRef = useRef<string | undefined>(undefined);
  const initialMuteRef = useRef<number>(isYtAudioMuted ? 1 : 0);
  const initialStartRef = useRef<number>(startTime || 0);

  if (currentYtIdRef.current !== currentSpace.youtubeId) {
    currentYtIdRef.current = currentSpace.youtubeId;
    initialMuteRef.current = isMutedRef.current ? 1 : 0;
    initialStartRef.current = startTime || 0;
  }

  // Giữ ref luôn đồng bộ với state
  useEffect(() => {
    isMutedRef.current = isYtAudioMuted;
  }, [isYtAudioMuted]);

  // Brightness / Dimmer (0 = 100% full original brightness)
  const [dimLevel, setDimLevel] = useState<number>(0);

  // Video Scaling: Mặc định hiển thị full viền (cover)!
  const [fitMode, setFitMode] = useState<'fit' | 'cover'>('cover');
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const isYouTube = currentSpace.sourceType === 'youtube' && !!currentSpace.youtubeId;

  // Send message to YouTube iframe
  const sendIframeCommand = useCallback((func: string, args: any = '') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch {
      // Ignore cross-origin error
    }
  }, []);

  const unmuteYouTube = useCallback(() => {
    setIsYtAudioMuted(false);
    isMutedRef.current = false;
    try {
      localStorage.setItem('lifeat_video_muted', 'false');
    } catch {}
    sendIframeCommand('unMute');
    sendIframeCommand('setVolume', [70]);
    if (videoRef.current) {
      videoRef.current.muted = false;
    }
  }, [sendIframeCommand]);

  const muteYouTube = useCallback(() => {
    setIsYtAudioMuted(true);
    isMutedRef.current = true;
    try {
      localStorage.setItem('lifeat_video_muted', 'true');
    } catch {}
    sendIframeCommand('mute');
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, [sendIframeCommand]);

  const toggleYouTubeAudio = useCallback(() => {
    if (isYtAudioMuted) {
      unmuteYouTube();
    } else {
      muteYouTube();
    }
  }, [isYtAudioMuted, unmuteYouTube, muteYouTube]);

  // Khôi phục cài đặt tắt/bật âm thanh từ localStorage khi client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeat_video_muted');
      if (saved !== null) {
        const shouldMute = saved === 'true';
        setIsYtAudioMuted(shouldMute);
        isMutedRef.current = shouldMute;
        if (shouldMute) {
          sendIframeCommand('mute');
        }
      }
    } catch {}
  }, [sendIframeCommand]);

  // Xử lý âm thanh khi đổi Space
  useEffect(() => {
    setIsLoaded(false);

    if (isYouTube) {
      if (isMutedRef.current) {
        // Nếu người dùng đang tắt âm: lập tức gửi lệnh mute và giữ mute
        sendIframeCommand('mute');
        const muteTimer1 = setTimeout(() => sendIframeCommand('mute'), 500);
        const muteTimer2 = setTimeout(() => sendIframeCommand('mute'), 1200);

        return () => {
          clearTimeout(muteTimer1);
          clearTimeout(muteTimer2);
        };
      } else {
        // Nếu đang bật âm: bật âm lượng sau khi iframe sẵn sàng
        const timer = setTimeout(() => {
          if (!isMutedRef.current) {
            sendIframeCommand('unMute');
            sendIframeCommand('setVolume', [70]);
            sendIframeCommand('playVideo');
          }
        }, 1000);

        // Xử lý chính sách autoplay của trình duyệt: bật âm thanh khi tương tác
        const handleFirstGesture = () => {
          if (!isMutedRef.current) {
            sendIframeCommand('unMute');
            sendIframeCommand('setVolume', [70]);
            sendIframeCommand('playVideo');
          }
          window.removeEventListener('click', handleFirstGesture);
          window.removeEventListener('keydown', handleFirstGesture);
          window.removeEventListener('touchstart', handleFirstGesture);
        };

        window.addEventListener('click', handleFirstGesture);
        window.addEventListener('keydown', handleFirstGesture);
        window.addEventListener('touchstart', handleFirstGesture);

        return () => {
          clearTimeout(timer);
          window.removeEventListener('click', handleFirstGesture);
          window.removeEventListener('keydown', handleFirstGesture);
          window.removeEventListener('touchstart', handleFirstGesture);
        };
      }
    } else if (videoRef.current) {
      videoRef.current.muted = isMutedRef.current;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentSpace.id, currentSpace.youtubeId, currentSpace.videoUrl, isYouTube, sendIframeCommand]);

  // Cấu hình hiển thị full viền 100% không để lại viền đen nào
  const getIframeStyle = (): React.CSSProperties => {
    if (fitMode === 'fit') {
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '100vw',
        height: '100vh',
        transform: `translate(-50%, -50%) scale(${zoomScale})`,
        pointerEvents: 'none',
        border: 0,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.8s ease, transform 0.2s ease',
      };
    } else {
      // Chế độ Full Viền (Cover): Đảm bảo tràn đầy 100% màn hình trên mọi tỷ lệ màn hình (16:9, 16:10, 21:9)
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 'max(100vw, 177.78vh)',
        height: 'max(100vh, 56.25vw)',
        transform: `translate(-50%, -50%) scale(${zoomScale})`,
        pointerEvents: 'none',
        border: 0,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.8s ease, transform 0.2s ease',
      };
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#090a0f',
      }}
    >
      {/* 4K YouTube Background Embed */}
      {isYouTube ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <iframe
            ref={iframeRef}
            key={currentSpace.youtubeId}
            src={`https://www.youtube.com/embed/${currentSpace.youtubeId}?autoplay=1&mute=${initialMuteRef.current}${initialStartRef.current > 0 ? `&start=${Math.floor(initialStartRef.current)}` : ''}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${currentSpace.youtubeId}&playsinline=1&enablejsapi=1`}
            title={currentSpace.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => {
              setIsLoaded(true);
              if (initialStartRef.current > 0) {
                sendIframeCommand('seekTo', [Math.floor(initialStartRef.current), true]);
              }
              if (isMutedRef.current) {
                sendIframeCommand('mute');
              } else {
                setTimeout(() => {
                  if (!isMutedRef.current) {
                    unmuteYouTube();
                  }
                }, 800);
              }
            }}
            style={getIframeStyle()}
          />
        </Box>
      ) : (
        /* Direct Video Loop */
        <video
          ref={videoRef}
          key={currentSpace.videoUrl}
          autoPlay
          loop
          muted={isYtAudioMuted}
          playsInline
          onLoadedData={() => {
            setIsLoaded(true);
            if (startTime > 0 && videoRef.current) {
              videoRef.current.currentTime = startTime;
            }
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: fitMode === 'fit' ? '100vw' : 'max(100vw, 177.78vh)',
            height: fitMode === 'fit' ? '100vh' : 'max(100vh, 56.25vw)',
            transform: `translate(-50%, -50%) scale(${zoomScale})`,
            objectFit: fitMode === 'fit' ? 'contain' : 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.8s ease, transform 0.2s ease',
          }}
        >
          <source src={currentSpace.videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Dynamic Dimmer Overlay */}
      {dimLevel > 0 && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${dimLevel / 100})`,
            pointerEvents: 'none',
            transition: 'background-color 0.2s ease',
          }}
        />
      )}

      {/* Decoupled Video Controls Bar */}
      {!isZenMode && (
        <VideoControlsBar
          is4K={currentSpace.is4K}
          isYouTube={isYouTube || currentSpace.sourceType === 'video'}
          isYtAudioMuted={isYtAudioMuted}
          fitMode={fitMode}
          zoomScale={zoomScale}
          dimLevel={dimLevel}
          onToggleAudio={toggleYouTubeAudio}
          onSetFitMode={setFitMode}
          onSetZoomScale={setZoomScale}
          onSetDimLevel={setDimLevel}
        />
      )}
    </Box>
  );
}
