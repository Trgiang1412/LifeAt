import type { Metadata } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AuthProvider } from '@/context/AuthContext';
import RoomInvitationListener from '@/components/layout/RoomInvitationListener';

export const metadata: Metadata = {
  title: "LifeAt Spaces - Virtual Coworking & Study Room",
  description: "Immersive virtual focus spaces with Pomodoro timer, ambient soundscapes, lofi beats, and co-working features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
            <RoomInvitationListener />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
