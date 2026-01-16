'use client';

import { createTheme, alpha } from '@mui/material/styles';

// Sick color palette - dark mode with vibrant accents
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D9FF', // Electric cyan
      light: '#5EEBFF',
      dark: '#00A8CC',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF3366', // Hot pink
      light: '#FF6B8A',
      dark: '#CC1A4A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A0E17', // Deep navy black
      paper: '#121827', // Slightly lighter
    },
    success: {
      main: '#00FF94', // Neon green
      light: '#66FFB8',
      dark: '#00CC76',
    },
    warning: {
      main: '#FFB800', // Amber
      light: '#FFCC4D',
      dark: '#CC9300',
    },
    error: {
      main: '#FF4757', // Bright red
      light: '#FF6B7A',
      dark: '#CC3945',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0A0E17',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#1E293B',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#334155',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5EEBFF 0%, #00D9FF 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #FF3366 0%, #CC1A4A 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF6B8A 0%, #FF3366 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121827',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0, 217, 255, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            background: alpha('#00FF94', 0.15),
            color: '#00FF94',
          },
          '&.MuiChip-colorError': {
            background: alpha('#FF4757', 0.15),
            color: '#FF4757',
          },
          '&.MuiChip-colorWarning': {
            background: alpha('#FFB800', 0.15),
            color: '#FFB800',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00D9FF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00D9FF',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 14, 23, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(18, 24, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#64748B',
          '&.Mui-selected': {
            color: '#00D9FF',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121827',
          borderRight: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid rgba(0, 217, 255, 0.3)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
          boxShadow: '0 4px 20px rgba(0, 217, 255, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5EEBFF 0%, #00D9FF 100%)',
            boxShadow: '0 6px 25px rgba(0, 217, 255, 0.5)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121827',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha('#00D9FF', 0.1),
            '&:hover': {
              backgroundColor: alpha('#00D9FF', 0.15),
            },
          },
          '&:hover': {
            backgroundColor: alpha('#00D9FF', 0.05),
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
        },
      },
    },
  },
});

export default theme;
