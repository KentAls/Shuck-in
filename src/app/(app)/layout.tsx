'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import AppShell from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0A0E17',
        }}
      >
        <CircularProgress sx={{ color: '#00D9FF' }} />
      </Box>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return <AppShell>{children}</AppShell>;
}
