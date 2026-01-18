'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  alpha,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Star,
  AutoAwesome,
} from '@mui/icons-material';
import Link from 'next/link';
import { useError } from '@/components/providers/ErrorProvider';

interface Chirper {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  personality: string;
  isActive: boolean;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  userRole: string | null;
}

// Default famous athletes by sport
const defaultAthletes: Record<string, Array<{ name: string; nickname: string; personality: string }>> = {
  hockey: [
    { name: 'Wayne Gretzky', nickname: 'The Great One', personality: 'Legendary, humble, always talks about teamwork. Known for saying "You miss 100% of the shots you don\'t take." Encouraging but competitive.' },
    { name: 'Mario Lemieux', nickname: 'Super Mario', personality: 'Graceful and composed. Speaks with confidence about skill and finesse. Loves beautiful plays.' },
    { name: 'Sidney Crosby', nickname: 'Sid the Kid', personality: 'Intense competitor. Very focused on winning and hard work. Motivational and serious about the game.' },
  ],
  soccer: [
    { name: 'Pelé', nickname: 'The King', personality: 'Joyful and passionate about beautiful football. Emphasizes flair and creativity.' },
    { name: 'Diego Maradona', nickname: 'El Diego', personality: 'Fiery and emotional. Passionate about the game. Known for dramatic celebrations.' },
    { name: 'Mia Hamm', nickname: '', personality: 'Inspirational leader. Focuses on teamwork and never giving up. Great mentor energy.' },
  ],
  basketball: [
    { name: 'Michael Jordan', nickname: 'MJ', personality: 'Ultra-competitive. Known for "And I took that personally." Intense focus on winning.' },
    { name: 'Magic Johnson', nickname: 'Magic', personality: 'Charismatic and positive. Loves flashy passes and teamwork. Always smiling.' },
    { name: 'LeBron James', nickname: 'King James', personality: 'Leader on and off the court. Talks about legacy and impact. Motivational.' },
  ],
  baseball: [
    { name: 'Babe Ruth', nickname: 'The Bambino', personality: 'Larger than life personality. Loves to have fun. Big swinger mentality.' },
    { name: 'Jackie Robinson', nickname: '', personality: 'Courageous and dignified. Speaks about breaking barriers and perseverance.' },
    { name: 'Derek Jeter', nickname: 'The Captain', personality: 'Cool under pressure. Professional. Leads by example.' },
  ],
  football: [
    { name: 'Tom Brady', nickname: 'TB12', personality: 'Methodical and prepared. Talks about the TB12 method. Never counts himself out.' },
    { name: 'Jerry Rice', nickname: '', personality: 'Work ethic is legendary. "Today I will do what others won\'t, so tomorrow I can do what others can\'t."' },
    { name: 'Peyton Manning', nickname: 'The Sheriff', personality: 'Cerebral and funny. Known for Omaha calls. Great sense of humor.' },
  ],
};

