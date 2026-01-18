'use client';

import { useState, useEffect, useCallback } from 'react';
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
  BugReport,
  CameraAlt,
  Delete,
} from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

const MotionCard = motion(Card);

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  jerseyNumber: string | null;
  position: string | null;
  smsReminders: boolean;
  emailReminders: boolean;
  chatNotifications: boolean;
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>('default');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTeams();
    // Check browser notification permission
    if ('Notification' in window) {
      setBrowserNotificationPermission(Notification.permission);
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const teams = await res.json();
        // Check if user is admin/owner of any team
        const hasAdminRole = teams.some((t: { userRole: string | null }) =>
          t.userRole === 'OWNER' || t.userRole === 'ADMIN'
        );
        setIsAdmin(hasAdminRole);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      setSnackbar({ open: true, message: 'Browser notifications are not supported', severity: 'error' });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      if (permission === 'granted') {
        setSnackbar({ open: true, message: 'Browser notifications enabled!', severity: 'success' });
        // Show a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications for new chat messages',
          icon: '/icon-192.png',
        });
      } else if (permission === 'denied') {
        setSnackbar({ open: true, message: 'Notifications were denied. Check your browser settings.', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to enable notifications', severity: 'error' });
    }
  };

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
        setNotifications({
          smsReminders: data.smsReminders,
          emailReminders: data.emailReminders,
          chatNotifications: data.chatNotifications,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
          name: formData.name.trim() || undefined,
          phone: formData.phone || null,
          jerseyNumber: formData.jerseyNumber || null,
          position: formData.position || null,
        }),
      });

      if (res.ok) {
        // Refresh auth state to update the context
        await refresh();
        // Re-fetch profile to sync form data with saved values
        await fetchProfile();
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      } else {
        const data = await res.json();
        setSnackbar({ open: true, message: data.error || 'Failed to update profile', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smsReminders: notifications.smsReminders,
          emailReminders: notifications.emailReminders,
          chatNotifications: notifications.chatNotifications,
        }),
      });

      if (res.ok) {
        setSnackbar({ open: true, message: 'Notification preferences saved!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to save preferences', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSignOut = () => {
    router.push('/api/hellocoop?op=logout&target_uri=/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Use JPEG, PNG, GIF, or WebP', severity: 'error' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File too large. Maximum size is 5MB', severity: 'error' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await refresh();
        setSnackbar({ open: true, message: 'Profile picture updated!', severity: 'success' });
      } else {
        const data = await res.json();
        setSnackbar({ open: true, message: data.error || 'Failed to upload picture', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setUploadingAvatar(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (res.ok) {
        await refresh();
        setSnackbar({ open: true, message: 'Profile picture removed', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to remove picture', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
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
              <Box sx={{ position: 'relative' }}>
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
                {/* Camera overlay button */}
                <Box
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#00D9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: uploadingAvatar ? 'wait' : 'pointer',
                    '&:hover': {
                      backgroundColor: '#00B8D9',
                    },
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    style={{ display: 'none' }}
                  />
                  <CameraAlt sx={{ fontSize: 18, color: '#0A0E17' }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="h6">{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                {user?.image && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete sx={{ fontSize: 16 }} />}
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    sx={{ mt: 1, fontSize: 12 }}
                  >
                    Remove photo
                  </Button>
                )}
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

              <Divider sx={{ my: 2 }} />

              {/* Browser Notifications */}
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>Browser Notifications</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enable push notifications to get alerts even when the app is in the background
                </Typography>
                {browserNotificationPermission === 'granted' ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Browser notifications are enabled
                  </Alert>
                ) : browserNotificationPermission === 'denied' ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Browser notifications are blocked. Please enable them in your browser settings.
                  </Alert>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={handleEnableBrowserNotifications}
                    sx={{ mb: 2 }}
                  >
                    Enable Browser Notifications
                  </Button>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                sx={{ alignSelf: 'flex-start', mt: 2 }}
              >
                {savingNotifications ? 'Saving...' : 'Save Preferences'}
              </Button>
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

        {/* Developer Section - Admin Only */}
        {isAdmin && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <BugReport sx={{ color: '#FFB800' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Developer
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Button
                  component={Link}
                  href="/debug"
                  variant="outlined"
                  startIcon={<BugReport />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Debug Info
                </Button>
                <Typography variant="body2" color="text.secondary">
                  View diagnostic information about your account, teams, and games
                </Typography>
              </Stack>
            </CardContent>
          </MotionCard>
        )}
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
