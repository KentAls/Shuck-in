'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import LandingPage from '@/components/landing/LandingPage';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#00D9FF' }} />
      </Box>
    );
  }

  if (isLoggedIn) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#00D9FF' }} />
      </Box>
    );
  }

  return <LandingPage />;
}
