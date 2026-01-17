'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  alpha,
} from '@mui/material';
import { ArrowBack, Groups, QrCodeScanner } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MotionCard = motion(Card);

export default function JoinTeamPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/team/${data.teamId}`);
      } else {
        const data = await res.json();
        const errorMsg = typeof data?.error === 'string' ? data.error : 'Failed to join team';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href="/team"
          startIcon={<ArrowBack />}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Teams
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Join a Team
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter the invite code to join an existing team
        </Typography>
      </Box>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: alpha('#00D9FF', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Groups sx={{ fontSize: 40, color: '#00D9FF' }} />
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                fullWidth
                placeholder="Enter the team's invite code"
                helperText="Ask your team captain for the invite code"
                InputProps={{
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    letterSpacing: '0.1em',
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !inviteCode.trim()}
                fullWidth
              >
                {loading ? 'Joining...' : 'Join Team'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Don&apos;t have an invite code?
            </Typography>
            <Button
              component={Link}
              href="/team/new"
              variant="outlined"
            >
              Create Your Own Team
            </Button>
          </Box>
        </CardContent>
      </MotionCard>
    </Box>
  );
}
