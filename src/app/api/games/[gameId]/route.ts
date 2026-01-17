import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateGameSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  opponent: z.string().max(100).optional().nullable(),
  location: z.string().min(1).max(200).optional(),
  address: z.string().max(300).optional().nullable(),
  gameType: z.enum(['GAME', 'PRACTICE', 'SCRIMMAGE', 'TOURNAMENT', 'OTHER']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  rsvpDeadline: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = params;

    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        team: {
          members: {
            some: {
              userId: user.id,
              status: 'ACTIVE',
            },
          },
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
            sport: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                jerseyNumber: true,
                position: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' },
            { updatedAt: 'desc' },
          ],
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get user's role for this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: game.teamId,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      ...game,
      userRole: membership?.role || null,
      userRsvp: game.rsvps.find((r: any) => r.userId === user.id) || null,
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = params;

    // Get game and check permissions
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] },
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existingGame.team.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateGameSchema.parse(body);

    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        ...validatedData,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
        rsvpDeadline: validatedData.rsvpDeadline ? new Date(validatedData.rsvpDeadline) : undefined,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = params;

    // Get game and check permissions
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] },
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existingGame.team.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.game.delete({
      where: { id: gameId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
