import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rsvpSchema = z.object({
  status: z.enum(['IN', 'OUT', 'MAYBE']),
  comment: z.string().max(200).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;
    const body = await request.json();
    const validatedData = rsvpSchema.parse(body);

    // Check if user is a member of the team
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.team.members.length === 0) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Upsert the RSVP
    const rsvp = await prisma.gameRsvp.upsert({
      where: {
        userId_gameId: {
          userId: user.id,
          gameId,
        },
      },
      update: {
        status: validatedData.status,
        comment: validatedData.comment,
      },
      create: {
        userId: user.id,
        gameId,
        status: validatedData.status,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(rsvp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}
