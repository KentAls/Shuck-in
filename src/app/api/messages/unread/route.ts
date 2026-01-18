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

    // Get user's last read timestamps from a separate tracking table or localStorage
    // For now, we'll use a simpler approach: count messages from the last 24 hours
    // that the user hasn't seen (messages not from the user themselves)

    // Get all teams the user is a member of
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

    if (teamIds.length === 0) {
      return NextResponse.json({ unreadCount: 0, teamCounts: {} });
    }

    // Get the user's chat notification preference
    const userPrefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: { chatNotifications: true },
    });

    // If chat notifications are disabled, return 0
    if (!userPrefs?.chatNotifications) {
      return NextResponse.json({ unreadCount: 0, teamCounts: {} });
    }

    // Get the timestamp from query param (last time user checked messages)
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');

    // Default to 24 hours ago if no timestamp provided
    const since = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count messages per team since the given timestamp, excluding user's own messages
    const messageCounts = await prisma.message.groupBy({
      by: ['teamId'],
      where: {
        teamId: { in: teamIds },
        userId: { not: user.id },
        createdAt: { gt: since },
      },
      _count: true,
    });

    const teamCounts: Record<string, number> = {};
    let totalUnread = 0;

    for (const count of messageCounts) {
      teamCounts[count.teamId] = count._count;
      totalUnread += count._count;
    }

    return NextResponse.json({
      unreadCount: totalUnread,
      teamCounts,
    });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
