'use client';

import { useState, useEffect } from 'react';
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
  Skeleton,
  Alert,
} from '@mui/material';
import { ArrowBack, SportsSoccer, SportsHockey, SportsBasketball, SportsTennis } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useError } from '@/components/providers/ErrorProvider';

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

export default function EditTeamPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { teamId } = params;
  const router = useRouter();
  const { showApiError, showNetworkError } = useError();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    description: '',
    color: colors[0],
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        if (res.ok) {
          const team = await res.json();
          setFormData({
            name: team.name || '',
            sport: team.sport || '',
            description: team.description || '',
            color: team.color || colors[0],
          });
        } else if (res.status === 403) {
          setError('You do not have permission to edit this team');
        } else if (res.status === 404) {
          setError('Team not found');
        } else {
          setError('Failed to load team');
        }
      } catch (err) {
        setError('Failed to load team');
      } finally {
        setFetching(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/team/${teamId}`);
      } else {
        await showApiError(res, 'Failed to update team');
      }
    } catch (err) {
      showNetworkError(err, `/api/teams/${teamId}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={120} height={40} sx={{ mb: 2 }} />
          <Skeleton width={200} height={40} />
          <Skeleton width={280} height={24} />
        </Box>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={100} />
              <Skeleton variant="rounded" height={60} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/team"
            startIcon={<ArrowBack />}
            sx={{ mb: 2, color: 'text.secondary' }}
          >
            Back to Teams
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} href="/team" variant="contained">
          Go to Teams
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href={`/team/${teamId}`}
          startIcon={<ArrowBack />}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Team
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Edit Team
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update your team settings
        </Typography>
      </Box>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
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
                  {formData.sport || 'Sport'}
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  href={`/team/${teamId}`}
                  variant="outlined"
                  fullWidth
                  sx={{ order: { xs: 2, sm: 1 } }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !formData.name || !formData.sport}
                  fullWidth
                  sx={{ order: { xs: 1, sm: 2 } }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </MotionCard>
    </Box>
  );
}
