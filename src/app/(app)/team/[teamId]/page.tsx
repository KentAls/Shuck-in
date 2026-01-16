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
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tab,
  Tabs,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  ContentCopy,
  Share,
  Edit,
  MoreVert,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  Groups,
  CalendarMonth,
  Email,
  Phone,
  SportsSoccer,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const MotionCard = motion(Card);

interface TeamMember {
  id: string;
  role: string;
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

interface Team {
  id: string;
  name: string;
  sport: string;
  description: string | null;
  color: string;
  inviteCode: string;
  owner: {
    id: string;
    name: string | null;
  };
  members: TeamMember[];
  userRole: string | null;
  _count: {
    members: number;
    games: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleCopyInviteCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.inviteCode);
      setSnackbarMessage('Invite code copied to clipboard!');
      setSnackbarOpen(true);
    }
  };

  const canManageTeam = team?.userRole === 'OWNER' || team?.userRole === 'ADMIN';

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Team not found
        </Typography>
        <Button component={Link} href="/team" variant="contained">
          Back to Teams
        </Button>
      </Box>
    );
  }

  return (
    <Box>
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

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {team.name}
              </Typography>
              <Chip
                label={team.sport}
                sx={{
                  backgroundColor: alpha(team.color, 0.15),
                  color: team.color,
                  fontWeight: 600,
                }}
              />
            </Box>
            {team.description && (
              <Typography variant="body1" color="text.secondary">
                {team.description}
              </Typography>
            )}
          </Box>

          {canManageTeam && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setInviteDialogOpen(true)}
              >
                Invite Players
              </Button>
              <Button
                component={Link}
                href={`/team/${teamId}/edit`}
                variant="outlined"
                startIcon={<Edit />}
              >
                Edit
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Groups sx={{ fontSize: 32, color: team.color, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {team._count.members}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Players
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 32, color: '#FF3366', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {team._count.games}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Games
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Roster" />
          <Tab label="Schedule" />
          <Tab label="Stats" />
        </Tabs>
      </Box>

      {/* Roster Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {team.members.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      src={member.user.image || undefined}
                      alt={member.user.name || 'Player'}
                      sx={{
                        width: 56,
                        height: 56,
                        border: '2px solid',
                        borderColor: member.role === 'OWNER' ? team.color : 'transparent',
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                          {member.user.name || 'Unknown Player'}
                        </Typography>
                        {member.role !== 'PLAYER' && (
                          <Chip
                            label={member.role}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: member.role === 'OWNER' ? alpha(team.color, 0.2) : alpha('#FFB800', 0.2),
                              color: member.role === 'OWNER' ? team.color : '#FFB800',
                            }}
                          />
                        )}
                      </Box>

                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        {member.user.jerseyNumber && (
                          <Typography variant="body2" color="text.secondary">
                            #{member.user.jerseyNumber}
                          </Typography>
                        )}
                        {member.user.position && (
                          <Typography variant="body2" color="text.secondary">
                            {member.user.position}
                          </Typography>
                        )}
                      </Stack>

                      {member.user.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                          noWrap
                        >
                          {member.user.email}
                        </Typography>
                      )}
                    </Box>

                    {canManageTeam && member.user.id !== session?.user?.id && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMemberMenuOpen(e, member)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Schedule Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarMonth sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            View team schedule
          </Typography>
          <Button
            component={Link}
            href={`/schedule?team=${teamId}`}
            variant="contained"
          >
            View Schedule
          </Button>
        </Box>
      </TabPanel>

      {/* Stats Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Stats coming soon...
          </Typography>
        </Box>
      </TabPanel>

      {/* Member Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMemberMenuClose}
        PaperProps={{
          sx: {
            minWidth: 180,
            background: '#1E293B',
            border: '1px solid',
            borderColor: alpha('#00D9FF', 0.2),
          },
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <AdminPanelSettings fontSize="small" />
          </ListItemIcon>
          Make Admin
        </MenuItem>
        <Divider />
        <MenuItem sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <PersonRemove fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Remove from Team
        </MenuItem>
      </Menu>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Players</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share this invite code with players you want to join your team.
          </Typography>

          <Box
            sx={{
              p: 3,
              backgroundColor: alpha('#00D9FF', 0.05),
              borderRadius: 2,
              border: '1px dashed',
              borderColor: alpha('#00D9FF', 0.3),
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#00D9FF',
              }}
            >
              {team.inviteCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={() => {
              handleCopyInviteCode();
              setInviteDialogOpen(false);
            }}
          >
            Copy Code
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
