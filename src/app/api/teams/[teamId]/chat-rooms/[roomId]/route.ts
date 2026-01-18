import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateChatRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  isArchived: z.boolean().optional(),
});

// GET /api/teams/[teamId]/chat-rooms/[roomId] - Get a single chat room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, roomId } = await params;

    // Check membership
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: { id: roomId, teamId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Error fetching chat room:', error);
    return NextResponse.json({ error: 'Failed to fetch chat room' }, { status: 500 });
  }
}

// PATCH /api/teams/[teamId]/chat-rooms/[roomId] - Update a chat room
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, roomId } = await params;

    // Check if user is admin/owner
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update chat rooms' }, { status: 403 });
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: { id: roomId, teamId },
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Prevent archiving the default room
    const body = await request.json();
    const updates = updateChatRoomSchema.parse(body);

    if (chatRoom.isDefault && updates.isArchived) {
      return NextResponse.json({ error: 'Cannot archive the default chat room' }, { status: 400 });
    }

    const updated = await prisma.chatRoom.update({
      where: { id: roomId },
      data: updates,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating chat room:', error);
    return NextResponse.json({ error: 'Failed to update chat room' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/chat-rooms/[roomId] - Delete a chat room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, roomId } = await params;

    // Check if user is owner
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    if (membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete chat rooms' }, { status: 403 });
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: { id: roomId, teamId },
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    if (chatRoom.isDefault) {
      return NextResponse.json({ error: 'Cannot delete the default chat room' }, { status: 400 });
    }

    await prisma.chatRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 });
  }
}
