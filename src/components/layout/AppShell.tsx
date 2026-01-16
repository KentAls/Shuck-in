'use client';

import { useState } from 'react';
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
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Team', icon: <Groups />, path: '/team' },
  { label: 'Schedule', icon: <CalendarMonth />, path: '/schedule' },
  { label: 'Chat', icon: <Chat />, path: '/chat' },
];

const drawerWidth = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentNavIndex = navItems.findIndex((item) =>
    pathname.startsWith(item.path)
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
              {item.icon}
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
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0A0E17' }}>
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

            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {navItems.find((item) => pathname.startsWith(item.path))?.label || 'Shuck-in'}
            </Typography>

            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>

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
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={currentNavIndex}
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
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              component={Link}
              href={item.path}
              label={item.label}
              icon={item.icon}
              sx={{
                '&.Mui-selected': {
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  },
                },
              }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
