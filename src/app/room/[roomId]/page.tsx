'use client';

import React, { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import RoomClient from '@/components/RoomClient';
import AuthGuard from '@/components/auth/AuthGuard';
import { CircularProgress, Box } from '@mui/material';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

function RoomContent({ paramsPromise }: { paramsPromise: Promise<{ roomId: string }> }) {
  const { roomId } = use(paramsPromise);
  const searchParams = useSearchParams();
  const spaceCode = searchParams.get('space') || (roomId.startsWith('M7KQ') ? roomId : 'M7KQ-ILKC');
  const host = searchParams.get('host') || (roomId.startsWith('M7KQ') ? `Phòng ${roomId}` : "Trường's Room");

  return (
    <RoomClient
      roomId={roomId}
      initialSpaceCode={spaceCode}
      initialHost={host}
    />
  );
}

export default function RoomPage({ params }: RoomPageProps) {
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
        <RoomContent paramsPromise={params} />
      </Suspense>
    </AuthGuard>
  );
}
