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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Grid,
} from '@mui/material';
import { ArrowBack, SportsSoccer, SportsHockey, SportsBasketball, SportsTennis } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ErrorDetailsDialog, { ErrorDetails } from '@/components/common/ErrorDetailsDialog';

const MotionCard = motion(Card);

const sports = [
  { value: 'Hockey', icon: <SportsHockey /> },
  { value: 'Soccer', icon: <SportsSoccer /> },
  { value: 'Basketball', icon: <SportsBasketball /> },
  { value: 'Softball', icon: <SportsTennis /> },
  { value: 'Baseball', icon: <SportsTennis /> },
  { value: 'Football', icon: <SportsTennis /> },
  { value: 'Volleyball', icon: <SportsTennis /> },
  { value: 'Other', icon: <SportsTennis /> },
];

const colors = [
  '#00D9FF', // Cyan
  '#FF3366', // Pink
  '#00FF94', // Green
  '#FFB800', // Amber
  '#9333EA', // Purple
  '#F97316', // Orange
  '#EF4444', // Red
  '#22C55E', // Emerald
];

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    description: '',
    color: colors[0],
  });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const team = await res.json();
        router.push(`/team/${team.id}`);
      } else {
        const errorData = await res.json();
        console.error('Error creating team:', errorData);
        setErrorDetails({
          message: errorData.error || 'Failed to create team',
          status: res.status,
          details: errorData,
          timestamp: new Date().toISOString(),
          path: '/api/teams',
        });
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setErrorDetails({
        message: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
        details: {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
        },
        timestamp: new Date().toISOString(),
        path: '/api/teams',
      });
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
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
          Create a Team
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set up your team and invite players to join
        </Typography>
      </Box>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                placeholder="e.g., Thunder Hawks"
              />

              <FormControl fullWidth required>
                <InputLabel>Sport</InputLabel>
                <Select
                  value={formData.sport}
                  label="Sport"
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                >
                  {sports.map((sport) => (
                    <MenuItem key={sport.value} value={sport.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {sport.icon}
                        {sport.value}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Tell us about your team..."
              />

              {/* Color Picker */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Team Color
                </Typography>
                <Grid container spacing={1}>
                  {colors.map((color) => (
                    <Grid item key={color}>
                      <Box
                        onClick={() => setFormData({ ...formData, color })}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: '3px solid',
                          borderColor: formData.color === color ? '#FFFFFF' : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Preview */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: alpha(formData.color, 0.1),
                  borderLeft: `4px solid ${formData.color}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Preview
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formData.name || 'Your Team Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.sport || 'Sport'} • 1 player
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !formData.name || !formData.sport}
                sx={{ mt: 2 }}
              >
                {loading ? 'Creating...' : 'Create Team'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </MotionCard>

      <ErrorDetailsDialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        error={errorDetails}
        title="Failed to Create Team"
      />
    </Box>
  );
}
