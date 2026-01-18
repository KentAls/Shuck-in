import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createChatRoomSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

// GET /api/teams/[teamId]/chat-rooms - List chat rooms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Check membership
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        teamId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // If no chat rooms exist, create a default one
    if (chatRooms.length === 0) {
      const defaultRoom = await prisma.chatRoom.create({
        data: {
          name: 'General',
          description: 'Main team chat',
          isDefault: true,
          teamId,
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      // Migrate existing messages to the default room
      await prisma.message.updateMany({
        where: { teamId, chatRoomId: null },
        data: { chatRoomId: defaultRoom.id },
      });

      return NextResponse.json([defaultRoom]);
    }

    // Always migrate orphaned messages to default room
    const defaultRoom = chatRooms.find((r: typeof chatRooms[number]) => r.isDefault);
    if (defaultRoom) {
      await prisma.message.updateMany({
        where: { teamId, chatRoomId: null },
        data: { chatRoomId: defaultRoom.id },
      });
    }

    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/chat-rooms - Create a new chat room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team member (anyone can create chat rooms)
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = createChatRoomSchema.parse(body);

    const chatRoom = await prisma.chatRoom.create({
      data: {
        name,
        description,
        teamId,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(chatRoom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
  }
}
