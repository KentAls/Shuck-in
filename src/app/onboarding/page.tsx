'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  alpha,
} from '@mui/material';
import { Person, Phone, SportsSoccer, ArrowForward, ArrowBack } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

const MotionBox = motion(Box);

const steps = ['Your Info', 'Player Details', 'Get Started'];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: '',
    jerseyNumber: '',
    position: '',
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || null,
          phone: formData.phone || null,
          jerseyNumber: formData.jerseyNumber || null,
          position: formData.position || null,
        }),
      });

      if (res.ok) {
        await updateSession({ name: formData.name });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
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
          background: `
            radial-gradient(circle at 30% 30%, ${alpha('#00D9FF', 0.1)} 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, ${alpha('#FF3366', 0.08)} 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome! Let&apos;s set up your profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This will help your teammates identify you
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form Card */}
        <Card
          sx={{
            background: 'linear-gradient(145deg, #1E293B 0%, #121827 100%)',
            border: '1px solid',
            borderColor: alpha('#00D9FF', 0.2),
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <MotionBox
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Stack spacing={3}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Your Information
                    </Typography>

                    <TextField
                      label="Display Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      fullWidth
                      placeholder="How should we call you?"
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />

                    <TextField
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      fullWidth
                      placeholder="+1 (555) 123-4567"
                      helperText="For game reminders - we'll text you if you haven't RSVP'd"
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Stack>
                </MotionBox>
              )}

              {activeStep === 1 && (
                <MotionBox
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Stack spacing={3}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Player Details (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This info will be shown to your teammates
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Jersey Number"
                        value={formData.jerseyNumber}
                        onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                        sx={{ width: 150 }}
                        placeholder="#"
                      />
                      <TextField
                        label="Position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        fullWidth
                        placeholder="e.g., Forward, Defense"
                      />
                    </Box>
                  </Stack>
                </MotionBox>
              )}

              {activeStep === 2 && (
                <MotionBox
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  sx={{ textAlign: 'center' }}
                >
                  <SportsSoccer sx={{ fontSize: 80, color: '#00D9FF', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    You&apos;re all set!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Create a team or join an existing one to get started
                  </Typography>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleComplete}
                  disabled={loading}
                  endIcon={<ArrowForward />}
                >
                  {loading ? 'Saving...' : 'Go to Dashboard'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Skip Button */}
        {activeStep < steps.length - 1 && (
          <Button
            fullWidth
            sx={{ mt: 2, color: 'text.secondary' }}
            onClick={() => router.push('/dashboard')}
          >
            Skip for now
          </Button>
        )}
      </Container>
    </Box>
  );
}
