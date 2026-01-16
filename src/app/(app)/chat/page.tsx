'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Divider,
} from '@mui/material';
import { Send, Groups, Search } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

const MotionBox = motion(Box);

interface Team {
  id: string;
  name: string;
  color: string;
  _count: {
    members: number;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preselectedTeam = searchParams.get('team');

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(preselectedTeam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchMessages();
    }
  }, [selectedTeamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedTeamId) return;

    try {
      const res = await fetch(`/api/messages?teamId=${selectedTeamId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeamId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      user: {
        id: session?.user?.id || '',
        name: session?.user?.name || 'You',
        image: session?.user?.image || null,
      },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          content: messageContent,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? newMsg : m))
        );
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Team List Sidebar */}
        <Grid
          item
          xs={12}
          md={3}
          sx={{
            borderRight: { md: '1px solid' },
            borderColor: 'divider',
            display: { xs: selectedTeamId ? 'none' : 'block', md: 'block' },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Team Chats
            </Typography>

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
                  <ListItemButton
                    key={team.id}
                    selected={selectedTeamId === team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(team.color, 0.2),
                          color: team.color,
                        }}
                      >
                        <Groups />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={team.name}
                      secondary={`${team._count.members} members`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedTeam ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(selectedTeam.color, 0.2),
                    color: selectedTeam.color,
                  }}
                >
                  <Groups />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedTeam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTeam._count.members} members
                  </Typography>
                </Box>
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
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Groups sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
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
                        const isOwn = message.user.id === session?.user?.id;
                        const showAvatar =
                          index === 0 ||
                          messages[index - 1]?.user.id !== message.user.id;

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
                                src={message.user.image || undefined}
                                alt={message.user.name || 'User'}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  visibility: showAvatar ? 'visible' : 'hidden',
                                }}
                              />
                            )}

                            <Box
                              sx={{
                                maxWidth: '70%',
                              }}
                            >
                              {showAvatar && !isOwn && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 1, display: 'block', mb: 0.5 }}
                                >
                                  {message.user.name}
                                </Typography>
                              )}
                              <Box
                                sx={{
                                  p: 1.5,
                                  px: 2,
                                  borderRadius: 3,
                                  backgroundColor: isOwn
                                    ? selectedTeam.color
                                    : alpha('#FFFFFF', 0.1),
                                  color: isOwn ? '#000' : '#FFF',
                                  borderTopLeftRadius: !isOwn && !showAvatar ? 8 : undefined,
                                  borderTopRightRadius: isOwn && !showAvatar ? 8 : undefined,
                                }}
                              >
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {message.content}
                                </Typography>
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

              {/* Message Input */}
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
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          disabled={!newMessage.trim() || sending}
                          sx={{
                            backgroundColor: selectedTeam.color,
                            color: '#000',
                            '&:hover': {
                              backgroundColor: alpha(selectedTeam.color, 0.8),
                            },
                            '&.Mui-disabled': {
                              backgroundColor: alpha(selectedTeam.color, 0.3),
                            },
                          }}
                        >
                          <Send fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 3,
                      pr: 0.5,
                    },
                  }}
                />
              </Box>
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
                Select a team to start chatting
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
