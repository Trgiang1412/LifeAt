'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RoomClient from '@/components/RoomClient';
import AuthGuard from '@/components/auth/AuthGuard';
import { CircularProgress, Box } from '@mui/material';

function RoomWithParams() {
  const searchParams = useSearchParams();
  const spaceCode = searchParams.get('space') || 'M7KQ-ILKC';
  const host = searchParams.get('host') || "Trường's Room";

  return (
    <RoomClient
      roomId="a7263e68-b5e5-4a63-8017-5defd71b31fc"
      initialSpaceCode={spaceCode}
      initialHost={host}
    />
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              height: '100vh',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#090a0f',
            }}
          >
            <CircularProgress sx={{ color: '#818cf8' }} />
          </Box>
        }
      >
        <RoomWithParams />
      </Suspense>
    </AuthGuard>
  );
}
