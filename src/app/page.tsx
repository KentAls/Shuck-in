'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
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

  if (session) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
