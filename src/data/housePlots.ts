export interface HousePlotConfig {
  maLoDat: string;
  tenLoDat: string;
  position: [number, number, number];
  spawnPosition: [number, number, number];
  defaultWallColor: string;
  defaultRoofColor: string;
}

/**
 * Danh sách 10 Lô Đất Nhà Cấp 4 (HOUSE_PLOTS) quy hoạch quanh thành phố.
 * Khi mỗi người dùng đăng nhập, hệ thống sẽ random 1 lô đất chưa có người ở
 * để các ngôi nhà không bao giờ bị trùng vị trí nhau.
 */
export const HOUSE_PLOTS: HousePlotConfig[] = [
  {
    maLoDat: 'PLOT_CAP4_01',
    tenLoDat: 'Lô A1 • Phố Quảng Trường Tây Bắc',
    position: [-10.5, 0, 32],
    spawnPosition: [-10.5, 1.2, 25.5],
    defaultWallColor: '#f5ebd6',
    defaultRoofColor: '#b93829',
  },
  {
    maLoDat: 'PLOT_CAP4_02',
    tenLoDat: 'Lô A2 • Phố Quảng Trường Đông Bắc',
    position: [10.5, 0, 32],
    spawnPosition: [10.5, 1.2, 25.5],
    defaultWallColor: '#e0f2fe',
    defaultRoofColor: '#1e3a8a',
  },
  {
    maLoDat: 'PLOT_CAP4_03',
    tenLoDat: 'Lô B1 • Đại Lộ Dân Cư Bắc',
    position: [-41, 0, 63],
    spawnPosition: [-41, 1.2, 56.5],
    defaultWallColor: '#fce7f3',
    defaultRoofColor: '#991b1b',
  },
  {
    maLoDat: 'PLOT_CAP4_04',
    tenLoDat: 'Lô B2 • Đại Lộ Dân Cư Bắc',
    position: [-27, 0, 63],
    spawnPosition: [-27, 1.2, 56.5],
    defaultWallColor: '#dcfce7',
    defaultRoofColor: '#0f766e',
  },
  {
    maLoDat: 'PLOT_CAP4_05',
    tenLoDat: 'Lô B3 • Đại Lộ Dân Cư Bắc',
    position: [-13, 0, 63],
    spawnPosition: [-13, 1.2, 56.5],
    defaultWallColor: '#f8fafc',
    defaultRoofColor: '#78350f',
  },
  {
    maLoDat: 'PLOT_CAP4_06',
    tenLoDat: 'Lô B4 • Đại Lộ Dân Cư Bắc',
    position: [13, 0, 63],
    spawnPosition: [13, 1.2, 56.5],
    defaultWallColor: '#f5ebd6',
    defaultRoofColor: '#b93829',
  },
  {
    maLoDat: 'PLOT_CAP4_07',
    tenLoDat: 'Lô B5 • Đại Lộ Dân Cư Bắc',
    position: [27, 0, 63],
    spawnPosition: [27, 1.2, 56.5],
    defaultWallColor: '#e0f2fe',
    defaultRoofColor: '#334155',
  },
  {
    maLoDat: 'PLOT_CAP4_08',
    tenLoDat: 'Lô B6 • Đại Lộ Dân Cư Bắc',
    position: [41, 0, 63],
    spawnPosition: [41, 1.2, 56.5],
    defaultWallColor: '#fce7f3',
    defaultRoofColor: '#1e3a8a',
  },
  {
    maLoDat: 'PLOT_CAP4_09',
    tenLoDat: 'Lô C1 • Phố Tây Hồ Câu',
    position: [-63, 0, 32],
    spawnPosition: [-63, 1.2, 25.5],
    defaultWallColor: '#dcfce7',
    defaultRoofColor: '#b93829',
  },
  {
    maLoDat: 'PLOT_CAP4_10',
    tenLoDat: 'Lô C2 • Phố Đông Ẩm Thực',
    position: [63, 0, 32],
    spawnPosition: [63, 1.2, 25.5],
    defaultWallColor: '#f8fafc',
    defaultRoofColor: '#0f766e',
  },
];

export function getPlotByCode(maLoDat?: string): HousePlotConfig {
  if (!maLoDat) return HOUSE_PLOTS[0];
  return HOUSE_PLOTS.find((p) => p.maLoDat === maLoDat) || HOUSE_PLOTS[0];
}

export function pickRandomAvailablePlot(occupiedPlotCodes: string[]): HousePlotConfig {
  const occupiedSet = new Set(occupiedPlotCodes);
  const available = HOUSE_PLOTS.filter((p) => !occupiedSet.has(p.maLoDat));
  const pool = available.length > 0 ? available : HOUSE_PLOTS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

