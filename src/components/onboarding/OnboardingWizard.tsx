'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Login,
  Groups,
  InstallMobile,
  CheckCircle,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  {
    label: 'Hello Login',
    icon: <Login sx={{ fontSize: 48 }} />,
    title: 'Welcome to Shuck-in!',
    description: 'You\'re signed in with Hellō - a secure, privacy-focused identity provider.',
    details: [
      'Your login is secure and passwordless',
      'Only you control your personal data',
      'Sign in with email, social accounts, or passkeys',
      'No passwords to remember or manage',
    ],
  },
  {
    label: 'Join a Team',
    icon: <Groups sx={{ fontSize: 48 }} />,
    title: 'Connect with Your Team',
    description: 'Create a team or join an existing one using an invite code.',
    details: [
      'Create your own team and invite members',
      'Join a team with an invite code or link',
      'Manage schedules, chat, and media together',
      'Track game scores and team stats',
    ],
  },
  {
    label: 'Install App',
    icon: <InstallMobile sx={{ fontSize: 48 }} />,
    title: 'Add to Home Screen',
    description: 'Install Shuck-in on your device for the best experience.',
    details: [
      'Works offline with cached data',
      'Get push notifications for new messages',
      'Full-screen app experience',
      'Quick access from your home screen',
    ],
    installInstructions: {
      ios: [
        'Tap the Share button at bottom of Safari',
        'Scroll and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
      ],
      android: [
        'Tap the menu icon (⋮) in Chrome',
        'Select "Install app" or "Add to Home Screen"',
        'Confirm the installation',
      ],
    },
  },
];

export default function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
  }, []);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0A0E17 0%, #1E293B 100%)',
          border: '1px solid',
          borderColor: alpha('#00D9FF', 0.2),
          borderRadius: isMobile ? 0 : 3,
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>

        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {/* Stepper */}
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              mb: 4,
              '& .MuiStepLabel-label': {
                color: 'text.secondary',
                '&.Mui-active': { color: '#00D9FF' },
                '&.Mui-completed': { color: '#00D9FF' },
              },
              '& .MuiStepIcon-root': {
                color: alpha('#00D9FF', 0.3),
                '&.Mui-active': { color: '#00D9FF' },
                '&.Mui-completed': { color: '#00D9FF' },
              },
            }}
          >
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minHeight: 320,
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: alpha('#00D9FF', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D9FF',
                mb: 3,
              }}
            >
              {currentStep.icon}
            </Box>

            {/* Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #00D9FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentStep.title}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400 }}
            >
              {currentStep.description}
            </Typography>

            {/* Details */}
            <Box sx={{ textAlign: 'left', width: '100%', maxWidth: 400 }}>
              {currentStep.installInstructions ? (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {isIOS ? 'On iPhone/iPad (Safari):' : 'On Android (Chrome):'}
                  </Typography>
                  {(isIOS
                    ? currentStep.installInstructions.ios
                    : currentStep.installInstructions.android
                  ).map((instruction, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: alpha('#00D9FF', 0.2),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#00D9FF', fontWeight: 600 }}>
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.primary">
                        {instruction}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                currentStep.details.map((detail, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <CheckCircle sx={{ color: '#00D9FF', fontSize: 20 }} />
                    <Typography variant="body2" color="text.primary">
                      {detail}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4,
              gap: 2,
            }}
          >
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
              sx={{
                visibility: activeStep === 0 ? 'hidden' : 'visible',
              }}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep < steps.length - 1 && (
                <Button
                  variant="text"
                  onClick={onComplete}
                  sx={{ color: 'text.secondary' }}
                >
                  Skip
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                sx={{
                  background: 'linear-gradient(135deg, #00D9FF 0%, #00B4D8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00B4D8 0%, #0096C7 100%)',
                  },
                }}
              >
                {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
