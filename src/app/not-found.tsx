'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#090a0f',
        color: '#f8fafc',
        gap: '16px',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontWeight: 800, color: '#818cf8', fontSize: '48px', margin: 0 }}>404</h1>
      <h2 style={{ margin: 0 }}>Không tìm thấy phòng này</h2>
      <Link
        href="/"
        style={{
          backgroundColor: '#6366f1',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 700,
        }}
      >
        Về phòng mặc định
      </Link>
    </div>
  );
}
