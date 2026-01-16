'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, Typography, Button, Card, CardContent, alpha, CircularProgress } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MotionCard = motion(Card);

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification link has expired or has already been used.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in with the original provider.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, ${alpha('#FF4757', 0.15)} 0%, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            background: 'linear-gradient(145deg, #1E293B 0%, #121827 100%)',
            border: '1px solid',
            borderColor: alpha('#FF4757', 0.3),
            textAlign: 'center',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <ErrorIcon sx={{ fontSize: 80, color: '#FF4757', mb: 2 }} />

            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Authentication Error
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {getErrorMessage()}
            </Typography>

            <Button
              component={Link}
              href="/auth/signin"
              variant="contained"
              size="large"
              sx={{ mr: 2 }}
            >
              Try Again
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              sx={{
                borderColor: alpha('#FFFFFF', 0.3),
                color: '#FFFFFF',
              }}
            >
              Go Home
            </Button>
          </CardContent>
        </MotionCard>
      </Container>
    </Box>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0A0E17 0%, #121827 100%)',
          }}
        >
          <CircularProgress sx={{ color: '#FF4757' }} />
        </Box>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
