import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Sanitize response to only include needed fields
    // This prevents potential serialization issues with Date objects
    const sanitizedGames = games.map((game: any) => ({
      id: game.id,
      title: game.title,
      opponent: game.opponent,
      location: game.location,
      startTime: game.startTime instanceof Date ? game.startTime.toISOString() : game.startTime,
      gameType: game.gameType,
      team: {
        id: game.team.id,
        name: game.team.name,
        color: game.team.color,
      },
      _count: game._count,
      rsvps: game.rsvps.map((r: any) => ({
        status: r.status,
        user: {
          name: r.user.name,
          image: r.user.image,
        },
      })),
      userRsvp: game.rsvps.find((r: any) => r.userId === user.id)
        ? { status: game.rsvps.find((r: any) => r.userId === user.id).status }
        : null,
    }));

    return NextResponse.json(sanitizedGames);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
