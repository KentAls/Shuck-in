'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  IconButton,
  Divider,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AccessTime,
  CalendarMonth,
  Event,
  Share,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  HelpOutline,
  Download,
  Message,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

const MotionCard = motion(Card);

interface Rsvp {
  id: string;
  status: string;
  comment: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    jerseyNumber: string | null;
    position: string | null;
  };
}

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
  rsvps: Rsvp[];
  userRole: string | null;
  userRsvp: Rsvp | null;
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'IN' | 'OUT' | 'MAYBE'>('IN');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        if (data.userRsvp) {
          setSelectedStatus(data.userRsvp.status);
          setComment(data.userRsvp.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSubmit = async () => {
    if (!game) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, comment }),
      });

      if (res.ok) {
        const updatedRsvp = await res.json();
        setGame({
          ...game,
          userRsvp: updatedRsvp,
          rsvps: game.rsvps.map((r) =>
            r.user.id === user?.id ? updatedRsvp : r
          ),
        });
        setRsvpDialogOpen(false);
        setSnackbar({ open: true, message: 'RSVP updated!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update RSVP', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRsvp = async (status: 'IN' | 'OUT' | 'MAYBE') => {
    setSelectedStatus(status);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchGame();
        setSnackbar({ open: true, message: `You're ${status}!`, severity: 'success' });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCalendar = () => {
    window.open(`/api/games/${gameId}/calendar`, '_blank');
  };

  const canManageGame = game?.userRole === 'OWNER' || game?.userRole === 'ADMIN';

  const getRsvpsByStatus = (status: string) => {
    return game?.rsvps.filter((r) => r.status === status) || [];
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!game) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Game not found
        </Typography>
        <Button component={Link} href="/schedule" variant="contained">
          Back to Schedule
        </Button>
      </Box>
    );
  }

  const isPastGame = isPast(new Date(game.startTime));

  return (
    <Box>
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

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Chip
                label={game.gameType}
                sx={{
                  backgroundColor: alpha(game.team.color, 0.15),
                  color: game.team.color,
                  fontWeight: 600,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {game.team.name}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {game.title}
              {game.opponent && ` vs ${game.opponent}`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadCalendar}
            >
              Add to Calendar
            </Button>
            {canManageGame && (
              <Button
                component={Link}
                href={`/schedule/${gameId}/edit`}
                variant="outlined"
                startIcon={<Edit />}
              >
                Edit
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          {/* Game Details Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Date & Time */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: alpha(game.team.color, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarMonth sx={{ color: game.team.color }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {format(new Date(game.startTime), 'EEEE, MMMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(game.startTime), 'h:mm a')}
                      {game.endTime && ` - ${format(new Date(game.endTime), 'h:mm a')}`}
                      {' • '}
                      {isPastGame ? 'Completed' : formatDistanceToNow(new Date(game.startTime), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: alpha('#FF3366', 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocationOn sx={{ color: '#FF3366' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {game.location}
                    </Typography>
                    {game.address && (
                      <Typography variant="body2" color="text.secondary">
                        {game.address}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Notes */}
                {game.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Notes
                      </Typography>
                      <Typography variant="body1">{game.notes}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* RSVP List */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Attendance
              </Typography>

              {/* RSVP Summary */}
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha('#00FF94', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <CheckCircle sx={{ color: '#00FF94', fontSize: 32, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#00FF94' }}>
                    {getRsvpsByStatus('IN').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha('#FFB800', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <HelpOutline sx={{ color: '#FFB800', fontSize: 32, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFB800' }}>
                    {getRsvpsByStatus('MAYBE').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maybe
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha('#FF4757', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Cancel sx={{ color: '#FF4757', fontSize: 32, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF4757' }}>
                    {getRsvpsByStatus('OUT').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha('#64748B', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <HelpOutline sx={{ color: '#64748B', fontSize: 32, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#64748B' }}>
                    {getRsvpsByStatus('PENDING').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No Response
                  </Typography>
                </Box>
              </Stack>

              {/* Player Lists */}
              {['IN', 'MAYBE', 'OUT', 'PENDING'].map((status) => {
                const statusRsvps = getRsvpsByStatus(status);
                if (statusRsvps.length === 0) return null;

                return (
                  <Box key={status} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        color: status === 'IN' ? '#00FF94' : status === 'OUT' ? '#FF4757' : status === 'MAYBE' ? '#FFB800' : 'text.secondary',
                      }}
                    >
                      {status === 'IN' ? 'Going' : status === 'OUT' ? 'Not Going' : status === 'MAYBE' ? 'Maybe' : 'No Response'} ({statusRsvps.length})
                    </Typography>
                    <Grid container spacing={1}>
                      {statusRsvps.map((rsvp) => (
                        <Grid item xs={12} sm={6} key={rsvp.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            }}
                          >
                            <Avatar
                              src={rsvp.user.image || undefined}
                              alt={rsvp.user.name || 'Player'}
                              sx={{ width: 36, height: 36 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                                {rsvp.user.name || 'Unknown'}
                              </Typography>
                              {rsvp.user.jerseyNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  #{rsvp.user.jerseyNumber}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Your RSVP */}
          <Card sx={{ mb: 3, borderColor: game.team.color, borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Your Status
              </Typography>

              {game.userRsvp ? (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Chip
                    icon={
                      game.userRsvp.status === 'IN' ? <CheckCircle /> :
                      game.userRsvp.status === 'OUT' ? <Cancel /> :
                      <HelpOutline />
                    }
                    label={`You're ${game.userRsvp.status}`}
                    color={
                      game.userRsvp.status === 'IN' ? 'success' :
                      game.userRsvp.status === 'OUT' ? 'error' :
                      'warning'
                    }
                    sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                  You haven&apos;t responded yet
                </Typography>
              )}

              {/* Quick RSVP Buttons */}
              <Stack spacing={1}>
                <Button
                  variant={game.userRsvp?.status === 'IN' ? 'contained' : 'outlined'}
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleQuickRsvp('IN')}
                  disabled={submitting || isPastGame}
                  fullWidth
                >
                  I&apos;m In
                </Button>
                <Button
                  variant={game.userRsvp?.status === 'MAYBE' ? 'contained' : 'outlined'}
                  color="warning"
                  startIcon={<HelpOutline />}
                  onClick={() => handleQuickRsvp('MAYBE')}
                  disabled={submitting || isPastGame}
                  fullWidth
                >
                  Maybe
                </Button>
                <Button
                  variant={game.userRsvp?.status === 'OUT' ? 'contained' : 'outlined'}
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleQuickRsvp('OUT')}
                  disabled={submitting || isPastGame}
                  fullWidth
                >
                  Can&apos;t Make It
                </Button>
              </Stack>

              {game.rsvpDeadline && !isPastGame && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  RSVP by {format(new Date(game.rsvpDeadline), 'MMM d, h:mm a')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadCalendar}
                  fullWidth
                >
                  Add to Calendar
                </Button>
                <Button
                  component={Link}
                  href={`/chat?team=${game.team.id}`}
                  variant="outlined"
                  startIcon={<Message />}
                  fullWidth
                >
                  Team Chat
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
