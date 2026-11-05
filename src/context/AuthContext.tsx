'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  taiKhoan: string;
  tenDangNhap: string;
  tien: number;
  roomId: string;
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
          setUser(JSON.parse(savedUser));
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
            setUser(data.user);
            localStorage.setItem('lifeat_user', JSON.stringify(data.user));
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

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('lifeat_jwt_token', data.token);
      localStorage.setItem('lifeat_user', JSON.stringify(data.user));

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

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('lifeat_jwt_token', data.token);
      localStorage.setItem('lifeat_user', JSON.stringify(data.user));

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
          setUser(data.user);
          localStorage.setItem('lifeat_user', JSON.stringify(data.user));
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

