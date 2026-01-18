'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  Stack,
  Skeleton,
  alpha,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CalendarMonth,
  LocationOn,
  AccessTime,
  ArrowForward,
  Add,
  Groups,
  EmojiEvents,
  TrendingUp,
  CheckCircle,
  Cancel,
  HelpOutline,
  PersonAdd,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

const MotionCard = motion(Card);

interface Game {
  id: string;
  title: string;
  opponent: string | null;
  location: string;
  startTime: string;
  gameType: string;
  team: {
    name: string;
    color: string;
  };
  _count: {
    rsvps: number;
  };
  rsvps: Array<{
    status: string;
    user: {
      name: string | null;
      image: string | null;
    };
  }>;
  userRsvp?: {
    status: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
  _count: {
    members: number;
  };
}

interface UserStats {
  gamesPlayed: number;
  attendanceRate: number;
}

const ONBOARDING_KEY = 'shuckin_onboarding_complete';

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ gamesPlayed: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, teamsRes, statsRes] = await Promise.all([
          fetch('/api/games/upcoming'),
          fetch('/api/teams'),
          fetch('/api/user/stats'),
        ]);

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setUpcomingGames(gamesData);
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRsvpColor = (status: string) => {
    switch (status) {
      case 'IN':
        return 'success';
      case 'OUT':
        return 'error';
      case 'MAYBE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRsvpIcon = (status: string) => {
    switch (status) {
      case 'IN':
        return <CheckCircle fontSize="small" />;
      case 'OUT':
        return <Cancel fontSize="small" />;
      case 'MAYBE':
        return <HelpOutline fontSize="small" />;
      default:
        return null;
    }
  };

  // Games that need RSVP (no response or pending)
  const pendingRsvpGames = upcomingGames.filter(
    (game) => !game.userRsvp || game.userRsvp.status === 'PENDING'
  );

  const handleQuickRsvp = async (gameId: string, status: 'IN' | 'OUT' | 'MAYBE') => {
    setRsvpLoading(gameId);
    try {
      const res = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updatedRsvp = await res.json();
        // Update the games list with the new RSVP status
        setUpcomingGames((prev) =>
          prev.map((game) =>
            game.id === gameId
              ? { ...game, userRsvp: { status: updatedRsvp.status } }
              : game
          )
        );
        setSnackbar({ open: true, message: `You're ${status}!`, severity: 'success' });
      } else {
        const data = await res.json();
        setSnackbar({ open: true, message: data.error || 'Failed to update RSVP', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Network error. Please try again.', severity: 'error' });
    } finally {
      setRsvpLoading(null);
    }
  };

  // If user has no teams, show join team prompt
  if (!loading && teams.length === 0) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome, {user?.name?.split(' ')[0] || 'Player'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get started by joining or creating a team
          </Typography>
        </Box>

        <Card sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <Groups sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            You&apos;re not on any teams yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Join an existing team with an invite code, or create your own team to get started.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/team/join"
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
            >
              Join a Team
            </Button>
            <Button
              component={Link}
              href="/team/new"
              variant="outlined"
              size="large"
              startIcon={<Add />}
            >
              Create a Team
            </Button>
          </Stack>
        </Card>

        {/* Onboarding Wizard */}
        <OnboardingWizard
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Player'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what&apos;s happening with your teams
        </Typography>
      </Box>

      {/* Pending RSVPs Alert */}
      {pendingRsvpGames.length > 0 && (
        <MotionCard
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${alpha('#FFB800', 0.2)} 0%, ${alpha('#FF3366', 0.1)} 100%)`,
            border: '1px solid',
            borderColor: alpha('#FFB800', 0.3),
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutline sx={{ color: '#FFB800' }} />
              You have {pendingRsvpGames.length} game{pendingRsvpGames.length > 1 ? 's' : ''} awaiting your response
            </Typography>
            <Stack spacing={2}>
              {pendingRsvpGames.slice(0, 3).map((game) => (
                <Box
                  key={game.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha('#000', 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Link href={`/schedule/${game.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <Box sx={{ cursor: 'pointer' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
                          {game.title}{game.opponent && ` vs ${game.opponent}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {game.team.name} • {format(new Date(game.startTime), 'EEE, MMM d @ h:mm a')}
                        </Typography>
                      </Box>
                    </Link>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      startIcon={rsvpLoading === game.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                      onClick={() => handleQuickRsvp(game.id, 'IN')}
                      disabled={rsvpLoading === game.id}
                      sx={{ flex: 1 }}
                    >
                      I&apos;m In
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      startIcon={<HelpOutline />}
                      onClick={() => handleQuickRsvp(game.id, 'MAYBE')}
                      disabled={rsvpLoading === game.id}
                      sx={{ flex: 1 }}
                    >
                      Maybe
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleQuickRsvp(game.id, 'OUT')}
                      disabled={rsvpLoading === game.id}
                      sx={{ flex: 1 }}
                    >
                      Out
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </MotionCard>
      )}

      {/* Quick Stats - Now Clickable */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Link href="/team" style={{ textDecoration: 'none' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha('#00D9FF', 0.15)} 0%, ${alpha('#00D9FF', 0.05)} 100%)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}>
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <Groups sx={{ fontSize: { xs: 32, sm: 40 }, color: '#00D9FF', mb: 0.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {teams.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Teams
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Link href="/schedule" style={{ textDecoration: 'none' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha('#FF3366', 0.15)} 0%, ${alpha('#FF3366', 0.05)} 100%)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}>
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <CalendarMonth sx={{ fontSize: { xs: 32, sm: 40 }, color: '#FF3366', mb: 0.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {upcomingGames.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Upcoming
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Link href="/schedule" style={{ textDecoration: 'none' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha('#00FF94', 0.15)} 0%, ${alpha('#00FF94', 0.05)} 100%)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}>
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <EmojiEvents sx={{ fontSize: { xs: 32, sm: 40 }, color: '#00FF94', mb: 0.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {userStats.gamesPlayed}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Games Played
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha('#FFB800', 0.15)} 0%, ${alpha('#FFB800', 0.05)} 100%)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}>
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <TrendingUp sx={{ fontSize: { xs: 32, sm: 40 }, color: '#FFB800', mb: 0.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {userStats.attendanceRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Attendance
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Games */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Upcoming Games
            </Typography>
            <Button
              component={Link}
              href="/schedule"
              endIcon={<ArrowForward />}
              sx={{ color: '#00D9FF' }}
            >
              View All
            </Button>
          </Box>

          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))}
            </Stack>
          ) : upcomingGames.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CalendarMonth sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No upcoming games
              </Typography>
              <Button
                component={Link}
                href="/schedule/new"
                variant="contained"
                startIcon={<Add />}
              >
                Schedule a Game
              </Button>
            </Card>
          ) : (
            <Stack spacing={2}>
              {upcomingGames.slice(0, 5).map((game, index) => (
                <Link key={game.id} href={`/schedule/${game.id}`} style={{ textDecoration: 'none' }}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: '4px solid',
                    borderLeftColor: game.team.color,
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={game.gameType}
                              size="small"
                              sx={{
                                backgroundColor: alpha(game.team.color, 0.15),
                                color: game.team.color,
                                fontWeight: 600,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {game.team.name}
                            </Typography>
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {game.title}
                            {game.opponent && ` vs ${game.opponent}`}
                          </Typography>

                          <Stack direction="row" spacing={2} sx={{ color: 'text.secondary' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" />
                              <Typography variant="body2">
                                {format(new Date(game.startTime), 'EEE, MMM d @ h:mm a')}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <LocationOn fontSize="small" />
                            <Typography variant="body2">{game.location}</Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {formatDistanceToNow(new Date(game.startTime), { addSuffix: true })}
                            </Typography>
                            {game.userRsvp ? (
                              <Chip
                                icon={getRsvpIcon(game.userRsvp.status) || undefined}
                                label={`You're ${game.userRsvp.status}`}
                                color={getRsvpColor(game.userRsvp.status) as any}
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={<HelpOutline />}
                                label="RSVP needed"
                                color="warning"
                                size="small"
                              />
                            )}
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                              {game.rsvps
                                .filter((r) => r.status === 'IN')
                                .map((rsvp, i) => (
                                  <Avatar
                                    key={i}
                                    src={rsvp.user.image || undefined}
                                    alt={rsvp.user.name || 'Player'}
                                    sx={{ width: 28, height: 28 }}
                                  />
                                ))}
                            </AvatarGroup>
                            <Typography variant="caption" color="text.secondary">
                              {game.rsvps.filter((r) => r.status === 'IN').length} confirmed
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MotionCard>
                </Link>
              ))}
            </Stack>
          )}
        </Grid>

        {/* Teams Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Your Teams
            </Typography>
            <IconButton
              component={Link}
              href="/team/new"
              sx={{
                backgroundColor: alpha('#00D9FF', 0.1),
                '&:hover': { backgroundColor: alpha('#00D9FF', 0.2) },
              }}
            >
              <Add sx={{ color: '#00D9FF' }} />
            </IconButton>
          </Box>

          {loading ? (
            <Stack spacing={2}>
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={100} />
              ))}
            </Stack>
          ) : (
            <Stack spacing={2}>
              {teams.map((team, index) => (
                <Link key={team.id} href={`/team/${team.id}`} style={{ textDecoration: 'none' }}>
                <MotionCard
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: '4px solid',
                    borderLeftColor: team.color,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {team.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {team.sport}
                    </Typography>
                    <Chip
                      icon={<Groups fontSize="small" />}
                      label={`${team._count.members} players`}
                      size="small"
                      variant="outlined"
                    />
                  </CardContent>
                </MotionCard>
                </Link>
              ))}

              <Button
                component={Link}
                href="/team/join"
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                Join Another Team
              </Button>
            </Stack>
          )}
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

      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </Box>
  );
}
