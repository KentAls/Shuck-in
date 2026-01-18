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
} from '@mui/material';
import {
  ArrowBack,
  PhotoCamera,
  Videocam,
  Delete,
  Close,
  Add,
  CloudUpload,
  Image as ImageIcon,
  PlayArrow,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useError } from '@/components/providers/ErrorProvider';

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

export default function TeamMediaPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { teamId } = params;
  const { user } = useAuth();
  const { showApiError, showNetworkError } = useError();
  const [team, setTeam] = useState<Team | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeam();
    fetchMedia();
  }, [teamId]);

  useEffect(() => {
    fetchMedia();
  }, [tabValue]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      } else {
        await showApiError(res, 'Failed to load team');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}`);
    }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const type = tabValue === 1 ? 'PHOTO' : tabValue === 2 ? 'VIDEO' : '';
      const url = `/api/teams/${teamId}/media${type ? `?type=${type}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media);
      } else {
        await showApiError(res, 'Failed to load media');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/media`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadTitle) formData.append('title', uploadTitle);
      if (uploadDescription) formData.append('description', uploadDescription);

      const res = await fetch(`/api/teams/${teamId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newMedia = await res.json();
        setMedia([newMedia, ...media]);
        setSuccessMessage('Media uploaded successfully!');
        closeUploadDialog();
      } else {
        await showApiError(res, 'Failed to upload media');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${teamId}/media`);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/media/${mediaToDelete.id}`, {
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
      showNetworkError(error, `/api/teams/${teamId}/media/${mediaToDelete.id}`);
    } finally {
      setDeleteConfirmOpen(false);
      setMediaToDelete(null);
    }
  };

  const canDelete = (item: MediaItem) => {
    return item.uploadedBy.id === user?.id || team?.userRole === 'OWNER' || team?.userRole === 'ADMIN';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Media Library
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {team?.name} - Photos and videos
            </Typography>
          </Box>

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
      {loading ? (
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
          {previewUrl && selectedFile && (
            <Box sx={{ mb: 3 }}>
              {selectedFile.type.startsWith('image/') ? (
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </Typography>
            </Box>
          )}

          <Stack spacing={2}>
            <TextField
              label="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog} disabled={uploading}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Viewer Dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#0A0E17', maxHeight: '90vh' },
        }}
      >
        {selectedMedia && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedMedia.uploadedBy.image || undefined} sx={{ width: 32, height: 32 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedMedia.title || selectedMedia.uploadedBy.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(selectedMedia.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
              <Box>
                {canDelete(selectedMedia) && (
                  <IconButton
                    onClick={() => {
                      setMediaToDelete(selectedMedia);
                      setDeleteConfirmOpen(true);
                    }}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                )}
                <IconButton onClick={() => setSelectedMedia(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}>
              {selectedMedia.type === 'PHOTO' ? (
                <Box
                  component="img"
                  src={selectedMedia.url}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 'calc(90vh - 150px)',
                    objectFit: 'contain',
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
                    maxHeight: 'calc(90vh - 150px)',
                  }}
                />
              )}
            </DialogContent>
            {selectedMedia.description && (
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
