'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TTSOptions {
  rate?: number; // Tốc độ nói (mặc định 0.9 cho người học tiếng Anh nghe rõ)
  pitch?: number; // Cao độ (mặc định 1.0)
  lang?: string; // Mã ngôn ngữ
}

export function useBrowserTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 1. Tự động nạp danh sách voice (onvoiceschanged) và ưu tiên chọn giọng bản xứ chuẩn
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      setVoices(availableVoices);

      // Ưu tiên: Giọng en-US / en-GB tự nhiên hoặc giọng Google / Apple
      const prioritizedVoice =
        availableVoices.find((v) => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) ||
        availableVoices.find((v) => v.lang === 'en-GB' && (v.name.includes('Google') || v.name.includes('Daniel'))) ||
        availableVoices.find((v) => v.lang.startsWith('en-US')) ||
        availableVoices.find((v) => v.lang.startsWith('en-GB')) ||
        availableVoices.find((v) => v.lang.startsWith('en'));

      if (prioritizedVoice) {
        selectedVoiceRef.current = prioritizedVoice;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      // Dừng âm thanh khi unmount
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadVoices]);

  // 2. Hàm stop() dừng mọi luồng âm thanh đang phát
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  // 3. Hàm speak(text, { rate: 0.9, pitch: 1.0 })
  const speak = useCallback(
    (text: string, options: TTSOptions = {}) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const cleanText = text.trim();
      if (!cleanText) return;

      // Dừng luồng phát cũ trước khi phát câu mới
      stop();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options.rate ?? 0.9; // Tốc độ vừa phải cho học tiếng Anh
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.lang ?? 'en-US';

      // Gán voice bản xứ đã tìm được
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // Bỏ qua lỗi canceled khi gọi stop()
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('[useBrowserTTS] Lỗi phát âm Web Speech:', e);
        }
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [stop]
  );

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice: selectedVoiceRef.current,
  };
}

export default useBrowserTTS;

