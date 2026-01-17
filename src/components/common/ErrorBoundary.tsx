'use client';

import { Component, ReactNode } from 'react';
import { Box, Button, Typography, alpha } from '@mui/material';
import { Refresh, BugReport, ContentCopy, Check } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(errorDetails, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render() {
    const { hasError, error, errorInfo, copied } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0A0E17',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: alpha('#FF4757', 0.1),
              border: '1px solid',
              borderColor: alpha('#FF4757', 0.3),
              maxWidth: 500,
              width: '100%',
            }}
          >
            <BugReport sx={{ fontSize: 48, color: '#FF4757', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 1 }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              An unexpected error occurred. Please try refreshing the page.
            </Typography>

            {error && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: alpha('#000', 0.3),
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: '#FF6B6B',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  {error.name}: {error.message}
                </Typography>
                {errorInfo?.componentStack && (
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      whiteSpace: 'pre-wrap',
                      m: 0,
                    }}
                  >
                    {errorInfo.componentStack.slice(0, 500)}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                sx={{
                  background: 'linear-gradient(135deg, #00D9FF 0%, #00B4D8 100%)',
                }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                startIcon={copied ? <Check /> : <ContentCopy />}
                onClick={this.handleCopyError}
                sx={{
                  borderColor: copied ? 'success.main' : 'divider',
                  color: copied ? 'success.main' : 'text.secondary',
                }}
              >
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </Box>
          </Box>
        </Box>
      );
    }

    return children;
  }
}
