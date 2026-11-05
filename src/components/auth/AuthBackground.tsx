'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';

export default function AuthBackground() {
  const videoId = '9kzE8isXlQY';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false); // Mặc định mở nhạc lên!

  const isMutedRef = useRef(isAudioMuted);
  isMutedRef.current = isAudioMuted;

  // Send command to YouTube iframe
  const sendIframeCommand = (func: string, args: any = '') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch {
      // Ignore cross-origin error
    }
  };

  const unmuteMusic = () => {
    sendIframeCommand('unMute');
    sendIframeCommand('setVolume', [60]);
    sendIframeCommand('playVideo');
    setIsAudioMuted(false);
    isMutedRef.current = false;
  };

  const muteMusic = () => {
    sendIframeCommand('mute');
    setIsAudioMuted(true);
    isMutedRef.current = true;
  };

  const toggleAudio = () => {
    if (isAudioMuted) {
      unmuteMusic();
    } else {
      muteMusic();
    }
  };

  // Autoplay music handling on mount and upon first interaction
  useEffect(() => {
    // Attempt unmute on load
    const timer = setTimeout(() => {
      if (!isMutedRef.current) {
        unmuteMusic();
      }
    }, 1200);

    // Browsers often block audio until first user gesture; listen for first click/key to instantly unmute
    const handleFirstInteraction = () => {
      if (!isMutedRef.current) {
        unmuteMusic();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        backgroundColor: '#090a12',
      }}
    >
      {/* 4K Lo-Fi YouTube Background Video */}
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1`}
        title="Lo-Fi Study Background"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => {
          setTimeout(unmuteMusic, 800);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100vw',
          height: '56.25vw',
          minHeight: '100vh',
          minWidth: '177.77vh',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          border: 0,
          opacity: 0.95,
        }}
      />

      {/* Soft Lo-Fi Atmosphere Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.42) 0%, rgba(88, 28, 135, 0.22) 50%, rgba(15, 23, 42, 0.48) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Lo-Fi Audio Control Pill (Top Right) */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 4,
          px: 1.5,
          py: 0.8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Animated equalizer waves when playing */}
        {!isAudioMuted && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.4, height: 16 }}>
            {[10, 16, 12, 14].map((h, i) => (
              <Box
                key={i}
                sx={{
                  width: 3,
                  height: h,
                  backgroundColor: '#f472b6',
                  borderRadius: 1,
                  animation: `bounce 0.8s ease-in-out infinite alternate ${i * 0.15}s`,
                  '@keyframes bounce': {
                    '0%': { height: 4 },
                    '100%': { height: 16 },
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Chip
          label={!isAudioMuted ? 'Nhạc Lo-Fi: Đang phát' : 'Nhạc Lo-Fi: Tắt tiếng'}
          size="small"
          onClick={toggleAudio}
          sx={{
            cursor: 'pointer',
            backgroundColor: !isAudioMuted ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            color: !isAudioMuted ? '#f472b6' : '#94a3b8',
            fontSize: '0.72rem',
            fontWeight: 600,
            border: !isAudioMuted ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />

        <Tooltip title={!isAudioMuted ? 'Tắt âm thanh' : 'Bật âm thanh Lo-Fi'}>
          <IconButton
            size="small"
            onClick={toggleAudio}
            sx={{
              color: !isAudioMuted ? '#f472b6' : '#94a3b8',
              p: 0.5,
              '&:hover': { backgroundColor: 'rgba(236, 72, 153, 0.15)' },
            }}
          >
            {!isAudioMuted ? <VolumeUpRoundedIcon fontSize="small" /> : <VolumeOffRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
