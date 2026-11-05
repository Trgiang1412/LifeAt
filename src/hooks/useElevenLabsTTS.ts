'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import useBrowserTTS from './useBrowserTTS';

// Bộ nhớ đệm Blob URL tĩnh trong RAM (lưu trữ theo voiceId + hash nội dung câu thoại)
const audioBlobCache = new Map<string, string>();

export interface UseElevenLabsTTSOptions {
  voiceId?: string;
  fallbackToBrowser?: boolean; // Tự động fallback sang Web Speech API nếu chưa có key ElevenLabs
}

export function useElevenLabsTTS(defaultOptions: UseElevenLabsTTSOptions = {}) {
  const { voiceId: defaultVoiceId = '21m00Tcm4TlvDq8ikWAM', fallbackToBrowser = true } = defaultOptions;

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const browserTTS = useBrowserTTS();

  // Khởi tạo Audio element một lần duy nhất
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.warn('[useElevenLabsTTS] Lỗi phát Audio element:', e);
        setIsPlaying(false);
      };
    }

    return () => {
      // Dọn dẹp âm thanh khi unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      browserTTS.stop();
    };
  }, []);

  // Hàm dừng toàn bộ âm thanh (cả ElevenLabs Audio và Browser Web Speech)
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    browserTTS.stop();
    setIsLoading(false);
    setIsPlaying(false);
  }, [browserTTS]);

  // Hàm phát âm thanh từ Blob URL
  const playFromBlobUrl = useCallback((blobUrl: string) => {
    if (!audioRef.current) return;
    audioRef.current.src = blobUrl;
    audioRef.current.play().catch((err) => {
      console.warn('[useElevenLabsTTS] Trình duyệt chặn Autoplay Audio:', err);
      setIsPlaying(false);
    });
  }, []);

  // Hàm play(text, voiceId)
  const play = useCallback(
    async (text: string, customVoiceId?: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;

      const activeVoiceId = customVoiceId || defaultVoiceId;
      const cacheKey = `${activeVoiceId}::${cleanText}`;

      // 1. Tự động dừng luồng âm thanh cũ trước khi phát câu mới
      stop();
      setError(null);

      // 2. Kiểm tra bộ nhớ đệm Blob URL để không tải lại cùng một câu thoại
      if (audioBlobCache.has(cacheKey)) {
        const cachedBlobUrl = audioBlobCache.get(cacheKey)!;
        playFromBlobUrl(cachedBlobUrl);
        return;
      }

      setIsLoading(true);
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voiceId: activeVoiceId }),
          signal: abortCtrl.signal,
        });

        // 3. Nếu API ElevenLabs trả về lỗi hoặc chưa có Key, fallback sang Web Speech API
        if (!response.ok || response.headers.get('content-type')?.includes('application/json')) {
          const errData = await response.json().catch(() => ({}));
          if (fallbackToBrowser) {
            browserTTS.speak(cleanText);
            setIsLoading(false);
            return;
          } else {
            throw new Error(errData.error || `Lỗi tải audio (${response.status})`);
          }
        }

        // Tạo Blob URL và lưu vào cache
        const audioBlob = await response.blob();
        const blobUrl = URL.createObjectURL(audioBlob);
        audioBlobCache.set(cacheKey, blobUrl);

        playFromBlobUrl(blobUrl);
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.warn('[useElevenLabsTTS] Chuyển hướng dự phòng sang Web Speech API:', err.message);
        setError(err.message);

        // Tự động kích hoạt Web Speech API dự phòng
        if (fallbackToBrowser) {
          browserTTS.speak(cleanText);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [defaultVoiceId, fallbackToBrowser, browserTTS, stop, playFromBlobUrl]
  );

  const isSpeaking = isPlaying || browserTTS.isSpeaking;

  return {
    play,
    stop,
    isSpeaking,
    isLoading,
    error,
    isCached: (text: string, voiceId?: string) =>
      audioBlobCache.has(`${voiceId || defaultVoiceId}::${text.trim()}`),
  };
}

export default useElevenLabsTTS;

