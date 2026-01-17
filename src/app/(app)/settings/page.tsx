'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  Divider,
  alpha,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  SportsScore,
  Notifications,
  Logout,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useError } from '@/components/providers/ErrorProvider';

const MotionCard = motion(Card);

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  jerseyNumber: string | null;
  position: string | null;
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const { showApiError, showNetworkError } = useError();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jerseyNumber: '',
    position: '',
  });
  const [notifications, setNotifications] = useState({
    smsReminders: true,
    emailReminders: true,
    chatNotifications: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data: UserProfile = await res.json();
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          jerseyNumber: data.jerseyNumber || '',
          position: data.position || '',
        });
      } else {
        await showApiError(res, 'Failed to load profile');
      }
    } catch (error) {
      showNetworkError(error, '/api/user');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || null,
          phone: formData.phone || null,
          jerseyNumber: formData.jerseyNumber || null,
          position: formData.position || null,
        }),
      });

      if (res.ok) {
        // Refresh auth state
        await refresh();
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    router.push('/api/hellocoop?op=logout&target_uri=/');
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile and preferences
      </Typography>

      <Stack spacing={3}>
        {/* Profile Section */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Profile
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Avatar
                src={user?.image || undefined}
                alt={user?.name || 'User'}
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid',
                  borderColor: '#00D9FF',
                }}
              />
              <Box>
                <Typography variant="h6">{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={3}>
              <TextField
                label="Display Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                placeholder="+1 (555) 123-4567"
                helperText="Required for SMS reminders"
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Player Info
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Jersey Number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                  sx={{ width: 150 }}
                  placeholder="#"
                />
                <TextField
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  fullWidth
                  placeholder="e.g., Forward, Defense, Goalie"
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ alignSelf: 'flex-start' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </CardContent>
        </MotionCard>

        {/* Notifications Section */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Notifications sx={{ color: '#00D9FF' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.smsReminders}
                    onChange={(e) => setNotifications({ ...notifications, smsReminders: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">SMS Reminders</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get text reminders for upcoming games
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailReminders}
                    onChange={(e) => setNotifications({ ...notifications, emailReminders: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Email Reminders</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get email notifications about games and team updates
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.chatNotifications}
                    onChange={(e) => setNotifications({ ...notifications, chatNotifications: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Chat Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get notified about new team chat messages
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </CardContent>
        </MotionCard>

        {/* Account Section */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Account
            </Typography>

            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha('#FFFFFF', 0.03),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body1">Email</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleSignOut}
                sx={{ alignSelf: 'flex-start' }}
              >
                Sign Out
              </Button>
            </Stack>
          </CardContent>
        </MotionCard>
      </Stack>

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
