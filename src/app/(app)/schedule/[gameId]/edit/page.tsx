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
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { useError } from '@/components/providers/ErrorProvider';

const MotionCard = motion(Card);

const gameTypes = [
  { value: 'GAME', label: 'Game' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'SCRIMMAGE', label: 'Scrimmage' },
  { value: 'TOURNAMENT', label: 'Tournament' },
  { value: 'OTHER', label: 'Other' },
];

interface Game {
  id: string;
  title: string;
  opponent: string | null;
  location: string;
  address: string | null;
  startTime: string;
  endTime: string | null;
  gameType: string;
  notes: string | null;
  rsvpDeadline: string | null;
  team: {
    id: string;
    name: string;
    color: string;
    sport: string;
  };
  userRole: string | null;
}

export default function EditGamePage({
  params,
}: {
  params: { gameId: string };
}) {
  const { gameId } = params;
  const router = useRouter();
  const { showApiError, showNetworkError } = useError();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    opponent: '',
    location: '',
    address: '',
    gameType: 'GAME',
    startTime: '',
    endTime: '',
    notes: '',
    rsvpDeadline: '',
  });

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data);

          // Check if user can edit
          if (data.userRole !== 'OWNER' && data.userRole !== 'ADMIN') {
            setError('You do not have permission to edit this game');
            return;
          }

          setFormData({
            title: data.title || '',
            opponent: data.opponent || '',
            location: data.location || '',
            address: data.address || '',
            gameType: data.gameType || 'GAME',
            startTime: data.startTime ? format(new Date(data.startTime), "yyyy-MM-dd'T'HH:mm") : '',
            endTime: data.endTime ? format(new Date(data.endTime), "yyyy-MM-dd'T'HH:mm") : '',
            notes: data.notes || '',
            rsvpDeadline: data.rsvpDeadline ? format(new Date(data.rsvpDeadline), "yyyy-MM-dd'T'HH:mm") : '',
          });
        } else if (res.status === 403) {
          setError('You do not have permission to view this game');
        } else if (res.status === 404) {
          setError('Game not found');
        } else {
          setError('Failed to load game');
        }
      } catch (err) {
        setError('Failed to load game');
      } finally {
        setFetching(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
          rsvpDeadline: formData.rsvpDeadline ? new Date(formData.rsvpDeadline).toISOString() : null,
          opponent: formData.opponent || null,
          address: formData.address || null,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        router.push(`/schedule/${gameId}`);
      } else {
        await showApiError(res, 'Failed to update game');
      }
    } catch (err) {
      showNetworkError(err, `/api/games/${gameId}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={150} height={40} sx={{ mb: 2 }} />
          <Skeleton width={250} height={40} />
          <Skeleton width={350} height={24} />
        </Box>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={100} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/schedule"
            startIcon={<ArrowBack />}
            sx={{ mb: 2, color: 'text.secondary' }}
          >
            Back to Schedule
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} href="/schedule" variant="contained">
          Go to Schedule
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href={`/schedule/${gameId}`}
          startIcon={<ArrowBack />}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Event
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Edit Event
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update event details for {game?.team.name}
        </Typography>
      </Box>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                {/* Event Type */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      value={formData.gameType}
                      label="Event Type"
                      onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                    >
                      {gameTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Opponent (for games) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Opponent"
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    fullWidth
                    placeholder="e.g., Rival Team"
                    disabled={formData.gameType === 'PRACTICE'}
                  />
                </Grid>
              </Grid>

              {/* Title */}
              <TextField
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
                placeholder={formData.gameType === 'GAME' ? 'e.g., League Game' : 'e.g., Team Practice'}
              />

              {/* Location */}
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                fullWidth
                placeholder="e.g., City Arena"
              />

              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                fullWidth
                placeholder="e.g., 123 Main St, City, State"
              />

              <Grid container spacing={2}>
                {/* Start Time */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Time"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* End Time */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Time"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* RSVP Deadline */}
              <TextField
                label="RSVP Deadline (Optional)"
                type="datetime-local"
                value={formData.rsvpDeadline}
                onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Players will be reminded to RSVP before this time"
              />

              {/* Notes */}
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Any additional information for players..."
              />

              {/* Preview */}
              {game && formData.title && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: alpha(game.team.color, 0.1),
                    borderLeft: `4px solid ${game.team.color}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Preview
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formData.title}
                    {formData.opponent && ` vs ${formData.opponent}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.team.name} • {formData.startTime && format(new Date(formData.startTime), 'EEE, MMM d @ h:mm a')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.location}
                  </Typography>
                </Box>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  href={`/schedule/${gameId}`}
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
                  disabled={loading || !formData.title || !formData.location}
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
