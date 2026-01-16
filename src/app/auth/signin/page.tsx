'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  Stack,
  Alert,
  alpha,
  InputAdornment,
} from '@mui/material';
import { Google, Email, SportsSoccer } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MotionCard = motion(Card);

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const result = await signIn('email', {
      email,
      callbackUrl,
      redirect: false,
    });

    if (result?.ok) {
      setEmailSent(true);
    }
    setIsLoading(false);
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
                {error === 'OAuthAccountNotLinked'
                  ? 'This email is already associated with another account.'
                  : 'An error occurred during sign in.'}
              </Alert>
            )}

            {/* Email Sent Success */}
            {emailSent ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Check your email! We sent you a magic link to sign in.
              </Alert>
            ) : (
              <>
                {/* Google Sign In */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Google />}
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderColor: alpha('#FFFFFF', 0.2),
                    color: '#FFFFFF',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      backgroundColor: alpha('#FFFFFF', 0.05),
                    },
                  }}
                >
                  Continue with Google
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    or
                  </Typography>
                </Divider>

                {/* Email Sign In */}
                <form onSubmit={handleEmailSignIn}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading || !email}
                      sx={{ py: 1.5 }}
                    >
                      Send Magic Link
                    </Button>
                  </Stack>
                </form>
              </>
            )}

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
