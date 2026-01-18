'use client';

import { useState, useEffect, useRef } from 'react';
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
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, SportsSoccer, SportsHockey, SportsBasketball, SportsTennis, PhotoCamera, Delete, Groups } from '@mui/icons-material';
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
  const [logo, setLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          setLogo(team.logo || null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/teams/${teamId}/logo`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogo(data.logo);
      } else {
        const data = await res.json();
        setLogoError(data.error || 'Failed to upload logo');
      }
    } catch (err) {
      setLogoError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setLogoError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/logo`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLogo(null);
      } else {
        const data = await res.json();
        setLogoError(data.error || 'Failed to remove logo');
      }
    } catch (err) {
      setLogoError('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

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
              {/* Team Logo */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Team Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={logo || undefined}
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: alpha(formData.color, 0.2),
                        color: formData.color,
                        fontSize: '2rem',
                      }}
                    >
                      {!logo && <Groups sx={{ fontSize: 40 }} />}
                    </Avatar>
                    {uploadingLogo && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%',
                        }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </Box>
                  <Stack spacing={1}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleLogoUpload}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        size="small"
                        startIcon={<PhotoCamera />}
                        disabled={uploadingLogo}
                      >
                        {logo ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </label>
                    {logo && (
                      <Button
                        variant="text"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                </Box>
                {logoError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {logoError}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Max 2MB. Supports JPEG, PNG, GIF, WebP.
                </Typography>
              </Box>

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
