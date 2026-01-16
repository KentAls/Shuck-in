'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  ViewList,
  ViewModule,
  LocationOn,
  AccessTime,
  CheckCircle,
  Cancel,
  HelpOutline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, isSameDay, isAfter, isBefore, startOfToday, parseISO } from 'date-fns';
import Link from 'next/link';

const MotionCard = motion(Card);

interface Game {
  id: string;
  title: string;
  opponent: string | null;
  location: string;
  startTime: string;
  endTime: string | null;
  gameType: string;
  team: {
    id: string;
    name: string;
    color: string;
  };
  rsvps: Array<{
    status: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
  userRsvp: {
    status: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gamesRes, teamsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/teams'),
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData);
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

  const filteredGames = games.filter((game) => {
    const gameDate = parseISO(game.startTime);
    const today = startOfToday();

    // Team filter
    if (selectedTeam !== 'all' && game.team.id !== selectedTeam) {
      return false;
    }

    // Time filter
    if (timeFilter === 'upcoming' && isBefore(gameDate, today)) {
      return false;
    }
    if (timeFilter === 'past' && isAfter(gameDate, today)) {
      return false;
    }

    return true;
  });

  const getRsvpIcon = (status: string) => {
    switch (status) {
      case 'IN':
        return <CheckCircle fontSize="small" sx={{ color: '#00FF94' }} />;
      case 'OUT':
        return <Cancel fontSize="small" sx={{ color: '#FF4757' }} />;
      case 'MAYBE':
        return <HelpOutline fontSize="small" sx={{ color: '#FFB800' }} />;
      default:
        return null;
    }
  };

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

  // Group games by date
  const groupedGames: { [key: string]: Game[] } = {};
  filteredGames.forEach((game) => {
    const dateKey = format(parseISO(game.startTime), 'yyyy-MM-dd');
    if (!groupedGames[dateKey]) {
      groupedGames[dateKey] = [];
    }
    groupedGames[dateKey].push(game);
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Schedule
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your games and practices
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/schedule/new"
          variant="contained"
          startIcon={<Add />}
        >
          New Event
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Team</InputLabel>
          <Select
            value={selectedTeam}
            label="Team"
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <MenuItem value="all">All Teams</MenuItem>
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
                  {team.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={timeFilter}
          exclusive
          onChange={(_, v) => v && setTimeFilter(v)}
          size="small"
        >
          <ToggleButton value="upcoming">Upcoming</ToggleButton>
          <ToggleButton value="past">Past</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
          sx={{ ml: 'auto' }}
        >
          <ToggleButton value="list">
            <ViewList />
          </ToggleButton>
          <ToggleButton value="calendar">
            <ViewModule />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Games List */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={140} />
          ))}
        </Stack>
      ) : filteredGames.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonth sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            No events found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {timeFilter === 'upcoming'
              ? "You don't have any upcoming games scheduled"
              : "No games match your current filters"}
          </Typography>
          <Button
            component={Link}
            href="/schedule/new"
            variant="contained"
            startIcon={<Add />}
          >
            Schedule an Event
          </Button>
        </Card>
      ) : (
        <Stack spacing={4}>
          {Object.entries(groupedGames).map(([dateKey, dateGames]) => (
            <Box key={dateKey}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: isSameDay(parseISO(dateKey), new Date()) ? '#00D9FF' : 'text.primary',
                }}
              >
                <CalendarMonth />
                {isSameDay(parseISO(dateKey), new Date())
                  ? 'Today'
                  : format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
              </Typography>

              <Stack spacing={2}>
                {dateGames.map((game, index) => (
                  <Link key={game.id} href={`/schedule/${game.id}`} style={{ textDecoration: 'none' }}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    sx={{
                      cursor: 'pointer',
                      borderLeft: '4px solid',
                      borderLeftColor: game.team.color,
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
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
                                  {format(parseISO(game.startTime), 'h:mm a')}
                                  {game.endTime && ` - ${format(parseISO(game.endTime), 'h:mm a')}`}
                                </Typography>
                              </Box>
                            </Stack>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <LocationOn fontSize="small" />
                              <Typography variant="body2">{game.location}</Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
                            {/* RSVP Summary */}
                            <Box>
                              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <Chip
                                  icon={<CheckCircle fontSize="small" />}
                                  label={game.rsvps.filter((r) => r.status === 'IN').length}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                                <Chip
                                  icon={<HelpOutline fontSize="small" />}
                                  label={game.rsvps.filter((r) => r.status === 'MAYBE').length}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                                <Chip
                                  icon={<Cancel fontSize="small" />}
                                  label={game.rsvps.filter((r) => r.status === 'OUT').length}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              </Stack>

                              {game.userRsvp && (
                                <Chip
                                  icon={getRsvpIcon(game.userRsvp.status) || undefined}
                                  label={`You're ${game.userRsvp.status}`}
                                  color={getRsvpColor(game.userRsvp.status) as any}
                                  size="small"
                                />
                              )}
                            </Box>

                            {/* Attendee Avatars */}
                            <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                              {game.rsvps
                                .filter((r) => r.status === 'IN')
                                .map((rsvp) => (
                                  <Avatar
                                    key={rsvp.user.id}
                                    src={rsvp.user.image || undefined}
                                    alt={rsvp.user.name || 'Player'}
                                  />
                                ))}
                            </AvatarGroup>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
