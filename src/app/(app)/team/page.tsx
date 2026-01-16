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
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  alpha,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add,
  Groups,
  MoreVert,
  Edit,
  Share,
  Delete,
  PersonAdd,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MotionCard = motion(Card);

interface Team {
  id: string;
  name: string;
  sport: string;
  description: string | null;
  color: string;
  inviteCode: string;
  _count: {
    members: number;
  };
  members?: Array<{
    user: {
      name: string | null;
      image: string | null;
    };
  }>;
  userRole?: string;
}

export default function TeamListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, team: Team) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTeam(team);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleCopyInviteCode = () => {
    if (selectedTeam) {
      navigator.clipboard.writeText(selectedTeam.inviteCode);
      // Could add a toast notification here
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Your Teams
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your teams and players
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            href="/team/join"
            variant="outlined"
            startIcon={<PersonAdd />}
          >
            Join Team
          </Button>
          <Button
            component={Link}
            href="/team/new"
            variant="contained"
            startIcon={<Add />}
          >
            Create Team
          </Button>
        </Stack>
      </Box>

      {/* Teams Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : teams.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Groups sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            No teams yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create a team or join an existing one to get started
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/team/new"
              variant="contained"
              startIcon={<Add />}
              size="large"
            >
              Create Your First Team
            </Button>
            <Button
              component={Link}
              href="/team/join"
              variant="outlined"
              startIcon={<PersonAdd />}
              size="large"
            >
              Join a Team
            </Button>
          </Stack>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {teams.map((team, index) => (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <Link href={`/team/${team.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: team.color,
                    borderRadius: '12px 12px 0 0',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, pt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {team.name}
                      </Typography>
                      <Chip
                        label={team.sport}
                        size="small"
                        sx={{
                          backgroundColor: alpha(team.color, 0.15),
                          color: team.color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, team)}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#FFFFFF', 0.1),
                        },
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {team.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {team.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Groups sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {team._count.members} {team._count.members === 1 ? 'player' : 'players'}
                      </Typography>
                    </Box>

                    {team.members && team.members.length > 0 && (
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                        {team.members.map((member, i) => (
                          <Avatar
                            key={i}
                            src={member.user.image || undefined}
                            alt={member.user.name || 'Player'}
                          />
                        ))}
                      </AvatarGroup>
                    )}
                  </Box>
                </CardContent>
              </MotionCard>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Team Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 180,
            background: '#1E293B',
            border: '1px solid',
            borderColor: alpha('#00D9FF', 0.2),
          },
        }}
      >
        <MenuItem
          component={Link}
          href={selectedTeam ? `/team/${selectedTeam.id}/edit` : '#'}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Edit Team
        </MenuItem>
        <MenuItem onClick={handleCopyInviteCode}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          Copy Invite Code
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Delete Team
        </MenuItem>
      </Menu>
    </Box>
  );
}
