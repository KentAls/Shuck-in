import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();

    if (!isLoggedIn || !user) {
      return NextResponse.json({
        error: 'Not logged in',
        isLoggedIn,
        user: null
      });
    }

    // Get user's team memberships
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: { team: { select: { id: true, name: true } } },
    });

    // Get ALL games (no filter)
    const allGames = await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        teamId: true,
        team: { select: { name: true } },
      },
    });

    // Get user's team IDs
    const teamIds = memberships.filter((m: typeof memberships[number]) => m.status === 'ACTIVE').map((m: typeof memberships[number]) => m.teamId);

    // Get games for user's teams
    const userGames = await prisma.game.findMany({
      where: { teamId: { in: teamIds } },
      select: {
        id: true,
        title: true,
        startTime: true,
        teamId: true,
      },
    });

    // Get future games
    const futureGames = await prisma.game.findMany({
      where: {
        teamId: { in: teamIds },
        startTime: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
    });

    return NextResponse.json({
      currentTime: new Date().toISOString(),
      user: { id: user.id, email: user.email, name: user.name },
      memberships: memberships.map((m: typeof memberships[number]) => ({
        teamId: m.teamId,
        teamName: m.team.name,
        status: m.status,
        role: m.role,
      })),
      activeTeamIds: teamIds,
      allGamesInDb: allGames.map((g: typeof allGames[number]) => ({
        ...g,
        startTime: g.startTime.toISOString(),
        isFuture: g.startTime >= new Date(),
      })),
      gamesForUserTeams: userGames.map((g: typeof userGames[number]) => ({
        ...g,
        startTime: g.startTime.toISOString(),
      })),
      futureGamesForUser: futureGames.map((g: typeof futureGames[number]) => ({
        ...g,
        startTime: g.startTime.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Database error',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
