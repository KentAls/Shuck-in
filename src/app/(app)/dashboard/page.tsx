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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, teamsRes] = await Promise.all([
          fetch('/api/games/upcoming'),
          fetch('/api/teams'),
        ]);

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setUpcomingGames(gamesData);
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
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

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${alpha('#00D9FF', 0.15)} 0%, ${alpha('#00D9FF', 0.05)} 100%)` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Groups sx={{ fontSize: 40, color: '#00D9FF', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {teams.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teams
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${alpha('#FF3366', 0.15)} 0%, ${alpha('#FF3366', 0.05)} 100%)` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 40, color: '#FF3366', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {upcomingGames.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${alpha('#00FF94', 0.15)} 0%, ${alpha('#00FF94', 0.05)} 100%)` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: '#00FF94', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Games Played
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${alpha('#FFB800', 0.15)} 0%, ${alpha('#FFB800', 0.05)} 100%)` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: '#FFB800', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                75%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance
              </Typography>
            </CardContent>
          </Card>
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
                <MotionCard
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  component={Link}
                  href={`/schedule/${game.id}`}
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
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
                            {game.userRsvp && (
                              <Chip
                                icon={getRsvpIcon(game.userRsvp.status) || undefined}
                                label={`You're ${game.userRsvp.status}`}
                                color={getRsvpColor(game.userRsvp.status) as any}
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
          ) : teams.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 4 }}>
              <Groups sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No teams yet
              </Typography>
              <Stack spacing={1}>
                <Button
                  component={Link}
                  href="/team/new"
                  variant="contained"
                  startIcon={<Add />}
                  fullWidth
                >
                  Create Team
                </Button>
                <Button
                  component={Link}
                  href="/team/join"
                  variant="outlined"
                  fullWidth
                >
                  Join Team
                </Button>
              </Stack>
            </Card>
          ) : (
            <Stack spacing={2}>
              {teams.map((team, index) => (
                <MotionCard
                  key={team.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  component={Link}
                  href={`/team/${team.id}`}
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
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
    </Box>
  );
}
