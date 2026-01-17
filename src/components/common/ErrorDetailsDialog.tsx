'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Collapse,
  alpha,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Close,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Check,
} from '@mui/icons-material';

export interface ErrorDetails {
  message: string;
  status?: number;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

interface ErrorDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  error: ErrorDetails | null;
  title?: string;
}

export default function ErrorDetailsDialog({
  open,
  onClose,
  error,
  title = 'An error occurred',
}: ErrorDetailsDialogProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!error) return null;

  const formatErrorDetails = () => {
    const errorInfo = {
      message: error.message,
      status: error.status,
      timestamp: error.timestamp || new Date().toISOString(),
      path: error.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
      details: error.details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
    return JSON.stringify(errorInfo, null, 2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatErrorDetails());
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formatErrorDetails();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getUserFriendlyMessage = () => {
    if (error.status === 401) {
      return 'You need to be logged in to perform this action. Please sign in and try again.';
    }
    if (error.status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (error.status === 400) {
      return 'The request was invalid. Please check your input and try again.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha('#FF4757', 0.3),
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pr: 6,
            background: alpha('#FF4757', 0.1),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ErrorIcon sx={{ color: 'error.main' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
            {getUserFriendlyMessage()}
          </Typography>

          {error.status && (
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Error code: {error.status}
            </Typography>
          )}

          {/* Expandable Details Section */}
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: alpha('#00D9FF', 0.1),
                },
              }}
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>

            <Collapse in={showDetails}>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha('#000', 0.3),
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: copied ? 'success.main' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: alpha('#00D9FF', 0.1),
                    },
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.secondary',
                    m: 0,
                    pr: 4,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {formatErrorDetails()}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCopy}
            startIcon={copied ? <Check /> : <ContentCopy />}
            sx={{
              borderColor: copied ? 'success.main' : 'divider',
              color: copied ? 'success.main' : 'text.secondary',
            }}
          >
            {copied ? 'Copied!' : 'Copy Error Details'}
          </Button>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Error details copied to clipboard
        </Alert>
      </Snackbar>
    </>
  );
}
