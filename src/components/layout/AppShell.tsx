'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  alpha,
  useMediaQuery,
  useTheme,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Groups,
  CalendarMonth,
  Chat,
  Settings,
  Logout,
  SportsSoccer,
  Notifications,
  PhotoLibrary,
  InstallMobile,
  NotificationsOff,
  NotificationsActive,
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTeam } from '@/components/providers/TeamProvider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Team', icon: <Groups />, path: '/team' },
  { label: 'Schedule', icon: <CalendarMonth />, path: '/schedule' },
  { label: 'Chat', icon: <Chat />, path: '/chat' },
];

const mobileNavItems = [
  { label: 'Home', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Team', icon: <Groups />, path: '/team' },
  { label: 'Media', icon: <PhotoLibrary />, path: '/media', exact: true },
  { label: 'Schedule', icon: <CalendarMonth />, path: '/schedule' },
  { label: 'Chat', icon: <Chat />, path: '/chat' },
];

const drawerWidth = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const { currentTeam, teams, setCurrentTeamId } = useTeam();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [teamMenuAnchor, setTeamMenuAnchor] = useState<null | HTMLElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [lastCheckedChat, setLastCheckedChat] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallOption, setShowInstallOption] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // Capture the beforeinstallprompt event for PWA install
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallOption(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallOption(false);
      setSnackbarMessage('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallOption(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Detect if the app is installed or running as PWA
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = 'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone || iosStandalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
  }, []);

  // Handle PWA install
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setSnackbarMessage('Installing app...');
        }
        setDeferredPrompt(null);
        setShowInstallOption(false);
      } catch (error) {
        console.error('Install error:', error);
      }
      setAnchorEl(null);
    } else {
      // Show install instructions dialog
      setInstallDialogOpen(true);
      setAnchorEl(null);
    }
  };

  // Fetch unread chat count
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const params = lastCheckedChat ? `?since=${lastCheckedChat}` : '';
      const res = await fetch(`/api/messages/unread${params}`);
      if (res.ok) {
        const data = await res.json();
        const newCount = data.unreadCount;

        // If we have new messages and notifications are enabled, show browser notification
        if (newCount > unreadChatCount && notificationPermission === 'granted' && !pathname.startsWith('/chat')) {
          const diff = newCount - unreadChatCount;
          if (diff > 0) {
            new Notification('New Team Messages', {
              body: `You have ${diff} new message${diff > 1 ? 's' : ''}`,
              icon: '/icon-192.png',
              tag: 'chat-notification',
            });
          }
        }

        setUnreadChatCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isLoggedIn, lastCheckedChat, notificationPermission, pathname, unreadChatCount]);

  // Check notification support and permission
  const checkNotificationSupport = useCallback(() => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return false;
    }
    setNotificationPermission(Notification.permission);
    return true;
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!checkNotificationSupport()) {
      setNotificationDialogOpen(true);
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setSnackbarMessage('Notifications enabled!');
      } else if (permission === 'denied') {
        setSnackbarMessage('Notifications blocked. Enable them in browser settings.');
      }
    } else if (Notification.permission === 'denied') {
      setNotificationDialogOpen(true);
    }
  }, [checkNotificationSupport]);

  // Initialize notification permission and fetch unread count
  useEffect(() => {
    if (isLoggedIn) {
      checkNotificationSupport();
      fetchUnreadCount();

      // Load last checked timestamp from localStorage
      const stored = localStorage.getItem('lastCheckedChat');
      if (stored) {
        setLastCheckedChat(stored);
      }
    }
  }, [isLoggedIn, checkNotificationSupport, fetchUnreadCount]);

  // Poll for new messages every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchUnreadCount]);

  // Clear unread count when visiting chat page
  useEffect(() => {
    if (pathname.startsWith('/chat')) {
      const now = new Date().toISOString();
      setLastCheckedChat(now);
      localStorage.setItem('lastCheckedChat', now);
      setUnreadChatCount(0);
    }
  }, [pathname]);

  const currentNavIndex = navItems.findIndex((item) =>
    pathname.startsWith(item.path)
  );

  const getMobileNavIndex = () => {
    if (pathname.startsWith('/dashboard')) return 0;
    if (pathname === '/media' || pathname.startsWith('/media/')) return 2;
    if (pathname.startsWith('/team')) return 1;
    if (pathname.startsWith('/schedule')) return 3;
    if (pathname.startsWith('/chat')) return 4;
    return -1;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    if (notificationPermission === 'unsupported' || notificationPermission === 'denied') {
      setNotificationDialogOpen(true);
    } else if (notificationPermission === 'default') {
      requestNotificationPermission();
    } else {
      setNotificationAnchor(event.currentTarget);
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleSignOut = () => {
    // Redirect to Hello.coop logout
    window.location.href = '/api/hellocoop?op=logout&target_uri=/';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SportsSoccer sx={{ fontSize: 32, color: '#00D9FF' }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #00D9FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Shuck-in
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            href={item.path}
            selected={pathname.startsWith(item.path)}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <ListItemIcon sx={{ color: pathname.startsWith(item.path) ? '#00D9FF' : 'text.secondary' }}>
              {item.path === '/chat' ? (
                <Badge badgeContent={unreadChatCount} color="error" max={99}>
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          component={Link}
          href="/settings"
          selected={pathname === '/settings'}
          onClick={() => isMobile && setMobileOpen(false)}
        >
          <ListItemIcon sx={{ color: pathname === '/settings' ? '#00D9FF' : 'text.secondary' }}>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0A0E17', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          pb: isMobile ? '72px' : 0,
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {/* Top AppBar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Current Team Logo & Selector */}
            {currentTeam && (
              <Box
                onClick={(e) => teams.length > 1 ? setTeamMenuAnchor(e.currentTarget) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: teams.length > 1 ? 'pointer' : 'default',
                  mr: 2,
                  p: 0.5,
                  borderRadius: 2,
                  '&:hover': teams.length > 1 ? {
                    backgroundColor: alpha(currentTeam.color, 0.1),
                  } : {},
                }}
              >
                <Avatar
                  src={currentTeam.logo || undefined}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(currentTeam.color, 0.2),
                    color: currentTeam.color,
                    border: '2px solid',
                    borderColor: currentTeam.color,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {!currentTeam.logo && currentTeam.name.substring(0, 2).toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: currentTeam.color }}>
                    {currentTeam.name}
                  </Typography>
                )}
              </Box>
            )}

            {/* Team Switcher Menu */}
            <Menu
              anchorEl={teamMenuAnchor}
              open={Boolean(teamMenuAnchor)}
              onClose={() => setTeamMenuAnchor(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 220,
                  background: '#1E293B',
                  border: '1px solid',
                  borderColor: alpha('#00D9FF', 0.2),
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Switch Team
                </Typography>
              </Box>
              {teams.map((team) => (
                <MenuItem
                  key={team.id}
                  selected={team.id === currentTeam?.id}
                  onClick={() => {
                    setCurrentTeamId(team.id);
                    setTeamMenuAnchor(null);
                  }}
                  sx={{ gap: 1.5 }}
                >
                  <Avatar
                    src={team.logo || undefined}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(team.color, 0.2),
                      color: team.color,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {!team.logo && team.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {team.sport}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>

            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {navItems.find((item) => pathname.startsWith(item.path))?.label || 'Shuck-in'}
            </Typography>

            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleNotificationClick}>
              <Badge badgeContent={0} color="error">
                {notificationPermission === 'granted' ? (
                  <NotificationsActive />
                ) : (
                  <Notifications />
                )}
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 280,
                  maxWidth: 360,
                  background: '#1E293B',
                  border: '1px solid',
                  borderColor: alpha('#00D9FF', 0.2),
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No new notifications
                </Typography>
              </Box>
            </Popover>

            <IconButton onClick={handleMenuOpen}>
              <Avatar
                src={user?.image || undefined}
                alt={user?.name || 'User'}
                sx={{
                  width: 36,
                  height: 36,
                  border: '2px solid',
                  borderColor: '#00D9FF',
                }}
              />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  background: '#1E293B',
                  border: '1px solid',
                  borderColor: alpha('#00D9FF', 0.2),
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} href="/settings" onClick={handleMenuClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              {!isInstalled && (
                <MenuItem onClick={handleInstallClick}>
                  <ListItemIcon>
                    <InstallMobile fontSize="small" sx={{ color: '#00D9FF' }} />
                  </ListItemIcon>
                  <Typography sx={{ color: '#00D9FF' }}>Install App</Typography>
                </MenuItem>
              )}
              <MenuItem onClick={handleSignOut} sx={{ color: '#FF4757' }}>
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: '#FF4757' }} />
                </ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>{children}</Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={getMobileNavIndex()}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            height: 72,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {mobileNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              component={Link}
              href={item.path}
              label={item.label}
              icon={
                item.path === '/chat' ? (
                  <Badge badgeContent={unreadChatCount} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
              sx={{
                minWidth: 'auto',
                '&.Mui-selected': {
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.65rem',
                },
              }}
            />
          ))}
        </BottomNavigation>
      )}

      {/* Notification Not Supported Dialog */}
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsOff sx={{ color: 'warning.main' }} />
          Notifications
        </DialogTitle>
        <DialogContent>
          {notificationPermission === 'unsupported' ? (
            <Typography>
              Your browser doesn&apos;t support notifications. To receive notifications, please try:
              <br /><br />
              <strong>1.</strong> Using a supported browser (Chrome, Firefox, Edge, Safari 16.4+)
              <br />
              <strong>2.</strong> Installing this app on your home screen
              <br />
              <strong>3.</strong> Enabling notifications in your device settings
            </Typography>
          ) : (
            <Typography>
              Notifications are currently blocked. To enable them:
              <br /><br />
              <strong>1.</strong> Click the lock/info icon in your browser&apos;s address bar
              <br />
              <strong>2.</strong> Find &quot;Notifications&quot; in the site settings
              <br />
              <strong>3.</strong> Change from &quot;Block&quot; to &quot;Allow&quot;
              <br />
              <strong>4.</strong> Refresh the page
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>Got it</Button>
        </DialogActions>
      </Dialog>

      {/* Install App Dialog */}
      <Dialog open={installDialogOpen} onClose={() => setInstallDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallMobile sx={{ color: '#00D9FF' }} />
          Install App
        </DialogTitle>
        <DialogContent>
          {isIOS ? (
            <Typography>
              To install this app on your iPhone/iPad:
              <br /><br />
              <strong>1.</strong> Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari
              <br />
              <strong>2.</strong> Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
              <br />
              <strong>3.</strong> Tap <strong>&quot;Add&quot;</strong> in the top right
              <br /><br />
              The app will appear on your home screen with full-screen experience!
            </Typography>
          ) : (
            <Typography>
              To install this app:
              <br /><br />
              <strong>Chrome/Edge:</strong>
              <br />
              Look for the install icon in your browser&apos;s address bar, or tap the menu (⋮) and select &quot;Install app&quot; or &quot;Add to Home Screen&quot;
              <br /><br />
              <strong>Firefox:</strong>
              <br />
              Tap the menu and select &quot;Install&quot; or &quot;Add to Home Screen&quot;
              <br /><br />
              <strong>Samsung Internet:</strong>
              <br />
              Tap the menu and select &quot;Add page to&quot; → &quot;Home screen&quot;
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
}
