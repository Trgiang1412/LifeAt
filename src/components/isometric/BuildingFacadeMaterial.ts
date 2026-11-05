import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * BuildingFacadeMaterial - Custom Shader Material tối ưu hóa 1 Draw Call
 * Phân chia lưới cửa sổ bằng UV math và tạo hiệu ứng phát xạ HDR kích hoạt Bloom ban đêm.
 */
export const BuildingFacadeMaterial = shaderMaterial(
  {
    uGridRepeat: new THREE.Vector2(4.0, 8.0),
    uWindowPadding: new THREE.Vector2(0.2, 0.22),
    uNightMix: 0.0,
    uWallColor: new THREE.Color('#222533'),
    uWindowDayColor: new THREE.Color('#12141c'),
    uWindowLitColor: new THREE.Color('#ffb042'),
    uTime: 0.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    precision highp float;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    uniform vec2 uGridRepeat;
    uniform vec2 uWindowPadding;
    uniform float uNightMix;
    uniform vec3 uWallColor;
    uniform vec3 uWindowDayColor;
    uniform vec3 uWindowLitColor;
    uniform float uTime;

    // Pseudo-random hash tĩnh dựa trên chỉ số hàng và cột của ô cửa sổ
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      // 1. Phân chia tọa độ UV thành lưới ô cửa sổ theo hàng và cột
      vec2 gridUv = vUv * uGridRepeat;
      vec2 cellId = floor(gridUv);
      vec2 cellUv = fract(gridUv);

      // 2. Tạo viền tường bao quanh từng ô kính bằng uWindowPadding
      vec2 windowMask = step(uWindowPadding, cellUv) * step(uWindowPadding, 1.0 - cellUv);
      float isWindow = windowMask.x * windowMask.y;

      // 3. Dùng thuật toán pseudo-random hash trên chỉ số ô floor(gridUv) để gán giá trị tĩnh
      float rnd = hash21(cellId);

      // Tỉ lệ phòng bật đèn vào ban đêm (~75% số phòng)
      float isRoomLit = step(0.25, rnd);

      // Hiệu ứng thở nhẹ và dao động ánh sáng ấm cúng
      float subtleFlicker = 0.96 + 0.04 * sin(uTime * 2.0 + rnd * 6.28);

      // 4. Nhận uniform uNightMix (0.0 ngày -> 1.0 đêm)
      // Nhân cường độ phát xạ windowColor *= 2.2 và toneMapped: false để ánh đèn vượt threshold Bloom (>0.85)
      vec3 litWindowColor = uWindowLitColor * subtleFlicker * 2.2;

      // Chuyển dần ô cửa sổ từ màu kính tối ban ngày sang ánh sáng vàng ấm rực rỡ ban đêm
      vec3 activeWindowColor = mix(uWindowDayColor, litWindowColor * isRoomLit, uNightMix);

      // Áp dụng màu giữa tường và cửa sổ
      vec3 baseColor = mix(uWallColor, activeWindowColor, isWindow);

      // Tính toán đổ bóng hướng sáng nhẹ nhàng cho tường không gian Isometric
      vec3 sunDir = normalize(vec3(0.5, 0.8, 0.6));
      float diffuse = max(dot(vNormal, sunDir), 0.0) * 0.4 + 0.6;

      // Tường nhận ánh sáng khuếch tán, còn cửa sổ phát sáng ban đêm giữ nguyên giá trị HDR Bloom
      vec3 finalColor = mix(baseColor * diffuse, baseColor, isWindow * isRoomLit * uNightMix);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Tắt toneMapped để các giá trị RGB vượt ngưỡng 1.0 được EffectComposer Bloom phát sáng rực rỡ
BuildingFacadeMaterial.prototype.toneMapped = false;

// Đăng ký component với React Three Fiber
extend({ BuildingFacadeMaterial });

// Mở rộng JSX element type cho TypeScript
declare module '@react-three/fiber' {
  interface ThreeElements {
    buildingFacadeMaterial: {
      ref?: any;
      uGridRepeat?: THREE.Vector2;
      uWindowPadding?: THREE.Vector2;
      uNightMix?: number;
      uWallColor?: THREE.Color | string;
      uWindowDayColor?: THREE.Color | string;
      uWindowLitColor?: THREE.Color | string;
      uTime?: number;
      transparent?: boolean;
      toneMapped?: boolean;
    };
  }
}

export default BuildingFacadeMaterial;