export default function ChirpersPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { teamId } = params;
  const { showApiError, showNetworkError } = useError();
  const [team, setTeam] = useState<Team | null>(null);
  const [chirpers, setChirpers] = useState<Chirper[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChirper, setSelectedChirper] = useState<Chirper | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    avatar: '',
    personality: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = team?.userRole === 'OWNER' || team?.userRole === 'ADMIN';

  useEffect(() => {
    fetchTeam();
    fetchChirpers();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      } else {
        await showApiError(res, 'Failed to load team');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}`);
    }
  };

  const fetchChirpers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/chirpers`);
      if (res.ok) {
        const data = await res.json();
        setChirpers(data.chirpers);
      } else {
        await showApiError(res, 'Failed to load chirpers');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/chirpers`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (chirper?: Chirper) => {
    if (chirper) {
      setSelectedChirper(chirper);
      setFormData({
        name: chirper.name,
        nickname: chirper.nickname || '',
        avatar: chirper.avatar || '',
        personality: chirper.personality,
        isActive: chirper.isActive,
      });
    } else {
      setSelectedChirper(null);
      setFormData({
        name: '',
        nickname: '',
        avatar: '',
        personality: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedChirper(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.personality) return;

    setSaving(true);
    try {
      const url = selectedChirper
        ? `/api/teams/${teamId}/chirpers/${selectedChirper.id}`
        : `/api/teams/${teamId}/chirpers`;
      const method = selectedChirper ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const chirper = await res.json();
        if (selectedChirper) {
          setChirpers(chirpers.map((c) => (c.id === chirper.id ? chirper : c)));
        } else {
          setChirpers([...chirpers, chirper]);
        }
        handleCloseDialog();
      } else {
        await showApiError(res, 'Failed to save chirper');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/chirpers`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChirper) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/chirpers/${selectedChirper.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChirpers(chirpers.filter((c) => c.id !== selectedChirper.id));
        setDeleteDialogOpen(false);
        setSelectedChirper(null);
      } else {
        await showApiError(res, 'Failed to delete chirper');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/chirpers`);
    }
  };

  const handleToggleActive = async (chirper: Chirper) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/chirpers/${chirper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !chirper.isActive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setChirpers(chirpers.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        await showApiError(res, 'Failed to update chirper');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/chirpers`);
    }
  };

  const handleUseSuggestion = (athlete: { name: string; nickname: string; personality: string }) => {
    setFormData({
      ...formData,
      name: athlete.name,
      nickname: athlete.nickname,
      personality: athlete.personality,
    });
  };

  const suggestions = team?.sport ? defaultAthletes[team.sport.toLowerCase()] || [] : [];

  return (
    <Box>
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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              <AutoAwesome sx={{ color: '#FFD700' }} />
              Chat Chirpers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI sports legends that comment in your team chat
            </Typography>
          </Box>

          {isAdmin && chirpers.length < 3 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Chirper
            </Button>
          )}
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Chirpers are AI-powered sports legends that occasionally comment in your team chat. They&apos;ll react to conversations, offer encouragement, and add some fun to your team communication. You can have up to 3 chirpers per team.
      </Alert>

      {/* Chirpers List */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} />
          ))}
        </Stack>
      ) : chirpers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Star sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No Chirpers Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add famous {team?.sport || 'sports'} legends to comment in your team chat
            </Typography>
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                Add Your First Chirper
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {chirpers.map((chirper) => (
            <Card key={chirper.id} sx={{ opacity: chirper.isActive ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    src={chirper.avatar || undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      border: '2px solid',
                      borderColor: chirper.isActive ? '#FFD700' : 'divider',
                      bgcolor: alpha('#FFD700', 0.1),
                    }}
                  >
                    {chirper.name[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {chirper.name}
                      </Typography>
                      {chirper.nickname && (
                        <Chip label={chirper.nickname} size="small" sx={{ bgcolor: alpha('#FFD700', 0.2) }} />
                      )}
                      {!chirper.isActive && (
                        <Chip label="Inactive" size="small" color="default" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {chirper.personality.length > 150
                        ? `${chirper.personality.substring(0, 150)}...`
                        : chirper.personality}
                    </Typography>
                    {isAdmin && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={chirper.isActive}
                              onChange={() => handleToggleActive(chirper)}
                            />
                          }
                          label="Active"
                        />
                        <IconButton size="small" onClick={() => handleOpenDialog(chirper)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedChirper(chirper);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedChirper ? 'Edit Chirper' : 'Add Chirper'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Suggestions */}
            {!selectedChirper && suggestions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Quick Add ({team?.sport} Legends)
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {suggestions.map((athlete) => (
                    <Chip
                      key={athlete.name}
                      label={athlete.name}
                      onClick={() => handleUseSuggestion(athlete)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Wayne Gretzky"
            />
            <TextField
              label="Nickname (optional)"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              fullWidth
              placeholder="e.g., The Great One"
            />
            <TextField
              label="Avatar URL (optional)"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              fullWidth
              placeholder="https://example.com/avatar.jpg"
            />
            <TextField
              label="Personality"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              required
              fullWidth
              multiline
              rows={3}
              placeholder="Describe how this person speaks, their catchphrases, what they emphasize..."
              helperText="This guides how the AI will respond in character"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active (will comment in chat)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.personality || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Chirper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedChirper?.name}? This will also remove all their messages from the chat history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
