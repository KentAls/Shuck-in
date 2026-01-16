import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const gamesWithUserRsvp = games.map((game: any) => ({
      ...game,
      userRsvp: game.rsvps.find((r: any) => r.userId === user.id) || null,
    }));

    return NextResponse.json(gamesWithUserRsvp);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
