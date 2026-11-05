import { create } from 'zustand';
import * as THREE from 'three';

// 120 giây thực tế = 24 giờ trong game => Tỉ lệ tốc độ: 24 / 120 = 0.2 giờ game / giây thực
const REAL_SECONDS_PER_FULL_DAY = 120.0;
const BASE_TIME_RATE = 24.0 / REAL_SECONDS_PER_FULL_DAY; // 0.2

export interface DayNightState {
  // Thời gian game từ 0.0 đến 24.0 (ví dụ 14.5 = 14h30)
  gameTime: number;
  // Flag tự động bật từ 18h00 đến 06h00
  isNight: boolean;
  // Trọng số chuyển tiếp mượt mà 0.0 (ban ngày) -> 1.0 (ban đêm)
  nightMix: number;
  // Trạng thái chạy thời gian
  isPlaying: boolean;
  timeScale: number;

  // Thuộc tính ánh sáng tính toán tự động
  sunColor: THREE.Color;
  sunPosition: [number, number, number];
  sunIntensity: number;
  ambientIntensity: number;
  skyBgColor: string;

  // Actions
  advanceTime: (deltaSeconds: number) => void;
  setTime: (newTime: number) => void;
  togglePlayPause: () => void;
  setTimeScale: (scale: number) => void;
}

/**
 * Tính toán trọng số nightMix (0.0 đến 1.0) mượt mà:
 * - 06:00 -> 17:30: Ban ngày (nightMix = 0.0)
 * - 17:30 -> 19:30: Hoàng hôn chuyển sang tối (nightMix: 0.0 -> 1.0)
 * - 19:30 -> 05:00: Ban đêm (nightMix = 1.0)
 * - 05:00 -> 07:00: Bình minh chuyển sang sáng (nightMix: 1.0 -> 0.0)
 */
function calculateNightMix(time: number): number {
  if (time >= 7.0 && time <= 17.0) {
    return 0.0; // Ban ngày
  }
  if (time > 17.0 && time < 19.5) {
    // Hoàng hôn
    return (time - 17.0) / 2.5;
  }
  if (time >= 19.5 || time <= 5.0) {
    return 1.0; // Đêm thâu
  }
  if (time > 5.0 && time < 7.0) {
    // Bình minh
    return 1.0 - (time - 5.0) / 2.0;
  }
  return 0.0;
}

/**
 * Tính toán màu và vị trí mặt trời theo quỹ đạo thời gian
 */
function calculateLighting(time: number) {
  // Góc quay quỹ đạo mặt trời (0h -> 24h = 0 -> 2pi)
  // 12h trưa mặt trời ở đỉnh cao nhất
  const angle = ((time - 6.0) / 24.0) * Math.PI * 2.0;
  const sunX = Math.cos(angle) * 35.0;
  const sunY = Math.sin(angle) * 35.0;
  const sunZ = 20.0;

  const nightMix = calculateNightMix(time);
  const isNight = time >= 18.0 || time < 6.0;

  const sunColor = new THREE.Color();
  let sunIntensity = 1.6;
  let ambientIntensity = 0.65;
  let skyBgColor = '#87ceeb'; // Xanh trời ban ngày

  if (time >= 6.0 && time < 16.5) {
    // Ban ngày: Vàng ấm rực rỡ
    sunColor.setRGB(1.0, 0.96, 0.86);
    sunIntensity = 1.8;
    ambientIntensity = 0.68;
    skyBgColor = '#60a5fa';
  } else if (time >= 16.5 && time < 19.0) {
    // Hoàng hôn: Cam ấm sang hồng tím
    const t = (time - 16.5) / 2.5;
    sunColor.lerpColors(new THREE.Color('#f59e0b'), new THREE.Color('#db2777'), t);
    sunIntensity = 1.5 - t * 0.9;
    ambientIntensity = 0.6 - t * 0.35;
    skyBgColor = '#7c3aed';
  } else if (time >= 19.0 || time < 5.0) {
    // Ban đêm: Ánh trăng xanh thẫm
    sunColor.setRGB(0.18, 0.28, 0.55);
    sunIntensity = 0.35;
    ambientIntensity = 0.18;
    skyBgColor = '#0b0f19';
  } else {
    // Bình minh: Cam nhạt
    const t = (time - 5.0) / 1.0;
    sunColor.lerpColors(new THREE.Color('#ea580c'), new THREE.Color('#fef08a'), t);
    sunIntensity = 0.6 + t * 1.0;
    ambientIntensity = 0.28 + t * 0.35;
    skyBgColor = '#38bdf8';
  }

  return {
    nightMix,
    isNight,
    sunColor,
    sunPosition: [sunX, Math.max(sunY, -5.0), sunZ] as [number, number, number],
    sunIntensity,
    ambientIntensity,
    skyBgColor,
  };
}

export const useDayNightCycle = create<DayNightState>((set) => ({
  gameTime: 14.0, // Khởi đầu lúc 14h00 chiều
  isPlaying: true,
  timeScale: 1.0,
  ...calculateLighting(14.0),

  advanceTime: (deltaSeconds: number) =>
    set((state) => {
      if (!state.isPlaying) return state;

      const increment = deltaSeconds * BASE_TIME_RATE * state.timeScale;
      let nextTime = (state.gameTime + increment) % 24.0;
      if (nextTime < 0) nextTime += 24.0;

      return {
        gameTime: nextTime,
        ...calculateLighting(nextTime),
      };
    }),

  setTime: (newTime: number) =>
    set(() => {
      const normalized = Math.max(0, Math.min(24.0, newTime)) % 24.0;
      return {
        gameTime: normalized,
        ...calculateLighting(normalized),
      };
    }),

  togglePlayPause: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),

  setTimeScale: (scale: number) =>
    set(() => ({
      timeScale: Math.max(0.1, Math.min(10.0, scale)),
    })),
}));

export default useDayNightCycle;

