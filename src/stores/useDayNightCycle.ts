import { create } from 'zustand';
import * as THREE from 'three';

// Chu kỳ thời gian: 1800 giây thực tế (30 phút) = 24 giờ trong game
const REAL_SECONDS_PER_FULL_DAY = 1800.0;
const BASE_TIME_RATE = 24.0 / REAL_SECONDS_PER_FULL_DAY;

export interface DayNightState {
  gameTime: number;
  isNight: boolean;
  nightMix: number;
  isPlaying: boolean;
  timeScale: number;

  sunColor: THREE.Color;
  sunPosition: [number, number, number];
  sunIntensity: number;
  ambientIntensity: number;
  skyBgColor: string;

  advanceTime: (deltaSeconds: number) => void;
  setTime: (newTime: number) => void;
  togglePlayPause: () => void;
  setTimeScale: (scale: number) => void;
}

function calculateNightMix(time: number): number {
  if (time >= 6.5 && time <= 17.5) {
    return 0.0; // Ban ngày
  }
  if (time > 17.5 && time < 19.0) {
    return (time - 17.5) / 1.5;
  }
  if (time >= 19.0 || time <= 5.0) {
    return 1.0; // Ban đêm
  }
  if (time > 5.0 && time < 6.5) {
    return 1.0 - (time - 5.0) / 1.5;
  }
  return 0.0;
}

/**
 * Cân bằng ánh sáng dịu mắt chuẩn hoạt hình Play Together:
 * Tuyệt đối không để cường độ ánh sáng quá cao gây cháy sáng trắng (overexposure)
 */
function calculateLighting(time: number) {
  const angle = ((time - 6.0) / 24.0) * Math.PI * 2.0;
  const sunX = Math.cos(angle) * 35.0;
  const sunY = Math.sin(angle) * 35.0;
  const sunZ = 20.0;

  const nightMix = calculateNightMix(time);
  const isNight = time >= 18.5 || time < 5.5;

  const sunColor = new THREE.Color();
  let sunIntensity = 1.2;
  let ambientIntensity = 0.75;
  let skyBgColor = '#60a5fa'; // Bầu trời xanh biếc Play Together

  if (time >= 6.5 && time < 17.0) {
    // ☀️ Ban ngày: Nắng vàng ấm dịu, thảm cỏ và công trình giữ trọn màu sắc tự nhiên
    sunColor.setRGB(1.0, 0.98, 0.92);
    sunIntensity = 1.25;
    ambientIntensity = 0.75;
    skyBgColor = '#60a5fa';
  } else if (time >= 17.0 && time < 18.5) {
    // 🌅 Hoàng hôn
    const t = (time - 17.0) / 1.5;
    sunColor.lerpColors(new THREE.Color('#fbbf24'), new THREE.Color('#f472b6'), t);
    sunIntensity = 1.2 - t * 0.4;
    ambientIntensity = 0.75 - t * 0.15;
    skyBgColor = '#818cf8';
  } else if (time >= 18.5 || time < 5.0) {
    // 🌙 Ban đêm: Đêm lễ hội lung linh
    sunColor.setRGB(0.75, 0.82, 0.98);
    sunIntensity = 0.7;
    ambientIntensity = 0.6;
    skyBgColor = '#1e1b4b';
  } else {
    // 🌄 Bình minh
    const t = (time - 5.0) / 1.5;
    sunColor.lerpColors(new THREE.Color('#f472b6'), new THREE.Color('#fef08a'), t);
    sunIntensity = 0.8 + t * 0.4;
    ambientIntensity = 0.6 + t * 0.15;
    skyBgColor = '#38bdf8';
  }

  return {
    nightMix,
    isNight,
    sunColor,
    sunPosition: [sunX, Math.max(sunY, 15.0), sunZ] as [number, number, number],
    sunIntensity,
    ambientIntensity,
    skyBgColor,
  };
}

let lastStoreUpdate = 0;

/**
 * Tính giờ cố định đồng bộ trên toàn thế giới (Global World Clock)
 * Mọi người chơi ở bất kỳ trình duyệt/máy tính nào đều thấy cùng 1 mốc giờ và chu kỳ Ngày/Đêm
 */
export function getGlobalWorldTime(): number {
  const epochSeconds = Date.now() / 1000.0;
  const rawHours = ((epochSeconds % REAL_SECONDS_PER_FULL_DAY) / REAL_SECONDS_PER_FULL_DAY) * 24.0;
  return (rawHours + 24.0) % 24.0;
}

const initialGlobalTime = getGlobalWorldTime();

export const useDayNightCycle = create<DayNightState>((set, get) => ({
  gameTime: initialGlobalTime,
  isPlaying: true, // Luôn luôn chạy theo giờ cố định của toàn thế giới
  timeScale: 1.0,
  ...calculateLighting(initialGlobalTime),

  advanceTime: () => {
    const state = get();
    const nextTime = getGlobalWorldTime();

    // Cập nhật giá trị nội tại
    state.gameTime = nextTime;

    // Throttle 200ms để không kích hoạt React re-render 60fps làm lag giao diện
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastStoreUpdate > 200) {
      lastStoreUpdate = now;
      set({
        gameTime: nextTime,
        isPlaying: true,
        ...calculateLighting(nextTime),
      });
    }
  },

  setTime: () => {
    // Giờ toàn thế giới là cố định cho mọi người chơi, không cho phép chỉnh tay lệch giờ
    const syncedTime = getGlobalWorldTime();
    set({
      gameTime: syncedTime,
      isPlaying: true,
      ...calculateLighting(syncedTime),
    });
  },

  togglePlayPause: () => {
    // Đã bỏ hành động dừng: thời gian thế giới luôn chạy cố định
    set({ isPlaying: true });
  },

  setTimeScale: () => {
    set({ timeScale: 1.0 });
  },
}));

export default useDayNightCycle;
