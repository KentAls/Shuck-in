'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Avatar,
  Stack,
  Skeleton,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  alpha,
  InputAdornment,
  Fab,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Collapse,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Send,
  Groups,
  KeyboardArrowDown,
  Add,
  MoreVert,
  Edit,
  Archive,
  Unarchive,
  Delete,
  Chat as ChatIcon,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  MeetingRoom,
  AttachFile,
  Image as ImageIcon,
  Close,
  CloudUpload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/components/providers/AuthProvider';
import { useError } from '@/components/providers/ErrorProvider';

const MotionBox = motion(Box);

interface Team {
  id: string;
  name: string;
  color: string;
  userRole: string | null;
  _count: {
    members: number;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  isDefault: boolean;
  _count: {
    messages: number;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isChirper?: boolean;
  chirperName?: string;
  chirperAvatar?: string;
  mediaUrl?: string | null;
  mediaType?: 'PHOTO' | 'VIDEO' | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function ChatPage() {
  const { user } = useAuth();
  const { showApiError, showNetworkError } = useError();
  const searchParams = useSearchParams();
  const preselectedTeam = searchParams.get('team');

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(preselectedTeam);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Dialog states
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [roomMenuAnchor, setRoomMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRoomForMenu, setSelectedRoomForMenu] = useState<ChatRoom | null>(null);

  // Media upload states
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousMessagesLengthRef = useRef(0);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedRoom = chatRooms.find((r) => r.id === selectedRoomId);
  const isAdmin = selectedTeam?.userRole === 'OWNER' || selectedTeam?.userRole === 'ADMIN';
  const canManageRooms = true; // Anyone can create/manage chat rooms

  // Check if user is near the bottom of the chat
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setHasNewMessages(false);
    }
  }, [checkIfNearBottom]);

