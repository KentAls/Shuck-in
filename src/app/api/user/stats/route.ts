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

    // Get all games for teams the user is a member of
    const userTeams = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        teamId: true,
      },
    });

    const teamIds = userTeams.map((t: { teamId: string }) => t.teamId);

    // Get past games (games that have already happened)
    const now = new Date();
    const pastGames = await prisma.game.findMany({
      where: {
        teamId: { in: teamIds },
        startTime: { lt: now },
      },
      select: {
        id: true,
      },
    });

    const pastGameIds = pastGames.map((g: { id: string }) => g.id);

    // Get user's RSVPs for past games
    const userRsvps = await prisma.gameRsvp.findMany({
      where: {
        userId: user.id,
        gameId: { in: pastGameIds },
      },
      select: {
        status: true,
      },
    });

    // Calculate stats
    const gamesPlayed = userRsvps.filter((r: { status: string }) => r.status === 'IN').length;
    const totalGamesWithRsvp = userRsvps.filter(
      (r: { status: string }) => r.status === 'IN' || r.status === 'OUT'
    ).length;

    // Attendance is calculated as: games attended / games responded to (IN or OUT)
    // If no games responded to, show 0%
    const attendanceRate =
      totalGamesWithRsvp > 0
        ? Math.round((gamesPlayed / totalGamesWithRsvp) * 100)
        : 0;

    return NextResponse.json({
      gamesPlayed,
      totalPastGames: pastGames.length,
      attendanceRate,
      totalGamesWithRsvp,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
