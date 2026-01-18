import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createGameSchema = z.object({
  teamId: z.string(),
  title: z.string().min(1).max(200),
  opponent: z.string().max(100).optional().nullable(),
  location: z.string().min(1).max(200),
  address: z.string().max(300).optional().nullable(),
  gameType: z.enum(['GAME', 'PRACTICE', 'SCRIMMAGE', 'TOURNAMENT', 'OTHER']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  rsvpDeadline: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');

    // Get all teams user is a member of
    const userTeams = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: { teamId: true },
    });

    const teamIds = userTeams.map((t: any) => t.teamId);

    const games = await prisma.game.findMany({
      where: {
        teamId: teamId ? teamId : { in: teamIds },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Add user's RSVP status and serialize dates
    const gamesWithUserRsvp = games.map((game: any) => ({
      ...game,
      startTime: game.startTime instanceof Date ? game.startTime.toISOString() : game.startTime,
      endTime: game.endTime instanceof Date ? game.endTime.toISOString() : game.endTime,
      userRsvp: game.rsvps.find((r: any) => r.userId === user.id) || null,
    }));

    return NextResponse.json(gamesWithUserRsvp);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createGameSchema.parse(body);

    // Check if user is admin or owner of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: validatedData.teamId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const game = await prisma.game.create({
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        rsvpDeadline: validatedData.rsvpDeadline ? new Date(validatedData.rsvpDeadline) : null,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Create RSVP entries for all team members (PENDING status)
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: validatedData.teamId,
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    await prisma.gameRsvp.createMany({
      data: teamMembers.map((member: any) => ({
        gameId: game.id,
        userId: member.userId,
        status: 'PENDING',
      })),
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