  useEffect(() => {
    fetchTeams();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchChatRooms();
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(true);
      setIsNearBottom(true);
      setHasNewMessages(false);
    }
  }, [selectedRoomId]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedRoomId) return;
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [selectedRoomId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (!preselectedTeam && data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      }
    } catch (error) {
      showNetworkError(error, '/api/teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatRooms = async () => {
    if (!selectedTeamId) return;
    setRoomsLoading(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat-rooms?includeArchived=true`);
      if (res.ok) {
        const data = await res.json();
        setChatRooms(data);
        // Auto-select default room or first room
        const defaultRoom = data.find((r: ChatRoom) => r.isDefault && !r.isArchived);
        const firstActive = data.find((r: ChatRoom) => !r.isArchived);
        if (defaultRoom) {
          setSelectedRoomId(defaultRoom.id);
        } else if (firstActive) {
          setSelectedRoomId(firstActive.id);
        } else if (data.length > 0) {
          setSelectedRoomId(data[0].id);
        }
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/chat-rooms`);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchMessages = async (initialLoad = false) => {
    if (!selectedTeamId || !selectedRoomId) return;
    if (initialLoad) setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?teamId=${selectedTeamId}&chatRoomId=${selectedRoomId}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages as Message[];
        const hadNewMessages = newMessages.length > previousMessagesLengthRef.current;
        previousMessagesLengthRef.current = newMessages.length;
        setMessages(newMessages);
        if (initialLoad) {
          setTimeout(() => scrollToBottom(), 100);
        } else if (hadNewMessages) {
          if (isNearBottom) {
            setTimeout(() => scrollToBottom(), 100);
          } else {
            setHasNewMessages(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (initialLoad) setMessagesLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeamId || !selectedRoomId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || '',
        name: user?.name || 'You',
        image: user?.image || null,
      },
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          chatRoomId: selectedRoomId,
          content: messageContent,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? newMsg : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        await showApiError(res, 'Failed to send message');
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      showNetworkError(error, '/api/messages');
    } finally {
      setSending(false);
    }
  };

  // Media upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaUploadOpen(true);
  };

  const closeMediaUpload = () => {
    setMediaUploadOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMediaUpload = async () => {
    if (!selectedFile || !selectedTeamId || !selectedRoomId) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload to media library
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', `Chat: ${selectedFile.name}`);

      setUploadProgress(30);

      const mediaRes = await fetch(`/api/teams/${selectedTeamId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!mediaRes.ok) {
        await showApiError(mediaRes, 'Failed to upload media');
        return;
      }

      const mediaData = await mediaRes.json();
      setUploadProgress(70);

      // Send message with media URL
      // Use short content to avoid doubling the request size with base64 data
      const messageContent = mediaData.type === 'PHOTO' ? '📷 Photo' : '🎥 Video';

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          chatRoomId: selectedRoomId,
          content: messageContent,
          mediaUrl: mediaData.url,
          mediaType: mediaData.type,
        }),
      });

      setUploadProgress(100);

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => scrollToBottom(), 100);
        closeMediaUpload();
      } else {
        await showApiError(res, 'Failed to send message');
      }
    } catch (error) {
      showNetworkError(error, '/api/messages');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !selectedTeamId) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const newRoom = await res.json();
        setChatRooms((prev) => [...prev, newRoom]);
        setSelectedRoomId(newRoom.id);
        setCreateRoomDialogOpen(false);
        setNewRoomName('');
        setNewRoomDescription('');
      } else {
        await showApiError(res, 'Failed to create chat room');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/chat-rooms`);
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoomForMenu || !selectedTeamId) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setChatRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setEditRoomDialogOpen(false);
        setNewRoomName('');
        setNewRoomDescription('');
        setSelectedRoomForMenu(null);
      } else {
        await showApiError(res, 'Failed to update chat room');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`);
    }
  };

  const handleArchiveRoom = async (archive: boolean) => {
    if (!selectedRoomForMenu || !selectedTeamId) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: archive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setChatRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        if (archive && selectedRoomId === selectedRoomForMenu.id) {
          const nextRoom = chatRooms.find((r) => !r.isArchived && r.id !== selectedRoomForMenu.id);
          setSelectedRoomId(nextRoom?.id || null);
        }
      } else {
        await showApiError(res, `Failed to ${archive ? 'archive' : 'unarchive'} chat room`);
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`);
    }
    setRoomMenuAnchor(null);
    setSelectedRoomForMenu(null);
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoomForMenu || !selectedTeamId) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChatRooms((prev) => prev.filter((r) => r.id !== selectedRoomForMenu.id));
        if (selectedRoomId === selectedRoomForMenu.id) {
          const nextRoom = chatRooms.find((r) => r.id !== selectedRoomForMenu.id);
          setSelectedRoomId(nextRoom?.id || null);
        }
        setDeleteConfirmOpen(false);
        setSelectedRoomForMenu(null);
      } else {
        await showApiError(res, 'Failed to delete chat room');
      }
    } catch (error) {
      showNetworkError(error, `/api/teams/${selectedTeamId}/chat-rooms/${selectedRoomForMenu.id}`);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const activeRooms = chatRooms.filter((r) => !r.isArchived);
  const archivedRooms = chatRooms.filter((r) => r.isArchived);

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Teams & Rooms */}
        <Grid
          item
          xs={12}
          md={3}
          sx={{
            borderRight: { md: '1px solid' },
            borderColor: 'divider',
            display: { xs: selectedRoomId ? 'none' : 'block', md: 'block' },
            overflow: 'auto',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Team Chats
            </Typography>

            {/* Team List */}
            <List sx={{ mx: -1 }}>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />
                ))
              ) : teams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Groups sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No teams yet
                  </Typography>
                </Box>
              ) : (
                teams.map((team) => (
                  <Box key={team.id}>
                    <ListItemButton
                      selected={selectedTeamId === team.id}
                      onClick={() => {
                        if (selectedTeamId !== team.id) {
                          setChatRooms([]);
                          setMessages([]);
                          setSelectedRoomId(null);
                          setSelectedTeamId(team.id);
                        }
                      }}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(team.color, 0.2), color: team.color }}>
                          <Groups />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={team.name}
                        secondary={`${team._count.members} members`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItemButton>

                    {/* Chat Rooms for Selected Team */}
                    {selectedTeamId === team.id && (
                      <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                        {/* Loading state */}
                        {roomsLoading && (
                          <Box sx={{ py: 1 }}>
                            <Skeleton variant="rounded" height={32} sx={{ mb: 0.5 }} />
                            <Skeleton variant="rounded" height={32} />
                          </Box>
                        )}
                        {/* Active Rooms */}
                        {!roomsLoading && activeRooms.map((room) => (
                          <ListItemButton
                            key={room.id}
                            selected={selectedRoomId === room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            sx={{ borderRadius: 1, py: 0.5, pl: 2 }}
                          >
                            <ChatIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                            <ListItemText
                              primary={room.name}
                              primaryTypographyProps={{ fontSize: '0.875rem' }}
                            />
                            {room.isDefault && (
                              <Chip label="Default" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                            {canManageRooms && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRoomForMenu(room);
                                  setRoomMenuAnchor(e.currentTarget);
                                }}
                              >
                                <MoreVert sx={{ fontSize: 18 }} />
                              </IconButton>
                            )}
                          </ListItemButton>
                        ))}

                        {/* Create Room Button */}
                        {!roomsLoading && canManageRooms && (
                          <ListItemButton
                            onClick={() => setCreateRoomDialogOpen(true)}
                            sx={{ borderRadius: 1, py: 0.5, pl: 2, color: 'primary.main' }}
                          >
                            <Add sx={{ fontSize: 18, mr: 1 }} />
                            <Typography variant="body2">New Chat Room</Typography>
                          </ListItemButton>
                        )}

                        {/* Archived Rooms Toggle */}
                        {!roomsLoading && archivedRooms.length > 0 && (
                          <>
                            <ListItemButton
                              onClick={() => setShowArchived(!showArchived)}
                              sx={{ borderRadius: 1, py: 0.5, pl: 2 }}
                            >
                              <Archive sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                              <ListItemText
                                primary={`Archived (${archivedRooms.length})`}
                                primaryTypographyProps={{ fontSize: '0.875rem', color: 'text.secondary' }}
                              />
                              {showArchived ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                            <Collapse in={showArchived}>
                              {archivedRooms.map((room) => (
                                <ListItemButton
                                  key={room.id}
                                  selected={selectedRoomId === room.id}
                                  onClick={() => setSelectedRoomId(room.id)}
                                  sx={{ borderRadius: 1, py: 0.5, pl: 4, opacity: 0.7 }}
                                >
                                  <ChatIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                                  <ListItemText
                                    primary={room.name}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  />
                                  {isAdmin && (
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoomForMenu(room);
                                        setRoomMenuAnchor(e.currentTarget);
                                      }}
                                    >
                                      <MoreVert sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  )}
                                </ListItemButton>
                              ))}
                            </Collapse>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </List>
          </Box>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {selectedTeam && selectedRoom ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {/* Back button for mobile */}
                <IconButton
                  onClick={() => setSelectedRoomId(null)}
                  sx={{ display: { xs: 'flex', md: 'none' } }}
                >
                  <ArrowBack />
                </IconButton>
                <Avatar sx={{ bgcolor: alpha(selectedTeam.color, 0.2), color: selectedTeam.color, display: { xs: 'none', md: 'flex' } }}>
                  <ChatIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }} noWrap>
                    {selectedRoom.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {selectedTeam.name} • {selectedRoom.description || 'Team chat'}
                  </Typography>
                </Box>
                {selectedRoom.isArchived && (
                  <Chip label="Archived" color="warning" size="small" />
                )}
                {/* Room selector for mobile */}
                <IconButton
                  onClick={() => setCreateRoomDialogOpen(true)}
                  sx={{ display: { xs: 'flex', md: 'none' } }}
                  title="New Room"
                >
                  <Add />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box
                ref={messagesContainerRef}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {messagesLoading ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Skeleton variant="circular" width={60} height={60} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width={150} />
                    <Skeleton variant="text" width={200} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No messages yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Be the first to send a message!
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const isOwn = message.user.id === user?.id;
                        const isChirper = message.isChirper;
                        const showAvatar =
                          index === 0 ||
                          messages[index - 1]?.user.id !== message.user.id ||
                          messages[index - 1]?.isChirper !== message.isChirper;

                        return (
                          <MotionBox
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            sx={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              gap: 1,
                            }}
                          >
                            {!isOwn && (
                              <Avatar
                                src={isChirper ? message.chirperAvatar : message.user.image || undefined}
                                alt={isChirper ? message.chirperName : message.user.name || 'User'}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  visibility: showAvatar ? 'visible' : 'hidden',
                                  border: isChirper ? '2px solid gold' : undefined,
                                }}
                              />
                            )}

                            <Box sx={{ maxWidth: '70%' }}>
                              {showAvatar && !isOwn && (
                                <Typography
                                  variant="caption"
                                  color={isChirper ? 'warning.main' : 'text.secondary'}
                                  sx={{ ml: 1, display: 'block', mb: 0.5, fontWeight: isChirper ? 600 : 400 }}
                                >
                                  {isChirper ? message.chirperName : message.user.name}
                                  {isChirper && ' ⭐'}
                                </Typography>
                              )}
                              <Box
                                sx={{
                                  p: message.mediaUrl ? 0.5 : 1.5,
                                  px: message.mediaUrl ? 0.5 : 2,
                                  borderRadius: 3,
                                  backgroundColor: isOwn
                                    ? selectedTeam.color
                                    : isChirper
                                    ? alpha('#FFD700', 0.15)
                                    : alpha('#FFFFFF', 0.1),
                                  color: isOwn ? '#000' : '#FFF',
                                  borderTopLeftRadius: !isOwn && !showAvatar ? 8 : undefined,
                                  borderTopRightRadius: isOwn && !showAvatar ? 8 : undefined,
                                  border: isChirper ? '1px solid' : undefined,
                                  borderColor: isChirper ? alpha('#FFD700', 0.3) : undefined,
                                  overflow: 'hidden',
                                }}
                              >
                                {message.mediaUrl && (message.mediaType === 'PHOTO' || (!message.mediaType && !message.mediaUrl.includes('.mp4') && !message.mediaUrl.includes('.webm') && !message.mediaUrl.includes('.mov'))) && (
                                  <Box
                                    component="img"
                                    src={message.mediaUrl}
                                    sx={{
                                      maxWidth: 250,
                                      maxHeight: 300,
                                      borderRadius: 2,
                                      display: 'block',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => window.open(message.mediaUrl!, '_blank')}
                                  />
                                )}
                                {message.mediaUrl && (message.mediaType === 'VIDEO' || (!message.mediaType && (message.mediaUrl.includes('.mp4') || message.mediaUrl.includes('.webm') || message.mediaUrl.includes('.mov')))) && (
                                  <Box
                                    component="video"
                                    src={message.mediaUrl}
                                    controls
                                    sx={{
                                      maxWidth: 250,
                                      maxHeight: 300,
                                      borderRadius: 2,
                                      display: 'block',
                                    }}
                                  />
                                )}
                                {(!message.mediaUrl || (message.content && !message.content.startsWith('[Image]') && !message.content.startsWith('[Video]'))) && (
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {message.content}
                                  </Typography>
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  textAlign: isOwn ? 'right' : 'left',
                                  px: 1,
                                }}
                              >
                                {formatMessageDate(message.createdAt)}
                              </Typography>
                            </Box>
                          </MotionBox>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </Stack>
                )}
              </Box>

              {/* Scroll to bottom FAB */}
              <Zoom in={!isNearBottom || hasNewMessages}>
                <Fab
                  size="small"
                  color={hasNewMessages ? 'primary' : 'default'}
                  onClick={scrollToBottom}
                  sx={{ position: 'absolute', bottom: 80, right: 16, zIndex: 10 }}
                >
                  <Badge variant="dot" color="error" invisible={!hasNewMessages}>
                    <KeyboardArrowDown />
                  </Badge>
                </Fab>
              </Zoom>

              {/* Message Input */}
              {!selectedRoom.isArchived ? (
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: alpha('#000', 0.2),
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    id="chat-media-upload"
                  />
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <label htmlFor="chat-media-upload">
                            <IconButton component="span" size="small">
                              <AttachFile fontSize="small" />
                            </IconButton>
                          </label>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            sx={{
                              backgroundColor: selectedTeam.color,
                              color: '#000',
                              '&:hover': { backgroundColor: alpha(selectedTeam.color, 0.8) },
                              '&.Mui-disabled': { backgroundColor: alpha(selectedTeam.color, 0.3) },
                            }}
                          >
                            <Send fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3, pr: 0.5 },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    This chat room is archived. Unarchive it to send messages.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Groups sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                {selectedTeam ? 'Select a chat room' : 'Select a team to start chatting'}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Room Menu */}
      <Menu
        anchorEl={roomMenuAnchor}
        open={Boolean(roomMenuAnchor)}
        onClose={() => {
          setRoomMenuAnchor(null);
          setSelectedRoomForMenu(null);
        }}
      >
        <MenuItem
          onClick={() => {
            setNewRoomName(selectedRoomForMenu?.name || '');
            setNewRoomDescription(selectedRoomForMenu?.description || '');
            setEditRoomDialogOpen(true);
            setRoomMenuAnchor(null);
          }}
        >
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        {selectedRoomForMenu?.isArchived ? (
          <MenuItem onClick={() => handleArchiveRoom(false)}>
            <ListItemIcon><Unarchive fontSize="small" /></ListItemIcon>
            Unarchive
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => handleArchiveRoom(true)}
            disabled={selectedRoomForMenu?.isDefault}
          >
            <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
            Archive
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteConfirmOpen(true);
            setRoomMenuAnchor(null);
          }}
          disabled={selectedRoomForMenu?.isDefault}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Room Dialog */}
      <Dialog open={createRoomDialogOpen} onClose={() => setCreateRoomDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Chat Room</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description (optional)"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoomDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!newRoomName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editRoomDialogOpen} onClose={() => setEditRoomDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Chat Room</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description (optional)"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoomDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRoom} variant="contained" disabled={!newRoomName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Chat Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{selectedRoomForMenu?.name}&quot;? All messages in this room will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRoom} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Upload Dialog */}
      <Dialog open={mediaUploadOpen} onClose={closeMediaUpload} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Share Media
          <IconButton onClick={closeMediaUpload} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewUrl && selectedFile && (
            <Box sx={{ mb: 2 }}>
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
                {selectedFile.name}
              </Typography>
            </Box>
          )}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMediaUpload} disabled={uploading}>Cancel</Button>
          <Button
            onClick={handleMediaUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
