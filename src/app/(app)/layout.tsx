'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/auth/signin');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
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

  if (!isLoggedIn) {
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

  return <AppShell>{children}</AppShell>;
}
