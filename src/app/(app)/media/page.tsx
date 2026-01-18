'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  LinearProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Videocam,
  Delete,
  Close,
  Add,
  CloudUpload,
  Image as ImageIcon,
  PlayArrow,
  Groups,
  Compress,
  Fullscreen,
  FullscreenExit,
  Download,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useError } from '@/components/providers/ErrorProvider';
import imageCompression from 'browser-image-compression';

const MotionCard = motion(Card);

interface MediaItem {
  id: string;
  type: 'PHOTO' | 'VIDEO';
  url: string;
  thumbnail: string | null;
  title: string | null;
  description: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  teamId: string;
  uploadedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  color: string;
  userRole: string | null;
}

export default function MediaPage() {
  const { user } = useAuth();
  const { showApiError, showNetworkError } = useError();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerDialogRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!viewerDialogRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await viewerDialogRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle download
  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.title || `media-${item.id}.${item.type === 'PHOTO' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Reset zoom when closing viewer
  useEffect(() => {
    if (!selectedMedia) {
      setZoomLevel(1);
      setIsFullscreen(false);
    }
  }, [selectedMedia]);

  // Max size before compression (3MB - leaves room for base64 overhead)
  const MAX_UPLOAD_SIZE = 3 * 1024 * 1024;

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchMedia();
    }
  }, [selectedTeamId, tabValue]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        // Auto-select first team if only one
        if (data.length === 1) {
          setSelectedTeamId(data[0].id);
        } else if (data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      } else {
        await showApiError(res, 'Failed to load teams');
      }
    } catch (error) {
      showNetworkError(error, '/api/teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    if (!selectedTeamId) return;
    setLoadingMedia(true);
    try {
      const type = tabValue === 1 ? 'PHOTO' : tabValue === 2 ? 'VIDEO' : '';
      const url = `/api/teams/${selectedTeamId}/media${type ? `?type=${type}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media.map((m: MediaItem) => ({ ...m, teamId: selectedTeamId })));
      } else {
        await showApiError(res, 'Failed to load media');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/media`);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadDialogOpen(true);

    // Check if it's an image that needs compression
    if (file.type.startsWith('image/') && file.size > MAX_UPLOAD_SIZE) {
      setCompressing(true);
      setCompressionProgress(0);

      try {
        const options = {
          maxSizeMB: 2.5, // Target 2.5MB to stay under Vercel's limit with base64 overhead
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          onProgress: (progress: number) => {
            setCompressionProgress(progress);
          },
        };

        const compressedFile = await imageCompression(file, options);
        setSelectedFile(compressedFile);
        setSuccessMessage(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
      } catch (error) {
        console.error('Compression failed:', error);
        setSelectedFile(file); // Use original if compression fails
      } finally {
        setCompressing(false);
        setCompressionProgress(100);
      }
    } else if (file.type.startsWith('video/') && file.size > MAX_UPLOAD_SIZE * 10) {
      // Videos over 30MB - show warning but allow upload
      setSelectedFile(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTeamId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadTitle) formData.append('title', uploadTitle);
      if (uploadDescription) formData.append('description', uploadDescription);

      const res = await fetch(`/api/teams/${selectedTeamId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newMedia = await res.json();
        setMedia([{ ...newMedia, teamId: selectedTeamId }, ...media]);
        setSuccessMessage('Media uploaded successfully!');
        closeUploadDialog();
      } else {
        await showApiError(res, 'Failed to upload media');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/media`);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setOriginalFile(null);
    setPreviewUrl(null);
    setUploadTitle('');
    setUploadDescription('');
    setCompressing(false);
    setCompressionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    try {
      const res = await fetch(`/api/teams/${mediaToDelete.teamId}/media/${mediaToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMedia(media.filter((m) => m.id !== mediaToDelete.id));
        setSuccessMessage('Media deleted');
        if (selectedMedia?.id === mediaToDelete.id) {
          setSelectedMedia(null);
        }
      } else {
        await showApiError(res, 'Failed to delete media');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${mediaToDelete.teamId}/media/${mediaToDelete.id}`);
    } finally {
      setDeleteConfirmOpen(false);
      setMediaToDelete(null);
    }
  };

  const getSelectedTeam = () => teams.find(t => t.id === selectedTeamId);

  const canDelete = (item: MediaItem) => {
    const team = getSelectedTeam();
    return item.uploadedBy.id === user?.id || team?.userRole === 'OWNER' || team?.userRole === 'ADMIN';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (teams.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Groups sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>
          No teams yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Join or create a team to start sharing media
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button component={Link} href="/team/new" variant="contained" startIcon={<Add />}>
            Create Team
          </Button>
          <Button component={Link} href="/team/join" variant="outlined">
            Join Team
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 2 }}>
          Media Library
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Team Selector */}
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Team</InputLabel>
            <Select
              value={selectedTeamId}
              label="Team"
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((team) => (
                <SelectMenuItem key={team.id} value={team.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: team.color,
                      }}
                    />
                    {team.name}
                  </Box>
                </SelectMenuItem>
              ))}
            </Select>
          </FormControl>

          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
            id="media-upload"
          />
          <label htmlFor="media-upload">
            <Button
              component="span"
              variant="contained"
              startIcon={<CloudUpload />}
              disabled={!selectedTeamId}
            >
              Upload
            </Button>
          </label>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="All" />
          <Tab label="Photos" icon={<PhotoCamera sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Videos" icon={<Videocam sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Media Grid */}
      {loadingMedia ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : media.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ImageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No media yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload photos and videos to share with your team
          </Typography>
          <label htmlFor="media-upload">
            <Button component="span" variant="contained" startIcon={<Add />}>
              Upload First Media
            </Button>
          </label>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <AnimatePresence>
            {media.map((item, index) => (
              <Grid item xs={6} sm={4} md={3} key={item.id}>
                <MotionCard
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover .media-overlay': {
                      opacity: 1,
                    },
                  }}
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.type === 'PHOTO' ? (
                    <CardMedia
                      component="img"
                      height={200}
                      image={item.url}
                      alt={item.title || 'Photo'}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <video
                        src={item.url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: alpha('#000', 0.6),
                          borderRadius: '50%',
                          p: 1,
                        }}
                      >
                        <PlayArrow sx={{ fontSize: 32, color: '#fff' }} />
                      </Box>
                    </Box>
                  )}

                  {/* Overlay */}
                  <Box
                    className="media-overlay"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 1,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={item.uploadedBy.image || undefined}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant="caption" color="white" noWrap sx={{ flex: 1 }}>
                        {item.uploadedBy.name}
                      </Typography>
                      <Chip
                        label={item.type}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Box>
                </MotionCard>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Media</DialogTitle>
        <DialogContent>
          {previewUrl && (originalFile || selectedFile) && (
            <Box sx={{ mb: 3 }}>
              {(originalFile || selectedFile)?.type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewUrl}
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 1,
                    bgcolor: 'black',
                  }}
                />
              ) : (
                <Box
                  component="video"
                  src={previewUrl}
                  controls
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    borderRadius: 1,
                    bgcolor: 'black',
                  }}
                />
              )}

              {/* Compression Progress */}
              {compressing && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Compress sx={{ fontSize: 18, color: 'info.main' }} />
                    <Typography variant="body2" color="info.main">
                      Compressing image...
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={compressionProgress} />
                </Box>
              )}

              {/* File Size Info */}
              <Box sx={{ mt: 1 }}>
                {originalFile && selectedFile && originalFile.size !== selectedFile.size ? (
                  <Typography variant="caption" color="text.secondary">
                    {originalFile.name} (Original: {formatFileSize(originalFile.size)} → Compressed: {formatFileSize(selectedFile.size)})
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {(originalFile || selectedFile)?.name} ({formatFileSize((selectedFile || originalFile)?.size || 0)})
                  </Typography>
                )}
              </Box>

              {/* Large video warning */}
              {originalFile?.type.startsWith('video/') && originalFile.size > MAX_UPLOAD_SIZE * 10 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Large videos may fail to upload. Consider using a shorter clip or lower resolution.
                </Alert>
              )}
            </Box>
          )}

          <Stack spacing={2}>
            <TextField
              label="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              fullWidth
              disabled={compressing}
            />
            <TextField
              label="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={compressing}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog} disabled={uploading || compressing}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading || compressing}
            startIcon={uploading ? <CircularProgress size={20} /> : compressing ? <Compress /> : <CloudUpload />}
          >
            {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Viewer Dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
        fullWidth
        fullScreen={isFullscreen}
        PaperProps={{
          ref: viewerDialogRef,
          sx: { bgcolor: '#0A0E17', maxHeight: isFullscreen ? '100vh' : '90vh' },
        }}
      >
        {selectedMedia && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                <Avatar src={selectedMedia.uploadedBy.image || undefined} sx={{ width: 32, height: 32, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                    {selectedMedia.title || selectedMedia.uploadedBy.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(selectedMedia.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {/* Zoom controls for photos */}
                {selectedMedia.type === 'PHOTO' && (
                  <>
                    <IconButton onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} disabled={zoomLevel <= 0.5}>
                      <ZoomOut />
                    </IconButton>
                    <Typography variant="caption" sx={{ mx: 0.5, minWidth: 40, textAlign: 'center' }}>
                      {Math.round(zoomLevel * 100)}%
                    </Typography>
                    <IconButton onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} disabled={zoomLevel >= 3}>
                      <ZoomIn />
                    </IconButton>
                  </>
                )}
                {/* Download button */}
                <IconButton onClick={() => handleDownload(selectedMedia)} title="Download">
                  <Download />
                </IconButton>
                {/* Fullscreen button */}
                <IconButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
                {canDelete(selectedMedia) && (
                  <IconButton
                    onClick={() => {
                      setMediaToDelete(selectedMedia);
                      setDeleteConfirmOpen(true);
                    }}
                    color="error"
                    title="Delete"
                  >
                    <Delete />
                  </IconButton>
                )}
                <IconButton onClick={() => setSelectedMedia(null)} title="Close">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0,
                overflow: 'auto',
                bgcolor: '#000',
              }}
              onDoubleClick={() => selectedMedia.type === 'PHOTO' && setZoomLevel(z => z === 1 ? 2 : 1)}
            >
              {selectedMedia.type === 'PHOTO' ? (
                <Box
                  component="img"
                  src={selectedMedia.url}
                  sx={{
                    maxWidth: zoomLevel === 1 ? '100%' : 'none',
                    maxHeight: zoomLevel === 1 ? (isFullscreen ? 'calc(100vh - 120px)' : 'calc(90vh - 150px)') : 'none',
                    width: zoomLevel !== 1 ? `${zoomLevel * 100}%` : 'auto',
                    objectFit: 'contain',
                    transition: 'transform 0.2s',
                    cursor: zoomLevel > 1 ? 'move' : 'zoom-in',
                  }}
                />
              ) : (
                <Box
                  component="video"
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  sx={{
                    maxWidth: '100%',
                    maxHeight: isFullscreen ? 'calc(100vh - 120px)' : 'calc(90vh - 150px)',
                  }}
                />
              )}
            </DialogContent>
            {selectedMedia.description && !isFullscreen && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">{selectedMedia.description}</Typography>
              </Box>
            )}
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Media</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this media? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Floating Upload Button (Mobile) */}
      <label htmlFor="media-upload">
        <Fab
          component="span"
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 88,
            right: 16,
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <Add />
        </Fab>
      </label>
    </Box>
  );
}
