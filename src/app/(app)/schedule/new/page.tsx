'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowBack, CalendarMonth, SportsSoccer } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format, addHours } from 'date-fns';
import { useError } from '@/components/providers/ErrorProvider';

const MotionCard = motion(Card);

interface Team {
  id: string;
  name: string;
  color: string;
  sport: string;
}

const gameTypes = [
  { value: 'GAME', label: 'Game' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'SCRIMMAGE', label: 'Scrimmage' },
  { value: 'TOURNAMENT', label: 'Tournament' },
  { value: 'OTHER', label: 'Other' },
];

export default function NewGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showApiError, showNetworkError } = useError();
  const preselectedTeam = searchParams.get('team');

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teamId: preselectedTeam || '',
    title: '',
    opponent: '',
    location: '',
    address: '',
    gameType: 'GAME',
    startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(new Date(), 3), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    rsvpDeadline: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeams(data);
          if (!preselectedTeam && data.length === 1) {
            setFormData((prev) => ({ ...prev, teamId: data[0].id }));
          }
        }
      } else {
        await showApiError(res, 'Failed to load teams');
      }
    } catch (error) {
      showNetworkError(error, '/api/teams');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
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
        const game = await res.json();
        router.push(`/schedule/${game.id}`);
      } else {
        await showApiError(res, 'Failed to create game');
      }
    } catch (error) {
      showNetworkError(error, '/api/games');
    } finally {
      setLoading(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === formData.teamId);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href="/schedule"
          startIcon={<ArrowBack />}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Schedule
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Schedule New Event
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a game, practice, or other event for your team
        </Typography>
      </Box>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Team Selection */}
              <FormControl fullWidth required>
                <InputLabel>Team</InputLabel>
                <Select
                  value={formData.teamId}
                  label="Team"
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: team.color,
                          }}
                        />
                        {team.name} ({team.sport})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
              {selectedTeam && formData.title && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: alpha(selectedTeam.color, 0.1),
                    borderLeft: `4px solid ${selectedTeam.color}`,
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
                    {selectedTeam.name} • {format(new Date(formData.startTime), 'EEE, MMM d @ h:mm a')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.location}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !formData.teamId || !formData.title || !formData.location}
                sx={{ mt: 2 }}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </MotionCard>
    </Box>
  );
}
