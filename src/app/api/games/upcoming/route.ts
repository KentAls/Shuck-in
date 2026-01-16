import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all teams user is a member of
    const userTeams = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      select: { teamId: true },
    });

    const teamIds = userTeams.map((t) => t.teamId);

    const games = await prisma.game.findMany({
      where: {
        teamId: { in: teamIds },
        startTime: { gte: new Date() },
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
      take: 10,
    });

    // Add user's RSVP status to each game
    const gamesWithUserRsvp = games.map((game) => ({
      ...game,
      userRsvp: game.rsvps.find((r) => r.userId === session.user.id) || null,
    }));

    return NextResponse.json(gamesWithUserRsvp);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
