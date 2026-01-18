'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Button, Typography } from '@mui/material';
import { SportsSoccer, Login } from '@mui/icons-material';
import LandingPage from '@/components/landing/LandingPage';
import { useAuth } from '@/components/providers/AuthProvider';

const RETURNING_USER_KEY = 'shuckin_returning_user';

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if returning user
    const returning = localStorage.getItem(RETURNING_USER_KEY);
    setIsReturningUser(returning === 'true');
  }, []);

  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      // Mark as returning user when they successfully log in
      localStorage.setItem(RETURNING_USER_KEY, 'true');
      router.push('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isReturningUser === null) {
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

  // Returning user - show quick sign in screen
  if (isReturningUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <SportsSoccer sx={{ fontSize: 48, color: '#00D9FF' }} />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #00D9FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Shuck-in
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
          Welcome back!
        </Typography>

        <Button
          variant="contained"
          size="large"
          href="/api/hellocoop?op=login"
          startIcon={<Login />}
          sx={{
            py: 2,
            px: 6,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #00D9FF 0%, #00B4D8 100%)',
            mb: 3,
          }}
        >
          Sign In
        </Button>

        <Button
          variant="text"
          onClick={() => setIsReturningUser(false)}
          sx={{ color: 'text.secondary' }}
        >
          View landing page
        </Button>
      </Box>
    );
  }

  return <LandingPage />;
}
