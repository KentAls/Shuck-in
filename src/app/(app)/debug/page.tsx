'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { BugReport, Refresh, ContentCopy, Check } from '@mui/icons-material';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data) {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/debug');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport /> Developer Debug
      </Typography>

      <Button
        variant="contained"
        onClick={fetchDebugData}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
        sx={{ mb: 3 }}
      >
        {loading ? 'Loading...' : 'Load Debug Data'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* User Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>User</Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {data.user?.id || 'Not logged in'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {data.user?.email}
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {data.user?.name}
              </Typography>
            </CardContent>
          </Card>

          {/* Server Time */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Server Time</Typography>
              <Typography variant="body2">{data.currentTime}</Typography>
            </CardContent>
          </Card>

          {/* Team Memberships */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Team Memberships ({data.memberships?.length || 0})
              </Typography>
              {data.memberships?.map((m: any, i: number) => (
                <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{m.teamName}</strong> - {m.role} ({m.status})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team ID: {m.teamId}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* All Games in DB */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                All Games in Database ({data.allGamesInDb?.length || 0})
              </Typography>
              {data.allGamesInDb?.map((g: any, i: number) => (
                <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{g.title}</strong> - {g.team?.name}
                  </Typography>
                  <Typography variant="body2" color={g.isFuture ? 'success.main' : 'error.main'}>
                    {g.startTime} ({g.isFuture ? 'FUTURE' : 'PAST'})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team ID: {g.teamId}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Games for User's Teams */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Games for Your Teams ({data.gamesForUserTeams?.length || 0})
              </Typography>
              {data.gamesForUserTeams?.length === 0 && (
                <Alert severity="warning">
                  No games found for your teams. Check if Team IDs match above.
                </Alert>
              )}
              {data.gamesForUserTeams?.map((g: any, i: number) => (
                <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{g.title}</strong>
                  </Typography>
                  <Typography variant="caption">{g.startTime}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Future Games */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Future Games (shown on dashboard) ({data.futureGamesForUser?.length || 0})
              </Typography>
              {data.futureGamesForUser?.length === 0 && (
                <Alert severity="warning">
                  No future games! This is why dashboard shows no games.
                </Alert>
              )}
              {data.futureGamesForUser?.map((g: any, i: number) => (
                <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{g.title}</strong>
                  </Typography>
                  <Typography variant="caption">{g.startTime}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Raw JSON */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Raw JSON</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopy}
                  startIcon={copied ? <Check /> : <ContentCopy />}
                  color={copied ? 'success' : 'primary'}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Box>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.3)',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  maxHeight: 400,
                }}
              >
                {JSON.stringify(data, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
