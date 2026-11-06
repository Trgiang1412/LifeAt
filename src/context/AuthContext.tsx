'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PlayerHouseData {
  id: string;
  tenNha: string;
  loaiNha: string;
  maLoDat: string;
  capDoNha: number;
  moHinhNgoaiThat: string;
  mauTuong: string;
  mauMai: string;
  kichThuocLuoiNoiThat: [number, number];
  danhSachNoiThat: Array<{
    maVatPham: string;
    tenVatPham?: string;
    toaDoLuoiX: number;
    toaDoLuoiZ: number;
    gocXoayDo: number;
  }>;
  danhSachPhuongTienSoHuu?: string[];
}

export interface AuthUser {
  id: string;
  taiKhoan: string;
  tenDangNhap: string;
  tien: number;
  roomId: string;
  diemKinhNghiem?: number;
  trinhDoTiengAnh?: string;
  tuiDo?: Array<{ maVatPham: string; loaiVatPham: string; soLuong: number }>;
  nhaNguoiChoi?: PlayerHouseData;
}

export function getDefaultHouseForUser(tenDangNhap: string = 'Bạn'): PlayerHouseData {
  return {
    id: 'starter-cap4',
    tenNha: `Nhà Cấp 4 của ${tenDangNhap}`,
    loaiNha: 'Nhà Cấp 4 Mái Ngói',
    maLoDat: 'PLOT_STARTER_CAP4',
    capDoNha: 1,
    moHinhNgoaiThat: 'NHA_CAP_4_VN_REALISTIC',
    mauTuong: '#f5ebd6',
    mauMai: '#b93829',
    kichThuocLuoiNoiThat: [10, 10],
    danhSachNoiThat: [
      { maVatPham: 'GIUONG_GO_DON', tenVatPham: 'Giường Gỗ Đơn Ấm Cúng', toaDoLuoiX: 2, toaDoLuoiZ: 2, gocXoayDo: 0 },
      { maVatPham: 'BAN_HOC_DEN_LED', tenVatPham: 'Bàn Học Tiếng Anh & Laptop', toaDoLuoiX: 7, toaDoLuoiZ: 2, gocXoayDo: 0 },
      { maVatPham: 'KE_SACH_OXFORD', tenVatPham: 'Kệ Sách Gỗ Sồi', toaDoLuoiX: 8, toaDoLuoiZ: 2, gocXoayDo: 0 },
      { maVatPham: 'SOFA_GO_PHONG_KHACH', tenVatPham: 'Bộ Trường Kỷ & Bàn Trà', toaDoLuoiX: 3, toaDoLuoiZ: 6, gocXoayDo: 90 },
      { maVatPham: 'KE_TIVI_CO_DIEN', tenVatPham: 'Kệ Tivi Gỗ & Loa Lo-Fi', toaDoLuoiX: 7, toaDoLuoiZ: 6, gocXoayDo: 270 },
      { maVatPham: 'THAM_DET_THO_CAM', tenVatPham: 'Thảm Trải Sàn Phòng Khách', toaDoLuoiX: 5, toaDoLuoiZ: 6, gocXoayDo: 0 },
    ],
  };
}

function normalizeUserWithStarterHouse(u: AuthUser): AuthUser {
  if (!u.nhaNguoiChoi) {
    return {
      ...u,
      nhaNguoiChoi: getDefaultHouseForUser(u.tenDangNhap),
    };
  }
  return u;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (taiKhoan: string, matKhau: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    taiKhoan: string,
    matKhau: string,
    tenDangNhap: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and profile on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('lifeat_jwt_token');
    const savedUser = localStorage.getItem('lifeat_user');

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(normalizeUserWithStarterHouse(JSON.parse(savedUser)));
        } catch {}
      }

      // Fetch fresh data from backend
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            const normalized = normalizeUserWithStarterHouse(data.user);
            setUser(normalized);
            localStorage.setItem('lifeat_user', JSON.stringify(normalized));
          } else {
            // Token expired or invalid
            logout();
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (taiKhoan: string, matKhau: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan, matKhau }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Đăng nhập thất bại.' };
      }

      const normalized = normalizeUserWithStarterHouse(data.user);
      setUser(normalized);
      setToken(data.token);
      localStorage.setItem('lifeat_jwt_token', data.token);
      localStorage.setItem('lifeat_user', JSON.stringify(normalized));

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi đăng nhập.' };
    }
  };

  const register = async (taiKhoan: string, matKhau: string, tenDangNhap: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan, matKhau, tenDangNhap }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Đăng ký thất bại.' };
      }

      const normalized = normalizeUserWithStarterHouse(data.user);
      setUser(normalized);
      setToken(data.token);
      localStorage.setItem('lifeat_jwt_token', data.token);
      localStorage.setItem('lifeat_user', JSON.stringify(normalized));

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi đăng ký.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lifeat_jwt_token');
    localStorage.removeItem('lifeat_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const normalized = normalizeUserWithStarterHouse(data.user);
          setUser(normalized);
          localStorage.setItem('lifeat_user', JSON.stringify(normalized));
        }
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
