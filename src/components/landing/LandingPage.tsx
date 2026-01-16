'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import {
  SportsSoccer,
  Groups,
  CalendarMonth,
  Chat,
  NotificationsActive,
  CheckCircle,
} from '@mui/icons-material';
import Link from 'next/link';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const features = [
  {
    icon: <Groups sx={{ fontSize: 40 }} />,
    title: 'Team Management',
    description: 'Manage your roster, track player info, and keep everyone organized.',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    title: 'Game Scheduling',
    description: 'Schedule games and practices with easy calendar sync.',
  },
  {
    icon: <CheckCircle sx={{ fontSize: 40 }} />,
    title: 'Game Check-in',
    description: "Know who's showing up. Get instant RSVP status for every game.",
  },
  {
    icon: <Chat sx={{ fontSize: 40 }} />,
    title: 'Team Chat',
    description: 'Real-time chat keeps your team connected and coordinated.',
  },
  {
    icon: <NotificationsActive sx={{ fontSize: 40 }} />,
    title: 'SMS Reminders',
    description: "Auto-remind players who haven't checked in via SMS.",
  },
  {
    icon: <SportsSoccer sx={{ fontSize: 40 }} />,
    title: 'Any Sport',
    description: 'Hockey, soccer, basketball, softball - we got you covered.',
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0A0E17 0%, #121827 50%, #0A0E17 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 50%, ${alpha('#00D9FF', 0.15)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha('#FF3366', 0.1)} 0%, transparent 40%),
              radial-gradient(circle at 40% 80%, ${alpha('#00FF94', 0.08)} 0%, transparent 40%)
            `,
            pointerEvents: 'none',
          },
        }}
      >
        {/* Animated background elements */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(5)].map((_, i) => (
            <MotionBox
              key={i}
              sx={{
                position: 'absolute',
                width: { xs: 200, md: 400 },
                height: { xs: 200, md: 400 },
                borderRadius: '50%',
                border: '1px solid',
                borderColor: alpha('#00D9FF', 0.1),
              }}
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    fontWeight: 800,
                    mb: 2,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #00D9FF 50%, #FF3366 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Get Your Team
                  <br />
                  Shucked In
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    color: 'text.secondary',
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  The sports team management app that actually works.
                  Schedule games, track attendance, and stop chasing people
                  to see if they&apos;re showing up.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    component={Link}
                    href="/auth/signin"
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      borderColor: alpha('#FFFFFF', 0.3),
                      color: '#FFFFFF',
                      '&:hover': {
                        borderColor: '#00D9FF',
                        backgroundColor: alpha('#00D9FF', 0.05),
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Stack>
              </MotionBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                sx={{
                  position: 'relative',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                {/* Phone mockup placeholder */}
                <Box
                  sx={{
                    width: 300,
                    height: 600,
                    mx: 'auto',
                    borderRadius: 6,
                    background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
                    border: '3px solid',
                    borderColor: alpha('#00D9FF', 0.3),
                    boxShadow: `0 20px 60px ${alpha('#00D9FF', 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <SportsSoccer sx={{ fontSize: 120, color: alpha('#00D9FF', 0.2) }} />
                </Box>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>

        {/* Scroll indicator */}
        <MotionBox
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Box
            sx={{
              width: 30,
              height: 50,
              borderRadius: 15,
              border: '2px solid',
              borderColor: alpha('#FFFFFF', 0.3),
              display: 'flex',
              justifyContent: 'center',
              pt: 1,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 12,
                borderRadius: 2,
                backgroundColor: '#00D9FF',
              }}
            />
          </Box>
        </MotionBox>
      </Box>

      {/* Features Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: '#0A0E17',
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            sx={{ textAlign: 'center', mb: 8 }}
          >
            <Typography
              variant="h2"
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #00D9FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Everything Your Team Needs
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Stop using group texts and spreadsheets. Get everyone on the same page.
            </Typography>
          </MotionBox>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(145deg, #121827 0%, #0F172A 100%)',
                    '&:hover': {
                      '& .feature-icon': {
                        color: '#00D9FF',
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      className="feature-icon"
                      sx={{
                        color: alpha('#00D9FF', 0.7),
                        mb: 2,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${alpha('#00D9FF', 0.1)} 0%, ${alpha('#FF3366', 0.1)} 100%)`,
          borderTop: '1px solid',
          borderColor: alpha('#00D9FF', 0.2),
        }}
      >
        <Container maxWidth="md">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            sx={{ textAlign: 'center' }}
          >
            <Typography variant="h2" sx={{ mb: 2 }}>
              Ready to Level Up?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Join the teams that stopped chasing people for attendance confirmations.
            </Typography>
            <Button
              component={Link}
              href="/auth/signin"
              variant="contained"
              size="large"
              sx={{
                py: 2,
                px: 6,
                fontSize: '1.2rem',
              }}
            >
              Start For Free
            </Button>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: '#0A0E17',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Shuck-in - Get your team organized
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
