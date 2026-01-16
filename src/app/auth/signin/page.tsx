'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  alpha,
  CircularProgress,
} from '@mui/material';
import { SportsSoccer, Login } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

const MotionCard = motion(Card);

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleSignIn = () => {
    // Redirect to Hello.coop login
    window.location.href = '/api/hellocoop?op=login&target_uri=/dashboard';
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#00D9FF' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 30% 30%, ${alpha('#00D9FF', 0.15)} 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, ${alpha('#FF3366', 0.1)} 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionCard
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            background: 'linear-gradient(145deg, #1E293B 0%, #121827 100%)',
            border: '1px solid',
            borderColor: alpha('#00D9FF', 0.2),
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <SportsSoccer sx={{ fontSize: 40, color: '#00D9FF' }} />
                  <Typography
                    variant="h4"
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
              </Link>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Sign in to manage your team
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                An error occurred during sign in. Please try again.
              </Alert>
            )}

            {/* Hello Sign In Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Login />}
              onClick={handleSignIn}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5EEBFF 0%, #00D9FF 100%)',
                },
              }}
            >
              Continue with Hello
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 3 }}
            >
              Sign in with your email, Google, Apple, or other accounts through Hello.coop
            </Typography>

            {/* Terms */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 4 }}
            >
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </CardContent>
        </MotionCard>
      </Container>
    </Box>
  );
}
